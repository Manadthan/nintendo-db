// Jaquettes Switch 2 manquantes vérifiées visuellement le 27/11/2026 (planche avant/après retrait du boîtier) :
// 8 sorties physiques avec vraie boîte officielle (CERO / PEGI) ; les 10 autres sorties Switch 2 encore sans jaquette
// sont des titres annoncés pour 2027 sans jaquette officielle définitive (boîte noire « DUMMY » ou visuel temporaire
// sans logo PEGI) et restent volontairement vides.
//
// Seules les sorties cochées (`sortie = true`) encore sans jaquette (`jaquette_path IS NULL`) sont remplies : rien
// n'est jamais écrasé. Boîtier plastique rouge retiré avant conversion (SPEC v1.44, gabarits de
// `src/lib/jaquettes/boitier.ts`), puis conversion WebP 300 / 600 / 768 px (ADR-04) dans le bucket « jaquettes ».
//
// Modes :
//   node scripts/jaquettes-switch-2-manquantes.mjs --verifier   (vérifie les 8 URL et le recadrage, sans Supabase)
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-switch-2-manquantes.mjs --essai
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-switch-2-manquantes.mjs
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  aUnBoitier,
  GABARITS,
  zoneSansBoitier,
} from "../src/lib/jaquettes/boitier.ts";

/**
 * [slug du jeu Switch 2, région, jaquette_source, gabarit boîtier, URL de la boîte vérifiée].
 * Source « gamecartdb » pour les boîtes PEGI de gamecartdb.com, « url » pour les packshots officiels
 * récupérés chez Micromania FR (PAL) et Rakuten Books Japon (JAP).
 */
const BOITES = [
  [
    "pokemon-pokopia",
    "PAL",
    "url",
    "gamecartdb",
    "https://www.micromania.fr/dw/image/v2/BCRB_PRD/on/demandware.static/-/Sites-masterCatalog_Micromania/default/dw4bb81051/images/high-res/156092.jpg?sw=1080&sh=1080&sm=fit",
  ],
  [
    "hyrule-warriors-age-of-imprisonment",
    "JAP",
    "url",
    "nintendo",
    "https://shop.r10s.jp/book/cabinet/1102/4988615211102.jpg",
  ],
  [
    "pokemon-legends-z-a-nintendo-switch-2-edition",
    "JAP",
    "url",
    "nintendo",
    "https://shop.r10s.jp/book/cabinet/3574/4902370553574.jpg",
  ],
  [
    "fitness-boxing-3-your-personal-trainer-nintendo-switch-2-edition",
    "JAP",
    "url",
    "nintendo",
    "https://shop.r10s.jp/book/cabinet/4881/4965857104881.jpg",
  ],
  [
    "xenoblade-chronicles-3-nintendo-switch-2-edition",
    "JAP",
    "url",
    "nintendo",
    "https://shop.r10s.jp/book/cabinet/4441/4902370554441.jpg",
  ],
  [
    "xenoblade-chronicles-3-nintendo-switch-2-edition",
    "PAL",
    "gamecartdb",
    "gamecartdb",
    "https://gamecartdb.com/covers/rel-western-xenoblade-chronicles-3-nintendo-switch-2-edition--europe.webp",
  ],
  [
    "metroid-ravenous",
    "JAP",
    "url",
    "nintendo",
    "https://shop.r10s.jp/book/cabinet/4632/4902370554632.jpg",
  ],
  [
    "metroid-ravenous",
    "PAL",
    "gamecartdb",
    "gamecartdb",
    "https://gamecartdb.com/covers/rel-western-metroid-ravenous--europe.webp",
  ],
];

const TAILLES = [300, 600, 768];
const verifier = process.argv.includes("--verifier");
const essai = process.argv.includes("--essai");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Téléchargement avec réessais (3 tentatives) et en-tête compatible CDN. */
async function telecharger(url) {
  const headers = {
    "User-Agent": url.includes("gamecartdb.com")
      ? "nintendo-db (jaquettes Switch 2)"
      : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  };
  for (let tentative = 1; ; tentative++) {
    try {
      const reponse = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!reponse.ok) {
        if (tentative === 3 || reponse.status === 404) return reponse;
        await pause(2000 * tentative);
        continue;
      }
      return reponse;
    } catch (e) {
      if (tentative === 3) throw e;
      await pause(2000 * tentative);
    }
  }
}

/** Retire le boîtier plastique rouge Switch 2 s'il est détecté ; laisse la jaquette plate intacte. */
async function preparerJaquette(image, nomGabarit) {
  const meta = await sharp(image, { limitInputPixels: 40_000_000 }).metadata();
  if (!meta.width || !meta.height || meta.height < meta.width * 1.3) {
    throw new Error(
      `image non portrait (${meta.width ?? "?"}×${meta.height ?? "?"})`,
    );
  }
  const { data, info } = await sharp(image, { limitInputPixels: 40_000_000 })
    .extract({ left: 0, top: 0, width: meta.width - 2, height: meta.height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const boitierDetecte = aUnBoitier(data, info.width, info.height);
  if (!boitierDetecte) {
    return {
      image,
      boitierDetecte: false,
      avant: `${meta.width}×${meta.height}`,
      apres: `${meta.width}×${meta.height}`,
    };
  }
  const zone = zoneSansBoitier(meta.width, meta.height, GABARITS[nomGabarit]);
  const recadree = await sharp(image, { limitInputPixels: 40_000_000 })
    .extract(zone)
    .png()
    .toBuffer();
  return {
    image: recadree,
    boitierDetecte: true,
    avant: `${meta.width}×${meta.height}`,
    apres: `${zone.width}×${zone.height}`,
  };
}

if (verifier) {
  let ok = 0;
  for (const [slug, region, source, gabarit, adresse] of BOITES) {
    await pause(adresse.includes("gamecartdb.com") ? 2000 : 500);
    const reponse = await telecharger(adresse);
    if (!reponse.ok) {
      throw new Error(`${slug} ${region} : HTTP ${reponse.status}`);
    }
    const brut = Buffer.from(await reponse.arrayBuffer());
    const prep = await preparerJaquette(brut, gabarit);
    ok++;
    console.log(
      `OK ${slug} ${region} (${source}) : ${prep.avant} → ${prep.apres} (${prep.boitierDetecte ? "boîtier retiré" : "sans boîtier"})`,
    );
  }
  console.log(`${ok}/${BOITES.length} jaquettes vérifiées`);
  process.exit(0);
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

let ajoutees = 0;
const ignorees = [];
const erreurs = [];

for (const [slug, region, source, gabarit, adresse] of BOITES) {
  const nom = `switch-2 ${slug} ${region}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select(
      "game_id, sortie, jaquette_path, jaquette_source, games!inner(slug, consoles!inner(slug))",
    )
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", "switch-2")
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie?.sortie) {
    ignorees.push(`${nom} (pas de version ${region})`);
    continue;
  }
  if (sortie.jaquette_path) {
    ignorees.push(
      `${nom} (a déjà une jaquette : ${sortie.jaquette_source ?? "?"})`,
    );
    continue;
  }

  await pause(adresse.includes("gamecartdb.com") ? 2000 : 1000);
  let reponse;
  try {
    reponse = await telecharger(adresse);
  } catch (e) {
    erreurs.push(`${nom} (erreur réseau : ${e.message})`);
    continue;
  }
  if (!reponse.ok) {
    erreurs.push(`${nom} (HTTP ${reponse.status})`);
    continue;
  }

  const brut = Buffer.from(await reponse.arrayBuffer());
  const prep = await preparerJaquette(brut, gabarit);

  if (essai) {
    console.log(
      `[essai] ${nom} (${source}) : ${prep.avant} → ${prep.apres} (${prep.boitierDetecte ? "boîtier retiré" : "sans boîtier"})`,
    );
    ajoutees++;
    continue;
  }

  const base = `${sortie.game_id}/${region.toLowerCase()}-${Date.now().toString(36)}`;
  for (const taille of TAILLES) {
    const webp = await sharp(prep.image, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: taille, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
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
    .eq("game_id", sortie.game_id)
    .eq("region", region)
    .is("jaquette_path", null);
  if (e) throw new Error(`${nom} : ${e.message}`);

  ajoutees++;
  console.log(
    `${nom} : ajoutée (${source}, ${prep.avant} → ${prep.apres}, ${prep.boitierDetecte ? "boîtier retiré" : "sans boîtier"})`,
  );
}

console.log(
  `${ajoutees} jaquette(s) ${essai ? "prête(s)" : "ajoutée(s)"} ; ${ignorees.length} ignorée(s) ; ${erreurs.length} erreur(s)`,
);
for (const i of ignorees) console.log(`  ignorée : ${i}`);
for (const err of erreurs) console.error(`  erreur : ${err}`);
if (erreurs.length > 0) process.exit(1);
