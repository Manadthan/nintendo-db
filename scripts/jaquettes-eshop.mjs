// Fausses jaquettes « Nintendo eShop » (signalées par le propriétaire le 23/11/2026, plan validé le même jour) : pour 6
// versions Switch, GameTDB donne un visuel générique (fond rouge, bannière du jeu, « Nintendo eShop ») au lieu du scan
// de la boîte, dans toutes les tailles. Repérées par src/lib/import/eshop.ts sur les 2 760 jaquettes du site.
//   - 3 boîtes japonaises officielles trouvées sur les pages produit de nintendo.com/jp : remplacées (source « nintendo »,
//     que l'import ne remplace plus) ;
//   - 3 versions sans boîte officielle (Nintendo Europe n'a pas de packshot de Dragon Quest XI S ni de Bayonetta ;
//     pas de page Pokémon Diamant Étincelant sur nintendo.com/jp) : fausse image retirée, vignette neutre ; le relais
//     ScreenScraper les cherchera comme les autres versions sans jaquette.
// Lancé à la main depuis la session Claude (skill script-prod) :
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-eshop.mjs
// Lit avant d'écrire : une version n'est touchée que si sa jaquette actuelle est bien le visuel eShop (jamais une
// photo, une adresse ou une boîte choisie à la main). Même conversion que l'application (WebP 300 / 600 / 768 px,
// chemin versionné, ADR-04), puis l'ancienne jaquette est supprimée du stockage.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { estVisuelEshop } from "../src/lib/import/eshop.ts";

const JP = "https://www.nintendo.com/jp/switch/";
/** [jeu du site, région, boîte officielle ou null (fausse image retirée)]. */
const VERSIONS = [
  ["mario-party-superstars", "JAP", `${JP}az82a/assets/img/top/pr_package.png`],
  ["bayonetta-origins-cereza-and-the-lost-demon", "JAP", `${JP}axb8a/assets/images/footer/img_pkg.png`],
  ["dc-super-hero-girls-teen-power", "JAP", `${JP}arxaa/assets/images/footer_pkg.png`],
  ["dragon-quest-xi-s-echoes-of-an-elusive-age-definitive-edition", "PAL", null],
  ["bayonetta", "PAL", null],
  ["pokemon-brilliant-diamond", "JAP", null],
];
const TAILLES = [300, 600, 768];

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const jaquettes = supabase.storage.from("jaquettes");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let remplacees = 0;
let retirees = 0;
const ignorees = [];
for (const [slug, region, adresse] of VERSIONS) {
  const nom = `switch ${slug} ${region}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select("game_id, jaquette_path, jaquette_source, games!inner(slug, consoles!inner(slug))")
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", "switch")
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie?.jaquette_path || sortie.jaquette_source !== "gametdb") {
    ignorees.push(`${nom} (pas de jaquette GameTDB)`);
    continue;
  }
  const { data: actuelle, error: e1 } = await jaquettes.download(`${sortie.jaquette_path}-768.webp`);
  if (e1) throw new Error(`${nom} : ${e1.message}`);
  if (!(await estVisuelEshop(Buffer.from(await actuelle.arrayBuffer())))) {
    ignorees.push(`${nom} (la jaquette actuelle n'est pas le visuel eShop)`);
    continue;
  }

  let base = null;
  if (adresse) {
    await pause(1000);
    const reponse = await fetch(adresse);
    if (!reponse.ok) {
      ignorees.push(`${nom} (HTTP ${reponse.status})`);
      continue;
    }
    const image = Buffer.from(await reponse.arrayBuffer());
    base = `${sortie.game_id}/${region.toLowerCase()}-${Date.now().toString(36)}`;
    for (const taille of TAILLES) {
      const webp = await sharp(image, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: taille, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .webp({ quality: 82 })
        .toBuffer();
      const { error: e } = await jaquettes.upload(`${base}-${taille}.webp`, webp, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
      if (e) throw new Error(`${nom} : ${e.message}`);
    }
  }
  const { error: e2 } = await supabase
    .from("releases")
    .update({ jaquette_path: base, jaquette_source: base ? "nintendo" : null })
    .eq("game_id", sortie.game_id)
    .eq("region", region)
    .eq("jaquette_path", sortie.jaquette_path);
  if (e2) throw new Error(`${nom} : ${e2.message}`);
  const { error: e3 } = await jaquettes.remove(TAILLES.map((t) => `${sortie.jaquette_path}-${t}.webp`));
  if (e3) console.warn(`${nom} : ancienne jaquette non supprimée (${e3.message})`);
  if (base) remplacees++;
  else retirees++;
  console.log(`${nom} : ${base ? "boîte officielle Nintendo" : "fausse image retirée"}`);
}
console.log(`${remplacees} remplacée(s), ${retirees} retirée(s) ; ${ignorees.length} ignorée(s)`);
for (const i of ignorees) console.log(`  ${i}`);
