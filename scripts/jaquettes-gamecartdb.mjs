// Jaquettes Switch 2 copiées de gamecartdb.com (choix du propriétaire, 19/11/2026 ; SPEC v1.26) : boîte américaine
// (« {release}.webp », logo ESRB) pour la version US, européenne (« {release}--europe.webp », PEGI) pour la PAL.
// gamecartdb n'a pas de boîte japonaise. Lancé à la main depuis la session Claude, comme le relais :
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-gamecartdb.mjs
// Une image à la fois, 2 s d'écart (conditions de gamecartdb : pas de requêtes en masse). Une jaquette ajoutée à la
// main (photo, adresse) ou déjà copiée de gamecartdb n'est jamais remplacée. Même conversion que l'application
// (WebP 300 / 600 / 768 px, chemin versionné, ADR-04).
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

/** Jeu du site → release de gamecartdb (repérés à la main le 19/11/2026 ; Fire Emblem ajouté le 20/11/2026 ; Pokémon Pokopia et Fitness Boxing 3 absents de gamecartdb). */
const RELEASES = {
  "animal-crossing-new-horizons-nintendo-switch-2-edition": "rel-western-animal-crossing-new-horizons-nintendo-switch-2-edition",
  "the-legend-of-zelda-breath-of-the-wild-nintendo-switch-2-edition": "rel-western-the-legend-of-zelda-breath-of-the-wild-for-nintendo-switch-2-edition",
  "super-mario-bros-wonder-nintendo-switch-2-edition-meetup-in-bellabel-park": "rel-western-super-mario-bros-wonder-nintendo-switch-2-edition-meetup-in-bellabel-park",
  "nintendo-switch-sports-resort": "rel-western-nintendo-switch-sports-resort",
  "the-legend-of-zelda-tears-of-the-kingdom-nintendo-switch-2-edition": "rel-western-the-legend-of-zelda-tears-of-the-kingdom-for-nintendo-switch-2-edition",
  "pikmin-4-nintendo-switch-2-edition-dandori-academy": "rel-western-pikmin-4-nintendo-switch-2-edition-dandori-academy",
  "super-mario-party-jamboree-nintendo-switch-2-edition-jamboree-tv": "rel-western-super-mario-party-jamboree-nintendo-switch-2-edition-jamboree-tv",
  "pokemon-legends-z-a-nintendo-switch-2-edition": "rel-western-pokemon-legends-z-a-for-nintendo-switch-2-edition",
  "xenoblade-chronicles-definitive-edition-nintendo-switch-2-edition": "rel-western-xenoblade-chronicles-definitive-edition-nintendo-switch-2-edition",
  "xenoblade-chronicles-2-nintendo-switch-2-edition": "rel-western-xenoblade-chronicles-2-nintendo-switch-2-edition",
  "mario-kart-world": "rel-western-mario-kart-world",
  "kirby-air-riders": "rel-western-kirby-air-riders",
  "mario-tennis-fever": "rel-western-mario-tennis-fever",
  "splatoon-raiders": "rel-western-splatoon-raiders",
  "metroid-prime-4-beyond-nintendo-switch-2-edition": "rel-western-metroid-prime-4-beyond-nintendo-switch-2-edition",
  "star-fox": "rel-western-star-fox",
  "donkey-kong-bananza": "rel-western-donkey-kong-bananza",
  "hyrule-warriors-age-of-imprisonment": "rel-western-hyrule-warriors-age-of-imprisonment",
  "kirby-and-the-forgotten-land-nintendo-switch-2-edition-star-crossed-world": "rel-western-kirby-and-the-forgotten-land-nintendo-switch-2-edition-star-crossed-world",
  "the-legend-of-zelda-ocarina-of-time": "rel-western-the-legend-of-zelda-ocarina-of-time",
  "xenoblade-chronicles-x-definitive-edition-nintendo-switch-2-edition": "rel-western-xenoblade-chronicles-x-definitive-edition-nintendo-switch-2-edition",
  "yoshi-and-the-mysterious-book": "rel-western-yoshi-and-the-mysterious-book",
  "fire-emblem-fortunes-weave": "rel-western-fire-emblem-fortune-s-weave",
};
const FICHIER = { US: "", PAL: "--europe" };
const TAILLES = [300, 600, 768];
const GARDEES = new Set(["photo", "url", "gamecartdb"]);

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const { data: jeux, error } = await supabase
  .from("games")
  .select("id, slug, consoles!inner(slug), releases(region, sortie, jaquette_path, jaquette_source)")
  .eq("consoles.slug", "switch-2")
  .in("slug", Object.keys(RELEASES));
if (error) throw new Error(`Jeux Switch 2 illisibles : ${error.message}`);

let copiees = 0;
const ignorees = [];
for (const jeu of jeux) {
  for (const region of ["US", "PAL"]) {
    const sortie = jeu.releases.find((r) => r.region === region);
    if (!sortie?.sortie) continue;
    if (GARDEES.has(sortie.jaquette_source)) {
      ignorees.push(`${jeu.slug} ${region} (déjà : ${sortie.jaquette_source})`);
      continue;
    }
    const adresse = `https://gamecartdb.com/covers/${RELEASES[jeu.slug]}${FICHIER[region]}.webp`;
    await pause(2000);
    const reponse = await fetch(adresse, { headers: { "User-Agent": "nintendo-db (jaquettes Switch 2)" } });
    if (!reponse.ok) {
      ignorees.push(`${jeu.slug} ${region} (HTTP ${reponse.status})`);
      continue;
    }
    const image = Buffer.from(await reponse.arrayBuffer());
    const version = Date.now().toString(36);
    const base = `${jeu.id}/${region.toLowerCase()}-${version}`;
    for (const taille of TAILLES) {
      const webp = await sharp(image, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: taille, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const { error: e } = await supabase.storage
        .from("jaquettes")
        .upload(`${base}-${taille}.webp`, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (e) throw new Error(`${jeu.slug} ${region} : ${e.message}`);
    }
    const { error: e } = await supabase
      .from("releases")
      .update({ jaquette_path: base, jaquette_source: "gamecartdb" })
      .eq("game_id", jeu.id)
      .eq("region", region);
    if (e) throw new Error(`${jeu.slug} ${region} : ${e.message}`);
    if (sortie.jaquette_path && sortie.jaquette_path !== base)
      await supabase.storage.from("jaquettes").remove(TAILLES.map((t) => `${sortie.jaquette_path}-${t}.webp`));
    copiees++;
    console.log(`${jeu.slug} ${region} : copiée`);
  }
}
console.log(`${copiees} jaquette(s) copiée(s) de gamecartdb ; ${ignorees.length} ignorée(s)`);
for (const i of ignorees) console.log(`  ${i}`);
