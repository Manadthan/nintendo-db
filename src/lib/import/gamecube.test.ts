import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { choisirJaquettes, construireJeu } from "./donnees";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import { estDisqueGameCubeDuCommerce } from "./relais-wii";

// Import GameCube (étape 11, SPEC v1.13 US-10) : GameTDB seul, sur la fixture réduite du 18/11/2026.
const GC = sourceConsole("gamecube");
const disques = lireGameTdb(
  readFileSync(join(__dirname, "__fixtures__/gctdb.xml"), "utf8"),
  GC.estDisque,
  GC.garderLogiciels,
);
const { jeux, ecartes } = appliquerGameTdb([], regrouperGameTdb(disques));
const slugs = jeux.map((j) => j.slug);
const jeu = (slug: string) => {
  const trouve = jeux.find((j) => j.slug === slug);
  if (!trouve) throw new Error(`${slug} absent`);
  return trouve;
};

describe("règles des disques GameCube", () => {
  const garde = (id: string, titre: string, genre = "action") =>
    estDisqueGameCubeDuCommerce("GameCube", id, "NTSC-U", titre, genre);

  it("garde les disques du commerce (G) et les 2 compilations choisies (P)", () => {
    expect(garde("GALE01", "Super Smash Bros. Melee")).toBe(true);
    expect(garde("PZLE01", "The Legend of Zelda: Collector's Edition")).toBe(
      true,
    );
    expect(garde("PRJE01", "Pac-Man Vs.")).toBe(true);
  });

  it("écarte démos, disques bonus, Start-Up Disc et autres consoles", () => {
    expect(
      garde(
        "G97E01",
        "Interactive Multi-Game Demo Disc: March 2002",
        "sampler",
      ),
    ).toBe(false);
    expect(garde("D29J01", "Gekkan Nintendo Tentou Demo 2002.5.1")).toBe(false);
    expect(
      garde("PM4E01", "Mario Kart: Double Dash!! (Bonus Disc)", "demo,sampler"),
    ).toBe(false);
    expect(garde("UGPE01", "Game Boy Player Start-Up Disc", "software")).toBe(
      false,
    );
    expect(
      estDisqueGameCubeDuCommerce(
        "",
        "RMCE01",
        "NTSC-U",
        "Mario Kart Wii",
        "racing",
      ),
    ).toBe(false);
  });
});

describe("import GameCube depuis GameTDB seul (fixture du 18/11/2026)", () => {
  it("158 disques, 58 jeux Nintendo, chacun à une adresse distincte", () => {
    expect(disques).toHaveLength(158);
    expect(jeux).toHaveLength(58);
    expect(new Set(slugs).size).toBe(58);
    expect(ecartes).toEqual([]);
  });

  it("Melee : 3 régions, titre japonais, code DOL-, faces découpées dans gamecube/faces", () => {
    const melee = jeu("super-smash-bros-melee");
    expect(melee.japonais?.titre).toBe("大乱闘スマッシュブラザーズDX");
    const construit = construireJeu(melee, GC.prefixeCode);
    expect(construit.releases.PAL.code_produit).toBe("DOL-GALP");
    expect(construit.releases.US.code_produit).toBe("DOL-GALE");
    expect(
      choisirJaquettes(construit, melee.disques, null, false, GC.scans),
    ).toEqual({
      JAP: "gamecube/faces/GALJ01.jpg",
      US: "gamecube/faces/GALE01.jpg",
      PAL: "gamecube/faces/GALP01.jpg",
    });
  });

  it("garde Pokémon Channel (classé « software » par GameTDB) et les compilations", () => {
    expect(slugs).toContain("pokemon-channel");
    expect(slugs).toContain("the-legend-of-zelda-collectors-edition");
    expect(slugs).toContain("pac-man-vs");
  });

  it("aucune démo ni disque bonus", () => {
    expect(slugs.filter((s) => /demo|bonus|tentou/.test(s))).toEqual([]);
  });

  it("un jeu sorti au Japon seulement n'a pas de sortie US ni PAL (Giftpia)", () => {
    const giftpia = jeu("giftpia");
    expect(Object.keys(giftpia.disques)).toEqual(["JAP"]);
    expect(giftpia.sorties.PAL).toBeNull();
  });
});
