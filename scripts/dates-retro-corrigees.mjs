// Dates rétro corrigées (étape 26, 22/11/2026) : sur les 58 dates dont l'année diffère de ScreenScraper (tâche
// « Étude ScreenScraper dates », 585 jeux NES à GameCube), comparées une à une à l'encadré Wikipédia, 4 étaient
// fausses chez nous ; le propriétaire a validé ces 4 corrections. Les autres écarts venaient de ScreenScraper.
// Depuis la session Claude (skill script-prod) : npm run session -- scripts/dates-retro-corrigees.mjs
// La date et sa précision sont verrouillées, comme une correction faite dans l'administration (US-11) : un import ne
// les remet pas. Une sortie dont la date n'est plus celle attendue (déjà corrigée) est laissée telle quelle.
import { createClient } from "@supabase/supabase-js";

/** [console, jeu, région, date actuelle, nouvelle date, précision, source]. */
const CORRECTIONS = [
  ["gamecube", "pokemon-channel", "US", "2002-12-01", "2003-12-01", "jour", "Wikipédia : NA December 1, 2003"],
  ["gba", "top-gear-rally", "JAP", "2005-07-25", "2003-07-25", "jour", "Wikipédia : JP July 25, 2003"],
  ["gba", "the-tower-sp", "US", "2005-01-01", "2006-03-14", "jour", "Wikipédia : NA March 14, 2006"],
  ["gb", "nigel-mansells-world-championship-racing", "PAL", "1993-08-01", "1992-01-01", "annee", "Wikipédia : EU 1992"],
];

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

let corrigees = 0;
const ignorees = [];
for (const [console_, slug, region, avant, apres, precision, source] of CORRECTIONS) {
  const nom = `${console_} ${slug} ${region}`;
  const { data: sortie, error } = await supabase
    .from("releases")
    .select("game_id, date_sortie, verrous, games!inner(slug, consoles!inner(slug))")
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", console_)
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!sortie) {
    ignorees.push(`${nom} (sortie absente)`);
    continue;
  }
  if (sortie.date_sortie !== avant) {
    ignorees.push(`${nom} (date actuelle ${sortie.date_sortie}, attendue ${avant})`);
    continue;
  }
  const verrous = [...new Set([...(sortie.verrous ?? []), "date_sortie", "precision_date"])];
  const { error: e } = await supabase
    .from("releases")
    .update({ date_sortie: apres, precision_date: precision, verrous })
    .eq("game_id", sortie.game_id)
    .eq("region", region);
  if (e) throw new Error(`${nom} : ${e.message}`);
  corrigees++;
  console.log(`${nom} : ${avant} → ${apres} (${precision}) — ${source}`);
}
console.log(`${corrigees} date(s) corrigée(s) ; ${ignorees.length} ignorée(s)`);
for (const x of ignorees) console.log(`  ${x}`);
