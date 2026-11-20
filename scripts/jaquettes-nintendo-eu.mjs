// Boîtes européennes officielles de Nintendo (choix du propriétaire, 20/11/2026 ; SPEC v1.29) pour les jeux Wii U et
// Switch dont GameTDB n'a pas de boîte française : photos « packshot » (PEGI, sans logo USK) de nintendo.com/eu,
// trouvées par le code produit avec l'API de recherche de Nintendo Europe, puis vérifiées une à une sur une planche
// (Nintendo Selects et packs avec accessoire écartés). Lancé à la main depuis la session Claude, comme le relais :
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-nintendo-eu.mjs
// Une image par seconde. Seules les jaquettes PAL venues de GameTDB sont remplacées (jamais une photo, une adresse ou
// une boîte gamecartdb). Même conversion que l'application (WebP 300 / 600 / 768 px, chemin versionné, ADR-04) ;
// source « nintendo », que l'import ne remplace plus.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BASE = "https://www.nintendo.com/eu/media/images/05_packshots/";
/** [console, jeu du site, packshot] : 39 boîtes retenues sur la planche du 20/11/2026. */
const BOITES = [
  ["wii-u", "devils-third", "games_13/wiiu_6/PS_WiiU_DevilsThird_PEGI18_image500w.jpg"],
  ["wii-u", "the-legend-of-zelda-breath-of-the-wild", "games_13/wiiu_6/PS_WiiU_TheLegendOfZeldaBreathOfTheWild_PEGI_image500w.jpg"],
  ["wii-u", "scribblenauts-unlimited", "games_13/wiiu_6/PS_WiiU_ScribblenautsUnlimited_enGB_image500w.png"],
  ["wii-u", "xenoblade-chronicles-x", "games_13/wiiu_6/PS_WiiU_XenobladeChroniclesX_PEGI_image500w.jpg"],
  ["wii-u", "yoshis-woolly-world", "games_13/wiiu_6/PS_WiiU_YoshisWoollyWorld_UKV_image500w.jpg"],
  ["wii-u", "super-mario-maker", "games_13/wiiu_6/PS_WiiU_SuperMarioMaker_enGB_image500w.jpg"],
  ["wii-u", "the-wonderful-101", "games_13/wiiu_6/PS_WiiU_TheWonderfull101_EUR_image500w.png"],
  ["switch", "metroid-prime-remastered", "games_13/nintendo_switch_8/PS_NSwitch_MetroidPrimeRemastered_PEGI_image500w.png"],
  ["switch", "xenoblade-chronicles-2", "games_13/nintendo_switch_8/PS_NSwitch_XenobladeChronicles2_PEGI_image500w.jpg"],
  ["switch", "pokemon-lets-go-pikachu", "games_13/nintendo_switch_8/PS_NSwitch_PokemonLetsGoPikachu_frFR_image500w.jpg"],
  ["switch", "1-2-switch", "games_13/nintendo_switch_8/PS_NSwitch_12Switch_PEGI_image500w.jpg"],
  ["switch", "splatoon-2", "games_13/nintendo_switch_8/PS_NSwitch_Splatoon2_enGB_image500w.jpg"],
  ["switch", "super-mario-party", "games_13/nintendo_switch_8/PS_NSwitch_SuperMarioParty_PEGI_image500w.jpg"],
  ["switch", "pokemon-lets-go-eevee", "games_13/nintendo_switch_8/PS_NSwitch_PokemonLetsGoEevee_frFR_image500w.jpg"],
  ["switch", "astral-chain", "games_13/nintendo_switch_8/PS_NSwitch_AstralChain_PEGI_image500w.jpg"],
  ["switch", "arms", "games_13/nintendo_switch_8/PS_NSwitch_Arms_PEGI_image500w.jpg"],
  ["switch", "fire-emblem-warriors", "games_13/nintendo_switch_8/PS_NSwitch_FireEmblemWarriors_PEGI_image500w.jpg"],
  ["switch", "animal-crossing-new-horizons", "games_13/nintendo_switch_8/PS_NSwitch_AnimalCrossingNewHorizons_PEGI_image500w.jpg"],
  ["switch", "yoshis-crafted-world", "games_13/nintendo_switch_8/PS_NSwitch_YoshisCraftedWorld_PEGI_image500w.jpg"],
  ["switch", "new-super-mario-bros-u-deluxe", "games_13/nintendo_switch_8/PS_NSwitch_NewSuperMarioBrosUDeluxe_enGB_image500w.jpg"],
  ["switch", "go-vacation", "games_13/nintendo_switch_8/PS_NSwitch_GoVacation_PEGI_image500w.jpg"],
  ["switch", "donkey-kong-country-tropical-freeze", "games_13/nintendo_switch_8/PS_NSwitch_DonkeyKongTropicalFreeze_FRA_image500w.jpg"],
  ["switch", "luigis-mansion-3", "games_13/nintendo_switch_8/PS_NSwitch_LuigisMansion3_PEGI_image500w.jpg"],
  ["switch", "octopath-traveler", "games_13/nintendo_switch_8/PS_NSwitch_OctopathTraveler_PEGI12_image500w.jpg"],
  ["switch", "kirby-star-allies", "games_13/nintendo_switch_8/PS_NSwitch_KirbyStarAllies_UKV_image500w.jpg"],
  ["switch", "captain-toad-treasure-tracker", "games_13/nintendo_switch_8/PS_NSwitch_CaptainToadTreasureTracker_FRA_image500w.jpg"],
  ["switch", "sushi-striker-the-way-of-sushido", "games_13/nintendo_switch_8/PS_NSwitch_SushiStrikerTheWayOfSushido_PEGI_image500w.jpg"],
  ["switch", "mario-tennis-aces", "games_13/nintendo_switch_8/PS_NSwitch_MarioTennisAces_enGB_image500w.jpg"],
  ["switch", "the-legend-of-zelda-links-awakening", "games_13/nintendo_switch_8/PS_NSwitch_TheLegendOfZeldaLinksAwakening_PEGI_image500w.jpg"],
  ["switch", "fitness-boxing", "games_13/nintendo_switch_8/PS_NSwitch_FitnessBoxing_PEGI_image500w.jpg"],
  ["switch", "bravely-default-ii", "games_13/nintendo_switch_8/PS_NSwitch_BravelyDefault2_PEGI_image500w.jpg"],
  ["switch", "the-world-ends-with-you-final-remix", "games_13/nintendo_switch_8/PS_NSwitch_TheWorldEndsWithYouFinalRemix_PEGI_image500w.jpg"],
  ["switch", "marvel-ultimate-alliance-3-the-black-order", "games_13/nintendo_switch_8/PS_NSwitch_MarvelUltimateAlliance3_PEGI_image500w.jpg"],
  ["switch", "paper-mario-the-origami-king", "games_13/nintendo_switch_8/PS_NSwitch_PaperMarioTheOrigamiKing_PEGI_image500w.jpg"],
  ["switch", "mario-golf-super-rush", "games_13/nintendo_switch_8/PS_NSwitch_MarioGolfSuperRush_UKV_image500w.jpg"],
  ["switch", "xenoblade-chronicles-definitive-edition", "games_13/nintendo_switch_8/PS_NSwitch_XenobladeChroniclesDefinitiveEdition_PEGI_image500w.jpg"],
  ["switch", "super-mario-3d-world-bowsers-fury", "games_13/nintendo_switch_8/PS_NSwitch_SuperMario3DWorldAndBowsersFury_PEGI_image500w.jpg"],
  ["switch", "super-mario-3d-all-stars", "games_13/nintendo_switch_8/PS_NSwitch_SuperMario3DAllstars_PEGI_image500w.jpg"],
  ["switch", "advance-wars-1-2-re-boot-camp", "games_13/nintendo_switch_8/PS_NSwitch_AdvanceWars1plus2RebootCamp_PEGI_image500w.jpg"],
];
const TAILLES = [300, 600, 768];

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let copiees = 0;
const ignorees = [];
for (const [consoleSlug, slug, chemin] of BOITES) {
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
  if (sortie.jaquette_source !== "gametdb") {
    ignorees.push(`${nom} (déjà : ${sortie.jaquette_source})`);
    continue;
  }
  await pause(1000);
  const reponse = await fetch(BASE + chemin);
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
  const { error: e } = await supabase
    .from("releases")
    .update({ jaquette_path: base, jaquette_source: "nintendo" })
    .eq("game_id", sortie.game_id)
    .eq("region", "PAL");
  if (e) throw new Error(`${nom} : ${e.message}`);
  if (sortie.jaquette_path && sortie.jaquette_path !== base)
    await supabase.storage.from("jaquettes").remove(TAILLES.map((t) => `${sortie.jaquette_path}-${t}.webp`));
  copiees++;
  console.log(`${nom} : boîte européenne de Nintendo`);
}
console.log(`${copiees} jaquette(s) PAL copiée(s) de nintendo.com ; ${ignorees.length} ignorée(s)`);
for (const i of ignorees) console.log(`  ${i}`);
