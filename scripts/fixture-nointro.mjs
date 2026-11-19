// Fabrique les fixtures No-Intro (étape 15, ADR-10) depuis le fichier de libretro-database :
//   https://raw.githubusercontent.com/libretro/libretro-database/master/metadat/no-intro/Nintendo%20-%20Nintendo%2064.dat
//   node scripts/fixture-nointro.mjs <fichier.dat> > src/lib/import/__fixtures__/n64-nointro.dat
// Même format, réduit aux lignes lues (name, region, serial) : sans les lignes « rom » (sommes de contrôle).
import { readFileSync } from "node:fs";

const garder = /^(?:game \(|\)|\t(?:name|region|serial) )/;
process.stdout.write(
  readFileSync(process.argv[2], "utf8")
    .split("\n")
    .filter((l) => garder.test(l))
    .join("\n") + "\n",
);
