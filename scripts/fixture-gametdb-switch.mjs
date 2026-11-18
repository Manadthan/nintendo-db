// Fabrique la fixture GameTDB Switch (tests du relais et de l'import, étape 10).
// Usage : node scripts/fixture-gametdb-switch.mjs <switchtdb.zip> > src/lib/import/__fixtures__/switchtdb.xml
// Base : https://www.gametdb.com/switchtdb.zip?LANG=EN. Même réduction que le relais (reduireBaseSwitch).
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { reduireBaseSwitch } from "../src/lib/import/relais-switch.ts";

const fichiers = unzipSync(new Uint8Array(readFileSync(process.argv[2])));
const nom = Object.keys(fichiers).find((n) => n.endsWith(".xml"));
if (!nom) throw new Error("Aucun fichier XML dans l'archive");
process.stdout.write(reduireBaseSwitch(strFromU8(fichiers[nom])).xml + "\n");
