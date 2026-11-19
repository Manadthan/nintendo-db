import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prefixeNes, sourceConsole } from "./consoles";
import { boitesDuJeu, indexerBoites, lireIndexXml } from "./libretro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// NES (étape 21, SPEC v1.27, DESIGN §1 duodecies) : liste Wikipédia et index libretro du 19/11/2026.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const liste = lireListeCartouches(f("nes-wikipedia.html"));
const boites = indexerBoites(lireIndexXml(f("nes-libretro.xml")));
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

describe("NES (étape 21)", () => {
  it("104 jeux Nintendo, adresses distinctes", () => {
    expect(liste.jeux).toHaveLength(104);
    expect(new Set(liste.jeux.map((j) => j.slug)).size).toBe(104);
  });

  it("une boîte « World » sert aux États-Unis et en Europe, jamais au Japon (Duck Hunt)", () => {
    expect(boitesDe("duck-hunt")).toEqual({
      US: "Duck Hunt (World)",
      PAL: "Duck Hunt (World)",
    });
  });

  it("les cartes e-Reader (rééditions Game Boy Advance) ne sont pas des boîtes NES (Donkey Kong)", () => {
    expect(boitesDe("donkey-kong")).toEqual({
      JAP: "Donkey Kong (Japan)",
      US: "Donkey Kong (World) (Rev 1)",
      PAL: "Donkey Kong (World) (Rev 1)",
    });
  });

  it("une réédition dans Animal Crossing n'est pas la boîte japonaise (Pinball)", () => {
    expect(boitesDe("pinball").JAP).toBeUndefined();
  });

  it("boîte japonaise sous le titre japonais cité par Wikipédia (Super Mario Bros. 2)", () => {
    expect(boitesDe("super-mario-bros-2").JAP).toBe(
      "Super Mario USA (Japan)",
    );
  });

  it("préfixe du code : HVC- au Japon, NES- ailleurs", () => {
    expect(sourceConsole("nes").prefixeCode).toBe(prefixeNes);
    expect(["SMJ", "SME", "SMP"].map((s) => prefixeNes(`${s}`))).toEqual([
      "HVC-",
      "NES-",
      "NES-",
    ]);
  });

  it("couverture mesurée : boîtes JAP, US et PAL", () => {
    let jap = 0;
    let us = 0;
    let pal = 0;
    for (const j of liste.jeux) {
      const b = boitesDe(j.slug);
      if (b.JAP) jap++;
      if (b.US) us++;
      if (b.PAL) pal++;
    }
    expect(jap).toBeGreaterThanOrEqual(38);
    expect(us).toBeGreaterThanOrEqual(86);
    expect(pal).toBeGreaterThanOrEqual(78);
  });
});
