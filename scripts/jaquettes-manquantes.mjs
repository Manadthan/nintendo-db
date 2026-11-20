// Jaquettes manquantes après le contrôle du 20/11/2026 (bases officielles de Nintendo Europe et Japon) : versions 3DS,
// Switch et Switch 2 encore sans jaquette, dont les JAP et PAL ajoutées à la main ce jour-là. Une image par version,
// validée sur la planche du 20/11/2026 (artifact « Jaquettes manquantes »), dans cet ordre de préférence :
// boîte officielle de Nintendo (packshot PEGI de nintendo.com/eu, boîte japonaise des pages produit de
// nintendo.com/jp, boîte américaine du My Nintendo Store), sinon scan GameTDB. Vraies boîtes seulement : ni
// illustration, ni Nintendo Selects, ni pack avec accessoire ; jamais un scan GameTDB pour un jeu Switch 2 (ses
// identifiants y renvoient à des jeux Switch 1). Lancé à la main depuis la session Claude, comme le relais :
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-manquantes.mjs
// Une image par seconde. Seules les versions encore sans jaquette sont remplies (rien n'est remplacé). Même
// conversion que l'application (WebP 300 / 600 / 768 px, chemin versionné, ADR-04) ; source « nintendo » ou « gametdb ».
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

/** [console, jeu du site, région, source, image, « rogner » : marges blanches de la photo retirées]. */
const BOITES = [
  ["3ds", "bokujou-monogatari-3-tsu-no-sato-no-taisetsu-na-tomodachi", "PAL", "nintendo", "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_StoryOfSeasonsTrioOfTowns_FRA_image500w.jpg"],
  ["3ds", "bravely-default", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/BTRJ.jpg"],
  ["3ds", "choukaiten-sushi-striker-the-way-of-sushido", "PAL", "nintendo", "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_SushiStrikerTheWayOfSushido_frFR_image500w.jpg"],
  ["3ds", "cooking-mama-bon-appetit", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/BC5J.jpg"],
  ["3ds", "donkey-kong-country-returns-3d", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AYTJ.jpg"],
  ["3ds", "dragon-quest-vii-fragments-of-the-forgotten-past", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AD7J.jpg"],
  ["3ds", "famicom-remix-best-choice", "PAL", "nintendo", "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_UltimateNESRemix_frFR_image500w.jpg"],
  ["3ds", "fire-emblem-awakening", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverM/JA/AFEJ.jpg"],
  ["3ds", "fossil-fighters-frontier", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AHRJ.jpg"],
  ["3ds", "gardening-mama-forest-friends", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/BGMJ.jpg"],
  ["3ds", "hey-pikmin", "US", "gametdb", "https://art.gametdb.com/3ds/coverHQ/US/BRCE.jpg"],
  ["3ds", "hey-pikmin", "PAL", "nintendo", "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_HeyPikmin_frFR_image500w.jpg"],
  ["3ds", "inazuma-eleven-go-chrono-stones-thunderflash", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/ARAJ.jpg"],
  ["3ds", "inazuma-eleven-go-chrono-stones-wildfire", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/ANPJ.jpg"],
  ["3ds", "inazuma-eleven-go-light", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AE4J.jpg"],
  ["3ds", "inazuma-eleven-go-shadow", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverM/JA/AEDJ.jpg"],
  ["3ds", "kid-icarus-uprising", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AKDJ.jpg"],
  ["3ds", "kirby-triple-deluxe", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/BALJ.jpg"],
  ["3ds", "kirbys-extra-epic-yarn", "PAL", "nintendo", "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_KirbysExtraEpicYarn_FRA_image500w.jpg"],
  ["3ds", "lbx-little-battlers-experience", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/ADNJ.jpg"],
  ["3ds", "mario-party-island-tour", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/ATSJ.jpg"],
  ["3ds", "mario-tennis-open", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AGAJ.jpg"],
  ["3ds", "metroid-prime-federation-force", "PAL", "nintendo", "https://www.nintendo.com/eu/media/images/05_packshots/games_13/nintendo_3ds_6/PS_3DS_MetroidPrimeFederationForce_FRA_image500w.jpg"],
  ["3ds", "metroid-samus-returns", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/A9AJ.jpg"],
  ["3ds", "new-art-academy", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverM/JA/AACJ.jpg"],
  ["3ds", "paper-mario-sticker-star", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AG5J.jpg"],
  ["3ds", "pokemon-mystery-dungeon-gates-to-infinity", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/APDJ.jpg"],
  ["3ds", "professor-layton-and-the-azran-legacy", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AL6J.jpg"],
  ["3ds", "professor-layton-vs-phoenix-wright-ace-attorney", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AVSJ.jpg"],
  ["3ds", "star-fox-64-3d", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverM/JA/ANRJ.jpg"],
  ["3ds", "super-mario-3d-land", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AREJ.jpg"],
  ["3ds", "the-legend-of-zelda-ocarina-of-time-3d", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverM/JA/AQEJ.jpg"],
  ["3ds", "yo-kai-watch", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/AYWJ.jpg"],
  ["3ds", "yoshis-new-island", "JAP", "gametdb", "https://art.gametdb.com/3ds/coverHQ/JA/ATAJ.jpg"],
  ["switch-2", "animal-crossing-new-horizons-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/acbaa/products/assets/img/software_img_package.png"],
  ["switch-2", "donkey-kong-bananza", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aaaca/products/assets/img/software_img_package.png"],
  ["switch-2", "fire-emblem-fortunes-weave", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aacsa/products/assets/img/software_img_package.webp"],
  ["switch-2", "kirby-air-riders", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aaaba/products/assets/img/software_img_package.png"],
  ["switch-2", "kirby-and-the-forgotten-land-nintendo-switch-2-edition-star-crossed-world", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/arzga/products/assets/img/software_img_package.png"],
  ["switch-2", "mario-kart-world", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aaaaa/products/assets/img/software_img_package.png"],
  ["switch-2", "mario-tennis-fever", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aaaea/products/assets/img/software_img_package.png"],
  ["switch-2", "metroid-prime-4-beyond-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/bgw5a/products/assets/img/software_img_package.png"],
  ["switch-2", "nintendo-switch-sports-resort", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aacha/products/assets/img/software_img_package.png"],
  ["switch-2", "pikmin-4-nintendo-switch-2-edition-dandori-academy", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/ampyc/products/assets/img/software_img_package.webp"],
  ["switch-2", "pokemon-pokopia", "US", "nintendo", "https://assets.nintendo.com/image/upload/f_png/q_auto/ncom/My%20Nintendo%20Store/EN-US/Nintendo%20Switch%202/Software/Pokemon%20Pokopia/121593-nintendo-pokemon-pokopia-2000x2000", "rogner"],
  ["switch-2", "splatoon-raiders", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aadla/products/assets/img/software_img_package.png"],
  ["switch-2", "star-fox", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/abgwa/products/assets/img/software_img_package.png"],
  ["switch-2", "super-mario-bros-wonder-nintendo-switch-2-edition-meetup-in-bellabel-park", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aqmxa/products/assets/img/software_img_package.png"],
  ["switch-2", "super-mario-party-jamboree-nintendo-switch-2-edition-jamboree-tv", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/a7hla/products/assets/img/software_img_package.png"],
  ["switch-2", "the-legend-of-zelda-breath-of-the-wild-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/zelda/botw/edition/products/assets/img/software_img_package.png"],
  ["switch-2", "the-legend-of-zelda-ocarina-of-time", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aa9ja/products/assets/img/software_img_package.webp"],
  ["switch-2", "the-legend-of-zelda-tears-of-the-kingdom-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/zelda/totk/edition/products/assets/img/software_img_package.png"],
  ["switch-2", "xenoblade-chronicles-2-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/adeng/products/assets/img/software_img_package.webp"],
  ["switch-2", "xenoblade-chronicles-definitive-edition-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aubqb/products/assets/img/software_img_package.webp"],
  ["switch-2", "xenoblade-chronicles-x-definitive-edition-nintendo-switch-2-edition", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/bas6a/products/assets/img/software_img_package.png"],
  ["switch-2", "yoshi-and-the-mysterious-book", "JAP", "nintendo", "https://www.nintendo.com/jp/games/switch2/aakga/products/assets/img/software_img_package.png"],
  ["switch", "dragon-quest-xi-s-echoes-of-an-elusive-age-definitive-edition", "JAP", "gametdb", "https://art.gametdb.com/switch/coverM/JA/ALC7A.jpg"],
  ["switch", "go-vacation", "JAP", "gametdb", "https://art.gametdb.com/switch/coverM/JA/AF2GC.jpg"],
  ["switch", "mario-rabbids-kingdom-battle", "US", "gametdb", "https://art.gametdb.com/switch/coverHQ/US/BAANA.jpg"],
  ["switch", "mario-rabbids-kingdom-battle", "PAL", "gametdb", "https://art.gametdb.com/switch/coverHQ/FR/BAANA.jpg"],
  ["switch", "nintendo-labo-toy-con-01-variety-kit", "JAP", "nintendo", "https://www.nintendo.com/jp/labo/kit/img/box_variety.jpg"],
  ["switch", "nintendo-labo-toy-con-02-robot-kit", "JAP", "nintendo", "https://www.nintendo.com/jp/labo/kit/img/box_robot.jpg"],
  ["switch", "nintendo-labo-toy-con-03-vehicle-kit", "JAP", "nintendo", "https://www.nintendo.com/jp/labo/kit/img/box_drive.jpg"],
  ["switch", "nintendo-labo-toy-con-04-vr-kit", "JAP", "nintendo", "https://www.nintendo.com/jp/labo/kit/img/box_vr01.jpg"],
  ["switch", "octopath-traveler", "JAP", "gametdb", "https://art.gametdb.com/switch/coverHQ/JA/AGY7A.jpg"],
];
const TAILLES = [300, 600, 768];

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let copiees = 0;
const ignorees = [];
for (const [consoleSlug, slug, region, source, adresse, rogner] of BOITES) {
  const nom = `${consoleSlug} ${slug} ${region}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select("game_id, sortie, jaquette_path, games!inner(slug, consoles!inner(slug))")
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", consoleSlug)
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie?.sortie) {
    ignorees.push(`${nom} (pas de version ${region})`);
    continue;
  }
  if (sortie.jaquette_path) {
    ignorees.push(`${nom} (a déjà une jaquette)`);
    continue;
  }
  await pause(1000);
  const reponse = await fetch(adresse);
  if (!reponse.ok) {
    ignorees.push(`${nom} (HTTP ${reponse.status})`);
    continue;
  }
  let image = Buffer.from(await reponse.arrayBuffer());
  if (rogner) image = await sharp(image).trim({ threshold: 20 }).toBuffer();
  const base = `${sortie.game_id}/${region.toLowerCase()}-${Date.now().toString(36)}`;
  for (const taille of TAILLES) {
    const webp = await sharp(image, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: taille, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 82 })
      .toBuffer();
    const { error: e } = await supabase.storage
      .from("jaquettes")
      .upload(`${base}-${taille}.webp`, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (e) throw new Error(`${nom} : ${e.message}`);
  }
  const { error: e } = await supabase
    .from("releases")
    .update({ jaquette_path: base, jaquette_source: source })
    .eq("game_id", sortie.game_id)
    .eq("region", region)
    .is("jaquette_path", null);
  if (e) throw new Error(`${nom} : ${e.message}`);
  copiees++;
  console.log(`${nom} : ${source}`);
}
console.log(`${copiees} jaquette(s) ajoutée(s) ; ${ignorees.length} ignorée(s)`);
for (const i of ignorees) console.log(`  ${i}`);
