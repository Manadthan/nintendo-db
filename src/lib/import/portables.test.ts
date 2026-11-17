import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { choisirJaquettes, construireJeu } from "./donnees";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import {
  estCarteDuCommerce,
  languesScan,
  rangCartePal,
} from "./relais-portables";

// Import DS et 3DS (étape 9, SPEC v1.10 US-10) : GameTDB seul, sur les fixtures réduites du 17/11/2026.
const importer = (console_: "ds" | "3ds", fichier: string) => {
  const source = sourceConsole(console_);
  const disques = lireGameTdb(
    readFileSync(join(__dirname, "__fixtures__", fichier), "utf8"),
    source.estDisque,
  );
  const { jeux, ecartes } = appliquerGameTdb([], regrouperGameTdb(disques));
  const jeu = (slug: string) => {
    const trouve = jeux.find((j) => j.slug === slug);
    if (!trouve) throw new Error(`${slug} absent`);
    return trouve;
  };
  return { source, disques, jeux, jeu, ecartes };
};

describe("règles des cartes DS et 3DS", () => {
  it("garde les cartes du commerce", () => {
    expect(
      estCarteDuCommerce(
        "ds",
        "DS",
        "A2DP",
        "PAL",
        "New Super Mario Bros.",
        "action",
      ),
    ).toBe(true);
    expect(
      estCarteDuCommerce(
        "3ds",
        "New3DS",
        "CAFP",
        "PAL",
        "Xenoblade Chronicles 3D",
        "action",
      ),
    ).toBe(true);
  });

  it("écarte démos, bornes, logiciels, jeux Super Nintendo et eShop", () => {
    expect(
      estCarteDuCommerce(
        "ds",
        "DS",
        "Y28P",
        "PAL",
        "Yoshi's Island DS (Demo)",
        "demo",
      ),
    ).toBe(false);
    expect(
      estCarteDuCommerce(
        "ds",
        "DS",
        "A22E",
        "NTSC-U",
        "WarioWare: Touched! (Demo)",
        "action",
      ),
    ).toBe(false);
    expect(
      estCarteDuCommerce(
        "ds",
        "DS",
        "UBRJ",
        "NTSC-J",
        "Nintendo DS Browser",
        "educational,software",
      ),
    ).toBe(false);
    expect(
      estCarteDuCommerce(
        "ds",
        "DSiWare",
        "KAAE",
        "NTSC-U",
        "Jeu DSiWare",
        "puzzle",
      ),
    ).toBe(false);
    expect(
      estCarteDuCommerce(
        "3ds",
        "New3DS",
        "UADJ",
        "NTSC-J",
        "Super Mario Kart",
        "",
      ),
    ).toBe(false);
    expect(
      estCarteDuCommerce(
        "3ds",
        "3DS",
        "JB7P",
        "PAL",
        "Mario and Donkey Kong: Minis on the Move",
        "puzzle",
      ),
    ).toBe(false);
    expect(
      estCarteDuCommerce(
        "3ds",
        "3DS",
        "AMKK",
        "NTSC-K",
        "Mario Kart 7",
        "racing",
      ),
    ).toBe(false);
  });

  it("choisit la langue du scan et la carte européenne anglaise", () => {
    expect(languesScan("ADAD")).toEqual(["DE", "EN", "US", "JA"]);
    expect(languesScan("A2DJ")).toEqual(["JA", "EN", "US"]);
    expect(languesScan("A2DP")).toEqual(["EN", "US", "JA"]);
    expect(rangCartePal("ADAP")).toBeLessThan(rangCartePal("ADAX"));
    expect(rangCartePal("ADAX")).toBeLessThan(rangCartePal("ADAD"));
  });
});

describe("import DS (fixture du 17/11/2026)", () => {
  const { source, disques, jeux, jeu, ecartes } = importer("ds", "dstdb.xml");

  it("écarte une réédition au même titre (New Super Mario Bros. japonais A85J), avec la raison", () => {
    expect(jeu("new-super-mario-bros").disques.JAP).toBe("A2DJ");
    expect(ecartes.map((e) => e.raison)).toContain(
      "réédition ou variante d'un jeu déjà retenu (A85J)",
    );
  });

  it("358 cartes, 114 jeux Nintendo, chacun à une adresse distincte (2 rééditions écartées)", () => {
    expect(disques).toHaveLength(358);
    expect(jeux).toHaveLength(114);
    expect(new Set(jeux.map((j) => j.slug)).size).toBe(114);
  });

  it("titre européen de la carte anglaise, pas d'un seul pays (Pokémon Diamant : 5 cartes PAL)", () => {
    const diamant = jeu("pokemon-diamond-version");
    expect(diamant.titres.PAL).toBe("Pokémon Diamond Version");
    expect(diamant.disques.PAL).toBe("ADAP");
  });

  it("codes NTR-, titre japonais, scans dans ds/scans", () => {
    const nsmb = jeu("new-super-mario-bros");
    const construit = construireJeu(nsmb, source.prefixeCode);
    expect(construit.releases.PAL.code_produit).toBe("NTR-A2DP");
    expect(construit.releases.JAP.titre).not.toBe("New Super Mario Bros.");
    expect(
      choisirJaquettes(construit, nsmb.disques, null, false, source.scans).US,
    ).toBe("ds/scans/A2DE.jpg");
  });
});

describe("import 3DS (fixture du 17/11/2026)", () => {
  const { source, disques, jeux, jeu } = importer("3ds", "3dstdb.xml");

  it("295 cartes, 118 jeux Nintendo, chacun à une adresse distincte", () => {
    expect(disques).toHaveLength(295);
    expect(jeux).toHaveLength(118);
    expect(new Set(jeux.map((j) => j.slug)).size).toBe(118);
  });

  it("codes CTR-P-, et KTR-P- pour une carte New 3DS", () => {
    const mk7 = construireJeu(jeu("mario-kart-7"), source.prefixeCode);
    expect(mk7.releases.PAL.code_produit).toBe("CTR-P-AMKP");
    const xeno = construireJeu(
      jeu("xenoblade-chronicles-3d"),
      source.prefixeCode,
    );
    expect(xeno.releases.PAL.code_produit).toBe("KTR-P-CAFP");
  });

  it("aucun jeu Super Nintendo de la New 3DS", () => {
    expect(jeux.map((j) => j.slug)).not.toContain("super-mario-kart");
  });
});
