import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { choisirJaquettes, construireJeu } from "./donnees";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import {
  estCartoucheSwitchDuCommerce,
  reduireBaseSwitch,
  regionsGameTdb,
} from "./relais-switch";

// Import Switch (étape 10, SPEC v1.11 US-10) : GameTDB seul, sur la fixture réduite du 18/11/2026.
const SWITCH = sourceConsole("switch");
const xml = readFileSync(join(__dirname, "__fixtures__/switchtdb.xml"), "utf8");
const disques = lireGameTdb(xml, SWITCH.estDisque);
const { jeux, ecartes } = appliquerGameTdb(
  [],
  regrouperGameTdb(disques, SWITCH.longueurBase),
);
const jeu = (slug: string) => {
  const trouve = jeux.find((j) => j.slug === slug);
  if (!trouve) throw new Error(`${slug} absent`);
  return trouve;
};

describe("règles des cartouches Switch", () => {
  it("une cartouche « ALL » vaut dans les 3 régions ; Chine, Corée, Taïwan ne sont pas suivis", () => {
    expect(regionsGameTdb("ALL")).toEqual(["JAP", "US", "PAL"]);
    expect(regionsGameTdb("USA,EUR,KOR")).toEqual(["US", "PAL"]);
    expect(regionsGameTdb("JPN,TWN")).toEqual(["JAP"]);
    expect(regionsGameTdb("CHN")).toEqual([]);
    expect(regionsGameTdb("NTSC-U")).toEqual(["US"]);
  });

  it("garde les cartouches du commerce, écarte eShop, éditions spéciales (chiffre final), démos et outils", () => {
    const garde = (type: string, id: string, titre: string, genre = "") =>
      estCartoucheSwitchDuCommerce(type, id, "ALL", titre, genre);
    expect(garde("Switch", "AAAAA", "The Legend of Zelda")).toBe(true);
    expect(garde("eShop", "AAAAA", "The Legend of Zelda")).toBe(false);
    expect(garde("Switch", "AAB62", "Splatoon 2 [Starter Pack]")).toBe(false);
    expect(garde("Switch", "ALZ21", "Pokémon Double Pack")).toBe(false);
    expect(garde("Switch", "1CGNA", "Quest Contents Install Tool")).toBe(false);
    expect(garde("Switch", "ABCDA", "Un jeu", "demo,sampler")).toBe(false);
  });

  it("la base réduite par le relais : un scan à déposer par cartouche et par région", () => {
    const { disques: aDeposer } = reduireBaseSwitch(xml);
    expect(aDeposer).toContainEqual({ id: "AAAAA", region: "JAP" });
    expect(aDeposer).toContainEqual({ id: "AAAAA", region: "PAL" });
    expect(aDeposer).toContainEqual({ id: "AAB6C", region: "PAL" });
    expect(aDeposer).not.toContainEqual({ id: "AAB6C", region: "US" });
  });
});

describe("import Switch depuis GameTDB seul (fixture du 18/11/2026)", () => {
  it("351 cartouches-régions, 112 jeux Nintendo, chacun à une adresse distincte", () => {
    expect(disques).toHaveLength(351);
    expect(jeux).toHaveLength(112);
    expect(new Set(jeux.map((j) => j.slug)).size).toBe(112);
    expect(ecartes).toEqual([]);
  });

  it("cartouche mondiale : mêmes date et code produit dans les 3 régions, titre japonais", () => {
    const zelda = jeu("the-legend-of-zelda-breath-of-the-wild");
    expect(zelda.disques).toEqual({ JAP: "AAAAA", US: "AAAAA", PAL: "AAAAA" });
    const { releases } = construireJeu(zelda, SWITCH.prefixeCode);
    for (const r of ["JAP", "US", "PAL"] as const) {
      expect(releases[r].date_sortie).toBe("2017-03-03");
      expect(releases[r].code_produit).toBe("HAC-P-AAAAA");
    }
    expect(releases.JAP.titre).toBe("ゼルダの伝説 ブレス オブ ザ ワイルド");
  });

  it("une boîte (scan) par région, même pour une cartouche mondiale", () => {
    const zelda = jeu("the-legend-of-zelda-breath-of-the-wild");
    expect(
      choisirJaquettes(
        construireJeu(zelda, SWITCH.prefixeCode),
        zelda.disques,
        null,
        false,
        SWITCH.scans,
      ),
    ).toEqual({
      JAP: "switch/scans/JAP/AAAAA.jpg",
      US: "switch/scans/US/AAAAA.jpg",
      PAL: "switch/scans/PAL/AAAAA.jpg",
    });
  });

  it("cartouches propres à chaque région : pas de pack ni d'extension (Splatoon 2)", () => {
    expect(jeu("splatoon-2").disques).toEqual({
      JAP: "AAB6A",
      US: "AAB6B",
      PAL: "AAB6C",
    });
    expect(jeu("xenoblade-chronicles-2").disques.JAP).toBe("ADENA");
  });

  it("la cartouche d'origine plutôt qu'une réédition avec extension, et pas la cartouche chinoise", () => {
    expect(jeu("pokemon-scarlet").disques.PAL).toBe("ALZXA");
    expect(jeu("super-mario-odyssey").disques.JAP).toBe("AAACA");
    expect(jeux.map((j) => j.slug)).not.toContain(
      "pokemon-sword-and-pokemon-shield-double-pack",
    );
  });

  it("un jeu sorti au Japon seulement n'a pas de sortie US ni PAL", () => {
    const famicom = jeu(
      "famicom-tantei-club-kieta-kokeisha-ushiro-ni-tatsu-shojo",
    );
    expect(Object.keys(famicom.disques)).toEqual(["JAP"]);
    expect(famicom.sorties.US).toBeNull();
  });
});
