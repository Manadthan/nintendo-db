// Jaquettes encore manquantes après le 23/11/2026 (19 versions), choix du propriétaire le même jour :
// - 3 Wii JAP : boîte japonaise de GameTDB. L'import n'en avait pas, faute de grande boîte (coverfullHQ) : face avant
//   découpée dans la boîte entière (coverfull, 512 px) quand elle existe, sinon petite boîte (cover, 160 px).
// - Pokémon Pokopia JAP : boîte officielle de Nintendo Asie (même visuel que la japonaise, sans logo CERO), en
//   attendant mieux ; source « nintendo », que l'import ne remplace pas. Boîtier rouge retiré (SPEC v1.44, gabarit
//   « nintendo » de src/lib/jaquettes/boitier.ts : mêmes épaisseurs mesurées sur cette image).
// - Versions sans boîte décochées (sortie = false, verrouillée) : Advance Wars 1+2: Re-Boot Camp JAP (jamais sorti au
//   Japon), Fitness Boxing 3 – Nintendo Switch 2 Edition US (vendu en téléchargement seulement).
// Seules les versions encore sans jaquette (ou encore cochées) sont écrites.
//   npm run session -- scripts/jaquettes-restantes.mjs           (essai : rien n'est écrit)
//   npm run session -- scripts/jaquettes-restantes.mjs --ecrire
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { decouperFaceAvant } from "../src/lib/import/relais-wii.ts";
import {
  aUnBoitier,
  GABARITS,
  zoneSansBoitier,
} from "../src/lib/jaquettes/boitier.ts";

const GAMETDB = "https://art.gametdb.com/wii/";
/** [console, jeu, région, source, boîte, découpe de la face avant]. */
const BOITES = [
  [
    "wii",
    "another-code-r-a-journey-into-lost-memories",
    "JAP",
    "gametdb",
    `${GAMETDB}coverfull/JA/RNOJ01.png`,
    true,
  ],
  [
    "wii",
    "big-brain-academy-for-wii",
    "JAP",
    "gametdb",
    `${GAMETDB}coverfull/JA/RYWJ01.png`,
    true,
  ],
  [
    "wii",
    "flingsmash",
    "JAP",
    "gametdb",
    `${GAMETDB}cover/JA/R22J01.png`,
    false,
  ],
  [
    "switch-2",
    "pokemon-pokopia",
    "JAP",
    "nintendo",
    "https://www.nintendo.com/my/games/switch2/aab5a/img/sw2_PokemonPokopia.png",
    false,
  ],
];
/** [console, jeu, région, raison]. */
const DECOCHEES = [
  ["switch", "advance-wars-1-2-re-boot-camp", "JAP", "jamais sorti au Japon"],
  [
    "switch-2",
    "fitness-boxing-3-your-personal-trainer-nintendo-switch-2-edition",
    "US",
    "téléchargement seulement",
  ],
];
const TAILLES = [300, 600, 768];

const ecrire = process.argv.includes("--ecrire");
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
/** Téléchargement réessayé 3 fois (connexions coupées par GameTDB). */
async function telecharger(url) {
  for (let essai = 1; ; essai++) {
    try {
      return await fetch(url);
    } catch (e) {
      if (essai === 3) throw e;
      await pause(3000 * essai);
    }
  }
}

/** Boîte officielle sans son boîtier (image laissée telle quelle si aucun boîtier n'est vu). */
async function sansBoitier(image) {
  const { data, info } = await sharp(image)
    .flatten({ background: "#ffffff" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (!aUnBoitier(data, info.width, info.height)) return image;
  return sharp(image)
    .extract(zoneSansBoitier(info.width, info.height, GABARITS.nintendo))
    .png()
    .toBuffer();
}

async function lire(consoleSlug, slug, region) {
  const { data, error } = await supabase
    .from("releases")
    .select(
      "game_id, sortie, jaquette_path, verrous, games!inner(slug, consoles!inner(slug))",
    )
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", consoleSlug)
    .maybeSingle();
  if (error)
    throw new Error(`${consoleSlug} ${slug} ${region} : ${error.message}`);
  return data;
}

let copiees = 0;
let decochees = 0;
const ignorees = [];
for (const [consoleSlug, slug, region, source, adresse, decouper] of BOITES) {
  const nom = `${consoleSlug} ${slug} ${region}`;
  const v = await lire(consoleSlug, slug, region);
  if (!v?.sortie) {
    ignorees.push(`${nom} (version absente)`);
    continue;
  }
  if (v.jaquette_path) {
    ignorees.push(`${nom} (a déjà une jaquette)`);
    continue;
  }
  await pause(1000);
  const r = await telecharger(adresse);
  if (!r.ok) {
    ignorees.push(`${nom} (HTTP ${r.status})`);
    continue;
  }
  const brute = new Uint8Array(await r.arrayBuffer());
  const image = decouper
    ? await decouperFaceAvant(brute)
    : source === "nintendo"
      ? await sansBoitier(Buffer.from(brute))
      : Buffer.from(brute);
  if (ecrire) {
    const base = `${v.game_id}/${region.toLowerCase()}-${Date.now().toString(36)}`;
    for (const taille of TAILLES) {
      const webp = await sharp(image, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: taille, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const { error: e } = await supabase.storage
        .from("jaquettes")
        .upload(`${base}-${taille}.webp`, webp, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
      if (e) throw new Error(`${nom} : ${e.message}`);
    }
    const { error: e } = await supabase
      .from("releases")
      .update({ jaquette_path: base, jaquette_source: source })
      .eq("game_id", v.game_id)
      .eq("region", region);
    if (e) throw new Error(`${nom} : ${e.message}`);
  }
  copiees++;
  const { width, height } = await sharp(image).metadata();
  console.log(`${nom} : jaquette ${source} (${width} × ${height})`);
}
for (const [consoleSlug, slug, region, raison] of DECOCHEES) {
  const nom = `${consoleSlug} ${slug} ${region}`;
  const v = await lire(consoleSlug, slug, region);
  if (!v?.sortie) {
    ignorees.push(`${nom} (déjà décochée)`);
    continue;
  }
  if (ecrire) {
    const { error } = await supabase
      .from("releases")
      .update({
        sortie: false,
        verrous: [...new Set([...v.verrous, "sortie"])],
      })
      .eq("game_id", v.game_id)
      .eq("region", region);
    if (error) throw new Error(`${nom} : ${error.message}`);
  }
  decochees++;
  console.log(`${nom} : décochée (${raison})`);
}
console.log(
  `${ecrire ? "" : "ESSAI : "}${copiees} jaquette(s), ${decochees} version(s) décochée(s) ; ${ignorees.length} ignorée(s)`,
);
for (const i of ignorees) console.log(`  ignorée : ${i}`);
