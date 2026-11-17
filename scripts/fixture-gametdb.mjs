// Fabrique la fixture GameTDB Wii U (tests de l'import, #46).
// Usage : node scripts/fixture-gametdb.mjs <wiiutdb.zip> > src/lib/import/__fixtures__/wiiutdb.xml
// <wiiutdb.zip> : https://www.gametdb.com/wiiutdb.zip?LANG=EN
// On garde les disques en boîte édités par Nintendo (code 01) et ceux qui partagent leurs 3 premiers caractères d'identifiant avec un
// jeu de la liste Wikipédia (ex. Shovel Knight, édité par un autre en boîte), sans les résumés ni les empreintes
// de disque (<synopsis>, <rom>, <input>…) : seuls les champs lus par l'import restent.
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import * as cheerio from "cheerio";

const fichiers = unzipSync(new Uint8Array(readFileSync(process.argv[2])));
const nom = Object.keys(fichiers).find((n) => n.endsWith(".xml"));
if (!nom) throw new Error("Aucun fichier XML dans l'archive");
const $ = cheerio.load(strFromU8(fichiers[nom]), { xml: true });

// Cas de test hors Nintendo ou hors boîte : Shovel Knight (boîtes éditées par Yacht Club), NES Remix (eShop).
const AUTRES = new Set(["WKN", "WMG", "WF2"]);
const GARDER = new Set(["id", "type", "region", "locale", "developer", "publisher", "date"]);
$("game").each((_, el) => {
  const jeu = $(el);
  const id = jeu.children("id").text();
  const enBoite = jeu.children("type").text() === "WiiU";
  // Code éditeur 01 = Nintendo : le champ publisher de GameTDB donne parfois l'éditeur d'une autre région.
  const nintendo = jeu.children("publisher").text() === "Nintendo" || id.slice(4, 6) === "01";
  if (!AUTRES.has(id.slice(0, 3)) && !(enBoite && nintendo)) {
    jeu.remove();
    return;
  }
  jeu.children().each((_, c) => {
    if (!GARDER.has(c.tagName)) $(c).remove();
  });
  jeu.find("locale").children(":not(title)").remove();
});
$("datafile").children(":not(game, WiiUTDB)").remove();
process.stdout.write($.xml().replace(/\n\s*\n/g, "\n") + "\n");
