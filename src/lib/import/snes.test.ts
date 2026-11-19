import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prefixeSuperNintendo, sourceConsole } from "./consoles";
import { boitesDuJeu, indexerBoites, lireIndexXml } from "./libretro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// Super Nintendo (étape 20, SPEC v1.25, DESIGN §1 undecies) : liste Wikipédia et index libretro du 19/11/2026.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const liste = lireListeCartouches(f("snes-wikipedia.html"));
const boites = indexerBoites(lireIndexXml(f("snes-libretro.xml")));
const jeu = (slug: string) => {
  const j = liste.jeux.find((x) => x.slug === slug);
  if (!j) throw new Error(`${slug} absent`);
  return j;
};
const boitesDe = (slug: string) => {
  const j = jeu(slug);
  return boitesDuJeu(
    boites,
    j.titres,
    { JAP: !!j.sorties.JAP, US: !!j.sorties.US, PAL: !!j.sorties.PAL },
    null,
    j.autresTitres,
  );
};

describe("Super Nintendo (étape 20)", () => {
  it("98 jeux Nintendo, adresses distinctes", () => {
    expect(liste.jeux).toHaveLength(98);
    expect(new Set(liste.jeux.map((j) => j.slug)).size).toBe(98);
  });

  it("« Cancelled » : Mario & Wario n'est sorti qu'au Japon", () => {
    const marioWario = jeu("mario-wario");
    expect(marioWario.sorties.JAP).not.toBeNull();
    expect(marioWario.sorties.US).toBeNull();
  });

  it("boîte japonaise par le titre japonais cité par Wikipédia (Super Mario World)", () => {
    expect(boitesDe("super-mario-world")).toEqual({
      JAP: "Super Mario World - Super Mario Bros. 4 (Japan)",
      US: "Super Mario World (USA)",
      PAL: "Super Mario World (Europe)",
    });
  });

  it("préfixe du code selon la région de la série", () => {
    expect(sourceConsole("snes").prefixeCode).toBe(prefixeSuperNintendo);
    expect(["A83J", "A8FE", "A8FP"].map(prefixeSuperNintendo)).toEqual([
      "SHVC-",
      "SNS-",
      "SNSP-",
    ]);
  });

  it("couverture mesurée à l'étude : boîtes JAP avec les titres japonais, US", () => {
    let jap = 0;
    let us = 0;
    for (const j of liste.jeux) {
      const b = boitesDe(j.slug);
      if (b.JAP) jap++;
      if (b.US) us++;
    }
    expect(jap).toBeGreaterThanOrEqual(58);
    expect(us).toBeGreaterThanOrEqual(65);
  });
});
