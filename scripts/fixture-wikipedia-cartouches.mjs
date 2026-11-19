// Fabrique les fixtures des listes Wikipédia N64, GBA (étape 14) et Game Boy Color (étape 17, US-10). Usage :
//   node scripts/fixture-wikipedia-cartouches.mjs <page.html> > src/lib/import/__fixtures__/n64-wikipedia.html
// <page.html> : https://en.wikipedia.org/w/index.php?title=List_of_Nintendo_64_games&action=render (ou Game_Boy_Advance).
// On garde le tableau des jeux (le premier dont l'en-tête cite « Publisher ») : ses lignes d'en-tête, les jeux dont un éditeur est Nintendo, et
// les 15 premiers autres (pour tester qu'ils sont écartés). Les clés de tri cachées et les annotations techniques sont
// retirées, comme le fait le lecteur.
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";

const $ = cheerio.load(readFileSync(process.argv[2], "utf8"));
// Même choix que le lecteur : le premier tableau dont l'en-tête cite « Publisher ».
const table = $("table.wikitable")
  .filter((_, t) => /Publisher/.test($(t).find("tr").first().text()))
  .first();
if (!table.length) throw new Error("Tableau des jeux introuvable");
table.find('[style*="display:none"], sup.reference, link, style, .mw-empty-elt').remove();
// En-tête sur 2 lignes (N64, GBA) ou 1 (Game Boy Color, étape 17) ; colonne « Publisher » repérée par son titre.
const lignes = table.find("tr");
const nbEntete = lignes.toArray().findIndex((tr) => $(tr).children("td").length > 0);
const colonneEditeur = lignes.first().children().toArray().findIndex((th) => /^Publisher/.test($(th).text().trim()));
let autres = 0;
lignes.slice(nbEntete).each((_, tr) => {
  const nintendo = /Nintendo/.test($(tr).children().eq(colonneEditeur).text());
  if (!nintendo && autres++ >= 15) $(tr).remove();
});
const GARDER = new Set(["href", "title", "colspan", "rowspan", "scope", "data-sort-value"]);
table.find("*").addBack().each((_, el) => {
  for (const nom of Object.keys(el.attribs ?? {})) if (!GARDER.has(nom)) $(el).removeAttr(nom);
});
table.addClass("wikitable");
process.stdout.write($.html(table).replace(/\n\s*\n/g, "\n") + "\n");
