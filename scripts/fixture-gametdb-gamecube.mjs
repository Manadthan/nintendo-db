// Fabrique la fixture GameTDB GameCube (tests du relais et de l'import, étape 11).
// Usage : node scripts/fixture-gametdb-gamecube.mjs <wiitdb-gc.zip> > src/lib/import/__fixtures__/gctdb.xml
// Base : https://www.gametdb.com/wiitdb.zip?LANG=EN&GAMECUBE=1. Même réduction que le relais (reduireBaseWii).
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { estDisqueGameCubeDuCommerce, reduireBaseWii } from "../src/lib/import/relais-wii.ts";

const fichiers = unzipSync(new Uint8Array(readFileSync(process.argv[2])));
const nom = Object.keys(fichiers).find((n) => n.endsWith(".xml"));
if (!nom) throw new Error("Aucun fichier XML dans l'archive");
process.stdout.write(reduireBaseWii(strFromU8(fichiers[nom]), estDisqueGameCubeDuCommerce).xml + "\n");
