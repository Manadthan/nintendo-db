// Dates de sortie manquantes complétées le 23/11/2026, à la demande du propriétaire : 40 versions sorties sans
// date. Chaque date vient de l'encadré Wikipédia anglais du jeu, ou de la presse quand Wikipédia ne la donne pas
// (source en commentaire). Date écrite et verrouillée (date_sortie, precision_date) : l'import ne la remplace plus.
// Seules les versions encore sans date sont écrites.
// Bionic Commando: Elite Forces PAL : jamais sorti en cartouche en Europe (seulement la console virtuelle 3DS en
// 2014) → version décochée (sortie = false, verrouillée), comme un jeu retiré d'une région.
//   npm run session -- scripts/dates-manquantes.mjs           (essai : rien n'est écrit)
//   npm run session -- scripts/dates-manquantes.mjs --ecrire
import { createClient } from "@supabase/supabase-js";

/** [console, jeu, région, date (AAAA-MM-JJ), précision, source]. */
const DATES = [
  [
    "3ds",
    "dillons-dead-heat-breakers",
    "JAP",
    "2018-04-26",
    "jour",
    "Gematsu, Nintendo Direct de mars 2018",
  ],
  [
    "3ds",
    "disney-magical-world",
    "JAP",
    "2013-08-01",
    "jour",
    "Wikipédia (Disney Magic Castle: My Happy Life)",
  ],
  [
    "3ds",
    "super-pokemon-rumble",
    "JAP",
    "2011-08-11",
    "jour",
    "Bulbapedia (Super Pokémon Scramble)",
  ],
  [
    "3ds",
    "super-pokemon-rumble",
    "PAL",
    "2011-12-02",
    "jour",
    "Nintendo Europe, Bulbanews",
  ],
  [
    "3ds",
    "the-legend-of-zelda-tri-force-heroes",
    "PAL",
    "2015-10-23",
    "jour",
    "Wikipédia",
  ],
  [
    "3ds",
    "yo-kai-watch-2-bony-spirits",
    "PAL",
    "2017-04-07",
    "jour",
    "Wikipédia",
  ],
  [
    "3ds",
    "yo-kai-watch-2-fleshy-souls",
    "PAL",
    "2017-04-07",
    "jour",
    "Wikipédia",
  ],
  [
    "ds",
    "the-legendary-starfy",
    "JAP",
    "2008-07-10",
    "jour",
    "Wikipédia, Siliconera (Densetsu no Stafy Taiketsu!)",
  ],
  [
    "gba",
    "disneys-magical-quest-starring-mickey-minnie",
    "JAP",
    "2002-08-09",
    "jour",
    "Nintendo World Report",
  ],
  [
    "gba",
    "disneys-magical-quest-starring-mickey-minnie",
    "PAL",
    "2002-08-27",
    "jour",
    "NintendoWiki (NIWA)",
  ],
  ["gba", "the-tower-sp", "JAP", "2005-04-28", "jour", "Wikipédia"],
  [
    "gb",
    "wario-land-ii",
    "JAP",
    "1998-10-21",
    "jour",
    "Wikipédia (version Game Boy Color, seule sortie au Japon)",
  ],
  [
    "switch",
    "bravely-default-ii",
    "US",
    "2021-02-26",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "daemon-x-machina",
    "US",
    "2019-09-13",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  ["switch", "dragon-quest-builders", "JAP", "2018-03-01", "jour", "Wikipédia"],
  ["switch", "dragon-quest-builders", "US", "2018-02-09", "jour", "Wikipédia"],
  ["switch", "dragon-quest-builders", "PAL", "2018-02-09", "jour", "Wikipédia"],
  [
    "switch",
    "dragon-quest-xi-s-echoes-of-an-elusive-age-definitive-edition",
    "US",
    "2019-09-27",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "famicom-tantei-club-kieta-kokeisha-ushiro-ni-tatsu-shojo",
    "JAP",
    "2021-05-14",
    "jour",
    "Wikipédia (Famicom Detective Club, sortie mondiale)",
  ],
  [
    "switch",
    "fitness-boxing-2-rhythm-exercise",
    "JAP",
    "2020-12-03",
    "jour",
    "Gematsu",
  ],
  [
    "switch",
    "fitness-boxing-2-rhythm-exercise",
    "US",
    "2020-12-04",
    "jour",
    "Nintendo, Nintendo Life",
  ],
  [
    "switch",
    "hyrule-warriors-definitive-edition",
    "US",
    "2018-05-18",
    "jour",
    "Wikipédia (Hyrule Warriors)",
  ],
  [
    "switch",
    "hyrule-warriors-definitive-edition",
    "PAL",
    "2018-05-18",
    "jour",
    "Wikipédia (Hyrule Warriors)",
  ],
  [
    "switch",
    "kirby-and-the-forgotten-land",
    "US",
    "2022-03-25",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "live-a-live",
    "PAL",
    "2022-07-22",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-01-variety-kit",
    "JAP",
    "2018-04-20",
    "jour",
    "Wikipédia (Nintendo Labo)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-01-variety-kit",
    "US",
    "2018-04-20",
    "jour",
    "Wikipédia (Nintendo Labo)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-01-variety-kit",
    "PAL",
    "2018-04-27",
    "jour",
    "Nintendo Europe",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-02-robot-kit",
    "JAP",
    "2018-04-20",
    "jour",
    "Wikipédia (Nintendo Labo)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-02-robot-kit",
    "US",
    "2018-04-20",
    "jour",
    "Wikipédia (Nintendo Labo)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-02-robot-kit",
    "PAL",
    "2018-04-27",
    "jour",
    "Nintendo Europe",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-03-vehicle-kit",
    "JAP",
    "2018-09-14",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-03-vehicle-kit",
    "US",
    "2018-09-14",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "nintendo-labo-toy-con-03-vehicle-kit",
    "PAL",
    "2018-09-14",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  [
    "switch",
    "pokemon-mystery-dungeon-rescue-team-dx",
    "US",
    "2020-03-06",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
  ["switch", "shin-megami-tensei-v", "JAP", "2021-11-11", "jour", "Wikipédia"],
  ["switch", "shin-megami-tensei-v", "US", "2021-11-12", "jour", "Wikipédia"],
  [
    "switch",
    "the-world-ends-with-you-final-remix",
    "US",
    "2018-10-12",
    "jour",
    "Wikipédia",
  ],
  [
    "switch",
    "triangle-strategy",
    "US",
    "2022-03-04",
    "jour",
    "Wikipédia (sortie mondiale)",
  ],
];
/** Versions jamais sorties : décochées. */
const DECOCHEES = [
  [
    "gbc",
    "bionic-commando-elite-forces",
    "PAL",
    "Wikipédia : pas de cartouche en Europe",
  ],
];

const ecrire = process.argv.includes("--ecrire");
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function lire(consoleSlug, slug, region) {
  const { data, error } = await supabase
    .from("releases")
    .select(
      "game_id, sortie, date_sortie, verrous, games!inner(slug, consoles!inner(slug))",
    )
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", consoleSlug)
    .maybeSingle();
  if (error)
    throw new Error(`${consoleSlug} ${slug} ${region} : ${error.message}`);
  return data;
}
const verrouiller = (v, champs) => [...new Set([...v.verrous, ...champs])];

let datees = 0;
let decochees = 0;
const ignorees = [];
for (const [consoleSlug, slug, region, date, precision] of DATES) {
  const nom = `${consoleSlug} ${slug} ${region}`;
  const v = await lire(consoleSlug, slug, region);
  if (!v?.sortie) ignorees.push(`${nom} (version absente)`);
  else if (v.date_sortie)
    ignorees.push(`${nom} (a déjà une date : ${v.date_sortie})`);
  else {
    if (ecrire) {
      const { error } = await supabase
        .from("releases")
        .update({
          date_sortie: date,
          precision_date: precision,
          verrous: verrouiller(v, ["date_sortie", "precision_date"]),
        })
        .eq("game_id", v.game_id)
        .eq("region", region);
      if (error) throw new Error(`${nom} : ${error.message}`);
    }
    datees++;
    console.log(`${nom} : ${date}`);
  }
}
for (const [consoleSlug, slug, region, raison] of DECOCHEES) {
  const nom = `${consoleSlug} ${slug} ${region}`;
  const v = await lire(consoleSlug, slug, region);
  if (!v?.sortie) ignorees.push(`${nom} (déjà décochée)`);
  else {
    if (ecrire) {
      const { error } = await supabase
        .from("releases")
        .update({ sortie: false, verrous: verrouiller(v, ["sortie"]) })
        .eq("game_id", v.game_id)
        .eq("region", region);
      if (error) throw new Error(`${nom} : ${error.message}`);
    }
    decochees++;
    console.log(`${nom} : décochée (${raison})`);
  }
}
console.log(
  `${ecrire ? "" : "ESSAI : "}${datees} date(s), ${decochees} version(s) décochée(s) ; ${ignorees.length} ignorée(s)`,
);
for (const i of ignorees) console.log(`  ignorée : ${i}`);
