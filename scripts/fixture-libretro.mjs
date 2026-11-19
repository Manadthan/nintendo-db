// Fabrique les fixtures des index libretro-thumbnails (étape 14) à partir d'un clone sans contenu du dépôt :
//   git clone --depth 1 --filter=blob:none --no-checkout https://github.com/libretro-thumbnails/Nintendo_-_Nintendo_64.git
//   node scripts/fixture-libretro.mjs <clone> > src/lib/import/__fixtures__/n64-libretro.xml
// Même index que celui que dépose le relais (indexEnXml).
import { execFileSync } from "node:child_process";
import { indexEnXml } from "../src/lib/import/libretro.ts";

const noms = execFileSync("git", ["-C", process.argv[2], "ls-tree", "-r", "--name-only", "HEAD", "Named_Boxarts/"], {
  encoding: "utf8",
  maxBuffer: 50_000_000,
})
  .split("\n")
  .filter((n) => n.endsWith(".png"))
  .map((n) => n.slice("Named_Boxarts/".length, -".png".length));
process.stdout.write(indexEnXml(noms));
