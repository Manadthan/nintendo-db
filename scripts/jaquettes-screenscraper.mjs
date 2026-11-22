// Jaquettes ScreenScraper (étape 26, DESIGN §11, 22/11/2026) : enregistre les boîtes déposées par la tâche GitHub
// « Relais ScreenScraper » (bucket privé gametdb, screenscraper/{console}/{jeu}/{région}.jpg) pour les versions
// toujours sans jaquette. Décision du propriétaire : planche regardée d'abord, écriture ensuite.
// Depuis la session Claude (skill script-prod) :
//   npm run session -- scripts/jaquettes-screenscraper.mjs --planche /chemin/planche.jpg   (rien n'est écrit)
//   npm run session -- scripts/jaquettes-screenscraper.mjs                                (écriture)
//   npm run session -- scripts/jaquettes-screenscraper.mjs --sauf 3,17                    (écriture, sans les n° 3 et 17
//                                                                                          de la planche)
// Les boîtes rapprochées sans titre identique (screenscraper-approche/…) sont marquées « ≈ » sur la planche.
// Une version qui a déjà une jaquette (quelle qu'en soit la source) n'est jamais touchée. Même conversion que
// l'application (WebP 300 / 600 / 768 px, chemin versionné, ADR-04) ; source « screenscraper ».
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const TAILLES = [300, 600, 768];
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const i = process.argv.indexOf("--planche");
const planche = i > 0 ? process.argv[i + 1] : null;
const j = process.argv.indexOf("--sauf");
const sauf = new Set(j > 0 ? process.argv[j + 1].split(",").map(Number) : []);

async function lister(dossier) {
  const { data, error } = await supabase.storage.from("gametdb").list(dossier, { limit: 1000 });
  if (error) throw new Error(`${dossier} : ${error.message}`);
  return data.map((d) => d.name);
}
/** [console, jeu, région, chemin, rapprochée sans titre identique] de chaque boîte déposée. */
const deposees = [];
for (const racine of ["screenscraper", "screenscraper-approche"])
  for (const console_ of await lister(racine))
    for (const jeu of await lister(`${racine}/${console_}`))
      for (const fichier of await lister(`${racine}/${console_}/${jeu}`)) {
        const region = fichier.replace(/\.jpg$/, "");
        if (["JAP", "US", "PAL"].includes(region))
          deposees.push([console_, jeu, region, `${racine}/${console_}/${jeu}/${fichier}`, racine !== "screenscraper"]);
      }
// Seules les versions encore sans jaquette comptent ; la planche les numérote dans cet ordre.
const boites = [];
const ignorees = [];
for (const [console_, slug, region, chemin, approche] of deposees) {
  const nom = `${console_} ${slug} ${region}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select("game_id, sortie, jaquette_path, games!inner(slug, consoles!inner(slug))")
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", console_)
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie?.sortie) ignorees.push(`${nom} (version absente)`);
  else if (!sortie.jaquette_path) boites.push({ console_, slug, region, chemin, approche, nom, gameId: sortie.game_id });
}
console.log(`${deposees.length} boîte(s) déposée(s) par le relais ; ${boites.length} pour des versions sans jaquette`);

async function telecharger(chemin) {
  const { data, error } = await supabase.storage.from("gametdb").download(chemin);
  if (error) throw new Error(`${chemin} : ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

if (planche) {
  if (!boites.length) {
    console.log("Aucune boîte à montrer.");
    process.exit(0);
  }
  // Planche : vignettes de 160 px de large, 6 par ligne, légende « console jeu région » sous chacune.
  const L = 160, H = 230, COLS = 6;
  const echappe = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const vignettes = [];
  for (const [n, { console_, slug: jeu, region, chemin, approche }] of boites.entries()) {
    const image = await sharp(await telecharger(chemin)).resize(L, H - 30, { fit: "contain", background: "#ffffff" }).toBuffer();
    const legende = Buffer.from(
      `<svg width="${L}" height="30"><text x="2" y="12" font-size="10" font-family="sans-serif">${echappe(`${n + 1}. ${approche ? "≈ " : ""}${console_} ${region}`)}</text>` +
        `<text x="2" y="25" font-size="9" font-family="sans-serif">${echappe(jeu.slice(0, 30))}</text></svg>`,
    );
    vignettes.push({ input: image, left: (n % COLS) * L, top: Math.floor(n / COLS) * H });
    vignettes.push({ input: legende, left: (n % COLS) * L, top: Math.floor(n / COLS) * H + H - 30 });
  }
  await sharp({ create: { width: COLS * L, height: Math.ceil(boites.length / COLS) * H, channels: 3, background: "#ffffff" } })
    .composite(vignettes)
    .jpeg({ quality: 80 })
    .toFile(planche);
  console.log(`Planche : ${planche}`);
  process.exit(0);
}

let copiees = 0;
for (const [n, { region, chemin, nom, gameId }] of boites.entries()) {
  if (sauf.has(n + 1)) {
    ignorees.push(`${nom} (n° ${n + 1} refusé sur la planche)`);
    continue;
  }
  const image = await telecharger(chemin);
  const base = `${gameId}/${region.toLowerCase()}-${Date.now().toString(36)}`;
  for (const taille of TAILLES) {
    const webp = await sharp(image, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: taille, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const { error: e } = await supabase.storage
      .from("jaquettes")
      .upload(`${base}-${taille}.webp`, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (e) throw new Error(`${nom} : ${e.message}`);
  }
  const { error: e } = await supabase
    .from("releases")
    .update({ jaquette_path: base, jaquette_source: "screenscraper" })
    .eq("game_id", gameId)
    .eq("region", region)
    .is("jaquette_path", null);
  if (e) throw new Error(`${nom} : ${e.message}`);
  copiees++;
  console.log(`${nom} : boîte ScreenScraper`);
}
console.log(`${copiees} jaquette(s) ScreenScraper copiée(s) ; ${ignorees.length} ignorée(s)`);
for (const x of ignorees) console.log(`  ${x}`);
