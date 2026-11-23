// Captures RAWG (étape 28, SPEC US-26, DESIGN ADR-18 point 5, 22/11/2026) : écrit en base les captures déposées par
// la tâche GitHub « Relais RAWG » (bucket privé gametdb, rawg/{console}.json). Décision du propriétaire : planche
// regardée d'abord, écriture ensuite. Depuis la session Claude (skill script-prod) :
//   npm run session -- scripts/captures-rawg.mjs --planche /dossier        (une planche JPEG par console, rien n'est écrit)
//   npm run session -- scripts/captures-rawg.mjs                           (écriture)
//   npm run session -- scripts/captures-rawg.mjs --sauf 3,17               (écriture, sans les n° 3 et 17 de la planche)
//   … --console nes                                                         (une seule console)
// Sur la planche, « ≈ » marque un jeu RAWG dont le titre n'est pas exactement le nôtre (suffixe « (1989) », « The »…).
// Pour chaque jeu retenu : ses captures sont remplacées (6 au plus) et games.rawg_slug renseigné. Les images restent
// chez RAWG (media.rawg.io) : rien n'est copié dans le stockage.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const option = (nom) => {
  const i = process.argv.indexOf(nom);
  return i > 0 ? process.argv[i + 1] : null;
};
const planche = option("--planche");
const seule = option("--console");
const sauf = new Set((option("--sauf") ?? "").split(",").filter(Boolean).map(Number));
const simple = (t) => (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// 1. Fichiers du relais ; la planche numérote les jeux trouvés dans cet ordre (console, puis slug).
const { data: fichiers, error } = await supabase.storage.from("gametdb").list("rawg", { limit: 100 });
if (error) throw new Error(`rawg/ : ${error.message}`);
const trouves = [];
for (const { name } of fichiers.filter((f) => f.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name))) {
  const console_ = name.replace(/\.json$/, "");
  if (seule && console_ !== seule) continue;
  const { data, error: e } = await supabase.storage.from("gametdb").download(`rawg/${name}`);
  if (e) throw new Error(`rawg/${name} : ${e.message}`);
  for (const l of JSON.parse(await data.text()))
    if (l.rawg && l.captures.length) trouves.push({ ...l, console_, approche: simple(l.titre) !== simple(l.rawg.nom) });
}
console.log(`${trouves.length} jeu(x) avec captures dans ${fichiers.length} fichier(s)`);

if (planche) {
  // Une planche par console : 1re capture de chaque jeu (version 640 de RAWG), 5 par ligne, légende sous chacune.
  mkdirSync(planche, { recursive: true });
  const L = 240, H = 135, LEG = 34, COLS = 5;
  const echappe = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const vignette = async (url) => {
    const r = await fetch(url.replace("/media/", "/media/resize/640/-/")).catch(() => null);
    if (!r?.ok) return sharp({ create: { width: L, height: H, channels: 3, background: "#cc3333" } }).png().toBuffer();
    return sharp(Buffer.from(await r.arrayBuffer())).resize(L, H, { fit: "cover" }).toBuffer();
  };
  for (const console_ of [...new Set(trouves.map((t) => t.console_))]) {
    const jeux = trouves.map((t, n) => ({ ...t, n: n + 1 })).filter((t) => t.console_ === console_);
    const couches = [];
    for (let i = 0; i < jeux.length; i += 8) {
      const lot = jeux.slice(i, i + 8);
      const images = await Promise.all(lot.map((j) => vignette(j.captures[0].url)));
      lot.forEach((j, k) => {
        const p = i + k, x = (p % COLS) * L, y = Math.floor(p / COLS) * (H + LEG);
        couches.push({ input: images[k], left: x, top: y });
        const l1 = `${j.n}. ${j.approche ? "≈ " : ""}${j.titre}`.slice(0, 42);
        const l2 = `RAWG : ${j.rawg.nom} (${j.captures.length})`.slice(0, 46);
        couches.push({
          input: Buffer.from(
            `<svg width="${L}" height="${LEG}"><text x="3" y="13" font-size="11" font-family="sans-serif" font-weight="bold" fill="${j.approche ? "#b00" : "#000"}">${echappe(l1)}</text>` +
              `<text x="3" y="28" font-size="10" font-family="sans-serif" fill="#444">${echappe(l2)}</text></svg>`,
          ),
          left: x,
          top: y + H,
        });
      });
    }
    const fichier = join(planche, `rawg-${console_}.jpg`);
    await sharp({ create: { width: COLS * L, height: Math.ceil(jeux.length / COLS) * (H + LEG), channels: 3, background: "#ffffff" } })
      .composite(couches)
      .jpeg({ quality: 78 })
      .toFile(fichier);
    console.log(`Planche ${console_} : ${fichier} (${jeux.length} jeux, n° ${jeux[0].n} à ${jeux.at(-1).n}, ${jeux.filter((j) => j.approche).length} « ≈ »)`);
  }
  process.exit(0);
}

// 2. Écriture.
let ecrits = 0;
const ignores = [];
for (const [i, j] of trouves.entries()) {
  const nom = `${j.console_}/${j.slug}`;
  if (sauf.has(i + 1)) {
    ignores.push(`${nom} (n° ${i + 1} refusé sur la planche)`);
    continue;
  }
  const { data: jeu, error: e } = await supabase
    .from("games")
    .select("id, consoles!inner(slug)")
    .eq("slug", j.slug)
    .eq("consoles.slug", j.console_)
    .maybeSingle();
  if (e) throw new Error(`${nom} : ${e.message}`);
  if (!jeu) {
    ignores.push(`${nom} (jeu absent du catalogue)`);
    continue;
  }
  const { error: e1 } = await supabase.from("captures").delete().eq("game_id", jeu.id);
  if (e1) throw new Error(`${nom} : ${e1.message}`);
  const lignes = j.captures.map((c) => ({ game_id: jeu.id, position: c.position, url: c.url, largeur: c.largeur, hauteur: c.hauteur }));
  const { error: e2 } = await supabase.from("captures").insert(lignes);
  if (e2) throw new Error(`${nom} : ${e2.message}`);
  const { error: e3 } = await supabase.from("games").update({ rawg_slug: j.rawg.slug }).eq("id", jeu.id);
  if (e3) throw new Error(`${nom} : ${e3.message}`);
  ecrits++;
}
console.log(`${ecrits} jeu(x) avec captures écrit(s) ; ${ignores.length} ignoré(s)`);
for (const x of ignores) console.log(`  ${x}`);
