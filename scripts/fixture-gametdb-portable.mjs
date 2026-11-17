// Fabrique les fixtures GameTDB DS et 3DS (tests du relais et de l'import, étape 9).
// Usage : node scripts/fixture-gametdb-portable.mjs ds <dstdb.zip> > src/lib/import/__fixtures__/dstdb.xml
//         node scripts/fixture-gametdb-portable.mjs 3ds <3dstdb.zip> > src/lib/import/__fixtures__/3dstdb.xml
// Bases : https://www.gametdb.com/dstdb.zip?LANG=EN, https://www.gametdb.com/3dstdb.zip?LANG=EN
// Même réduction que le relais (reduireBasePortable).
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { reduireBasePortable } from "../src/lib/import/relais-portables.ts";

const [portable, archive] = process.argv.slice(2);
if (portable !== "ds" && portable !== "3ds") throw new Error("Console : ds ou 3ds");
const fichiers = unzipSync(new Uint8Array(readFileSync(archive)));
const nom = Object.keys(fichiers).find((n) => n.endsWith(".xml"));
if (!nom) throw new Error("Aucun fichier XML dans l'archive");
process.stdout.write(reduireBasePortable(portable, strFromU8(fichiers[nom])).xml + "\n");
