// Jaquettes ScreenScraper (étape 26, DESIGN §11, 22/11/2026) : enregistre les boîtes déposées par la tâche GitHub
// « Relais ScreenScraper » (bucket privé gametdb, screenscraper/{console}/{jeu}/{région}.jpg) pour les versions
// toujours sans jaquette. Décision du propriétaire : planche regardée d'abord, écriture ensuite.
// Depuis la session Claude (skill script-prod) :
//   npm run session -- scripts/jaquettes-screenscraper.mjs --planche /chemin/planche.jpg   (rien n'est écrit)
//   npm run session -- scripts/jaquettes-screenscraper.mjs                                (écriture)
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

async function lister(dossier) {
  const { data, error } = await supabase.storage.from("gametdb").list(dossier, { limit: 1000 });
  if (error) throw new Error(`${dossier} : ${error.message}`);
  return data.map((d) => d.name);
}
/** [console, jeu, région, chemin] de chaque boîte déposée. */
const boites = [];
for (const console_ of await lister("screenscraper"))
  for (const jeu of await lister(`screenscraper/${console_}`))
    for (const fichier of await lister(`screenscraper/${console_}/${jeu}`)) {
      const region = fichier.replace(/\.jpg$/, "");
      if (["JAP", "US", "PAL"].includes(region)) boites.push([console_, jeu, region, `screenscraper/${console_}/${jeu}/${fichier}`]);
    }
console.log(`${boites.length} boîte(s) déposée(s) par le relais`);

async function telecharger(chemin) {
  const { data, error } = await supabase.storage.from("gametdb").download(chemin);
  if (error) throw new Error(`${chemin} : ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

if (planche) {
  // Planche : vignettes de 160 px de large, 6 par ligne, légende « console jeu région » sous chacune.
  const L = 160, H = 230, COLS = 6;
  const echappe = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const vignettes = [];
  for (const [n, [console_, jeu, region, chemin]] of boites.entries()) {
    const image = await sharp(await telecharger(chemin)).resize(L, H - 30, { fit: "contain", background: "#ffffff" }).toBuffer();
    const legende = Buffer.from(
      `<svg width="${L}" height="30"><text x="2" y="12" font-size="10" font-family="sans-serif">${echappe(`${n + 1}. ${console_} ${region}`)}</text>` +
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
const ignorees = [];
for (const [console_, slug, region, chemin] of boites) {
  const nom = `${console_} ${slug} ${region}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select("game_id, sortie, jaquette_path, games!inner(slug, consoles!inner(slug))")
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", console_)
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie?.sortie) {
    ignorees.push(`${nom} (version absente)`);
    continue;
  }
  if (sortie.jaquette_path) {
    ignorees.push(`${nom} (a déjà une jaquette)`);
    continue;
  }
  const image = await telecharger(chemin);
  const base = `${sortie.game_id}/${region.toLowerCase()}-${Date.now().toString(36)}`;
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
    .eq("game_id", sortie.game_id)
    .eq("region", region)
    .is("jaquette_path", null);
  if (e) throw new Error(`${nom} : ${e.message}`);
  copiees++;
  console.log(`${nom} : boîte ScreenScraper`);
}
console.log(`${copiees} jaquette(s) ScreenScraper copiée(s) ; ${ignorees.length} ignorée(s)`);
for (const x of ignorees) console.log(`  ${x}`);
