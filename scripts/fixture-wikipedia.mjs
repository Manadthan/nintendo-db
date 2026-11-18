// Fabrique la fixture du tableau « List of Wii U games » (tests de l'import, #32).
// Usage : node scripts/fixture-wikipedia.mjs <page.html> > src/lib/import/__fixtures__/wii-u-wikipedia.html
// (Switch 2, étape 10 : même script, page List_of_Nintendo_Switch_2_games → switch-2-wikipedia.html)
// <page.html> : https://en.wikipedia.org/w/index.php?title=List_of_Wii_U_games&action=render
// On ne garde que le premier tableau « wikitable », sans les annotations techniques de Wikipédia
// (data-mw, id, about…) ni les renvois aux références : le contenu affiché reste identique.
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";

const $ = cheerio.load(readFileSync(process.argv[2], "utf8"));
const table = $("table.wikitable").first();
if (!table.length) throw new Error("Tableau wikitable introuvable");

table.find("link, style, sup.reference, .mw-empty-elt").remove();
const GARDER = new Set(["href", "title", "colspan", "rowspan", "scope", "class", "data-sort-value"]);
table.find("*").addBack().each((_, el) => {
  for (const nom of Object.keys(el.attribs ?? {})) if (!GARDER.has(nom)) $(el).removeAttr(nom);
});
process.stdout.write($.html(table).replace(/\n\s*\n/g, "\n") + "\n");
