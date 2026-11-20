// Jaquettes PAL avec logo USK remplacées par une boîte PEGI seul (choix du propriétaire, 20/11/2026) : sur 854
// jaquettes PAL passées en revue sur planche, 31 portent le logo USK (boîte allemande) ; une boîte PEGI seul n'a été
// trouvée que pour ces 3 jeux (GameTDB, boîtes françaises ; packshots de nintendo.com/eu). Les 28 autres restent.
// Lancé à la main depuis une session Claude qui a la clé Supabase et atteint GameTDB, comme le relais :
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-sans-usk.mjs
// Une image par seconde. Une jaquette ajoutée à la main (photo, adresse) n'est jamais touchée. Même conversion que
// l'application (WebP 300 / 600 / 768 px, chemin versionné, ADR-04). Pour une boîte GameTDB, le scan du relais
// (bucket gametdb) est remplacé aussi, pour qu'un import qui recopie les scans reste cohérent.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

/** [console, jeu du site, source, image, scan du relais à remplacer (boîte GameTDB)]. */
const BOITES = [
  [
    "3ds",
    "mario-luigi-superstar-saga-bowsers-minions",
    "gametdb",
    "https://art.gametdb.com/3ds/coverHQ/FR/BRMP.jpg",
    "3ds/scans/BRMP",
  ],
  [
    "3ds",
    "bravely-second-end-layer",
    "nintendo",
    "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_BravelySecondEndLayer_FRA_image500w.jpg",
  ],
  [
    // La boîte française de GameTDB porte aussi l'USK : boîte anglaise de Nintendo, PEGI seul, même titre.
    "wii-u",
    "the-legend-of-zelda-twilight-princess-hd",
    "nintendo",
    "https://www.nintendo.com/eu/media/images/05_packshots/games_13/wiiu_6/PS_WiiU_TheLegendOfZeldaTwilightPrincessHD_UKV_image500w.jpg",
  ],
];
const TAILLES = [300, 600, 768];
const GARDEES = new Set(["photo", "url"]);

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let copiees = 0;
const ignorees = [];
for (const [consoleSlug, slug, source, adresse, scan] of BOITES) {
  const nom = `${consoleSlug} ${slug}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select("game_id, sortie, jaquette_path, jaquette_source, games!inner(slug, consoles!inner(slug))")
    .eq("region", "PAL")
    .eq("games.slug", slug)
    .eq("games.consoles.slug", consoleSlug)
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie?.sortie) {
    ignorees.push(`${nom} (pas de version PAL)`);
    continue;
  }
  if (GARDEES.has(sortie.jaquette_source)) {
    ignorees.push(`${nom} (ajoutée à la main : ${sortie.jaquette_source})`);
    continue;
  }
  await pause(1000);
  const reponse = await fetch(adresse);
  if (!reponse.ok) {
    ignorees.push(`${nom} (HTTP ${reponse.status})`);
    continue;
  }
  const image = Buffer.from(await reponse.arrayBuffer());
  const base = `${sortie.game_id}/pal-${Date.now().toString(36)}`;
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
  if (scan) {
    const { error: e } = await supabase.storage
      .from("gametdb")
      .upload(`${scan}.jpg`, image, { contentType: "image/jpeg", upsert: true });
    if (e) throw new Error(`${nom} (scan) : ${e.message}`);
  }
  const { error: e } = await supabase
    .from("releases")
    .update({ jaquette_path: base, jaquette_source: source })
    .eq("game_id", sortie.game_id)
    .eq("region", "PAL");
  if (e) throw new Error(`${nom} : ${e.message}`);
  if (sortie.jaquette_path && sortie.jaquette_path !== base)
    await supabase.storage.from("jaquettes").remove(TAILLES.map((t) => `${sortie.jaquette_path}-${t}.webp`));
  copiees++;
  console.log(`${nom} : boîte PEGI seul (${source})`);
}
console.log(`${copiees} jaquette(s) PAL sans USK copiée(s) ; ${ignorees.length} ignorée(s)`);
for (const i of ignorees) console.log(`  ${i}`);
