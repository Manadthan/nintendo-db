// Fabrique la fixture GameTDB Wii (tests du relais et de l'import, étape 8).
// Usage : node scripts/fixture-gametdb-wii.mjs <wiitdb.zip> > src/lib/import/__fixtures__/wiitdb.xml
// <wiitdb.zip> : https://www.gametdb.com/wiitdb.zip?LANG=EN
// Même réduction que le relais (reduireBaseWii) : disques du commerce des jeux dont au moins une boîte est éditée
// par Nintendo, champs lus par l'import, genres traduits en français.
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { reduireBaseWii } from "../src/lib/import/relais-wii.ts";

const fichiers = unzipSync(new Uint8Array(readFileSync(process.argv[2])));
const nom = Object.keys(fichiers).find((n) => n.endsWith(".xml"));
if (!nom) throw new Error("Aucun fichier XML dans l'archive");
process.stdout.write(reduireBaseWii(strFromU8(fichiers[nom])).xml + "\n");
