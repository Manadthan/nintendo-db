import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { boitesDuJeu, indexerBoites, lireIndexXml } from "./libretro";
import { indexerSeries, lireNoIntro, seriesDuJeu } from "./nointro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// Game Boy (étape 18, SPEC v1.23, DESIGN §1 nonies) : liste Wikipédia, index libretro et No-Intro du 19/11/2026.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const liste = lireListeCartouches(f("gb-wikipedia.html"));
const series = indexerSeries(lireNoIntro(f("gb-nointro.dat")));
const boites = indexerBoites(lireIndexXml(f("gb-libretro.xml")));
const jeu = (slug: string) => {
  const j = liste.jeux.find((x) => x.slug === slug);
  if (!j) throw new Error(`${slug} absent`);
  return j;
};

describe("Game Boy (étape 18)", () => {
  it("91 jeux Nintendo, adresses distinctes, les autres écartés", () => {
    expect(liste.jeux).toHaveLength(91);
    expect(new Set(liste.jeux.map((j) => j.slug)).size).toBe(91);
    expect(liste.autresEditeurs).toBe(15);
  });

  it("colonne « PAL region » lue : dates des 3 régions (Link's Awakening)", () => {
    const zelda = jeu("the-legend-of-zelda-links-awakening");
    expect(zelda.sorties.JAP?.date).toBe("1993-06-06");
    expect(zelda.sorties.US?.date).toBe("1993-08-06");
    expect(zelda.sorties.PAL?.date).toBe("1993-11-18");
  });

  it("jeu édité par Nintendo en Europe seulement : gardé (Mega Man II)", () => {
    const megaMan = jeu("mega-man-ii");
    expect(megaMan.sorties.US?.editeur).toBe("Capcom");
    expect(megaMan.sorties.PAL?.editeur).toBe("Nintendo");
  });

  it("préfixe DMG- ; boîtes US et PAL par le titre", () => {
    expect(sourceConsole("gb").prefixeCode).toBe("DMG-");
    const zelda = jeu("the-legend-of-zelda-links-awakening");
    const sorties = { JAP: true, US: true, PAL: true };
    const b = boitesDuJeu(
      boites,
      zelda.titres,
      sorties,
      seriesDuJeu(series, zelda.titres, sorties).japonaise,
    );
    expect(b.US).toBe("Legend of Zelda, The - Link's Awakening (USA, Europe)");
    expect(b.PAL).toBe(b.US);
  });

  it("couverture mesurée à l'étude : boîtes US et PAL", () => {
    let us = 0;
    let pal = 0;
    for (const j of liste.jeux) {
      const b = boitesDuJeu(boites, j.titres, {
        JAP: !!j.sorties.JAP,
        US: !!j.sorties.US,
        PAL: !!j.sorties.PAL,
      });
      if (b.US) us++;
      if (b.PAL) pal++;
    }
    expect(us).toBeGreaterThanOrEqual(73);
    expect(pal).toBeGreaterThanOrEqual(74);
  });
});
