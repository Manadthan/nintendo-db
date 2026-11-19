import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { construireJeu } from "./donnees";
import { boitesDuJeu, indexerBoites, lireIndexXml } from "./libretro";
import { indexerSeries, lireNoIntro, seriesDuJeu } from "./nointro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// Game Boy Color (étape 17, SPEC v1.22, DESIGN ADR-12) : liste Wikipédia, index libretro et No-Intro du 19/11/2026.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const liste = lireListeCartouches(f("gbc-wikipedia.html"));
const series = indexerSeries(lireNoIntro(f("gbc-nointro.dat")));
const boites = indexerBoites(lireIndexXml(f("gbc-libretro.xml")));
const GBC = sourceConsole("gbc");
const jeu = (slug: string) => {
  const j = liste.jeux.find((x) => x.slug === slug);
  if (!j) throw new Error(`${slug} absent`);
  return j;
};
const sortiesDe = (j: ReturnType<typeof jeu>) => ({
  JAP: !!j.sorties.JAP,
  US: !!j.sorties.US,
  PAL: !!j.sorties.PAL,
});
const importe = (slug: string) => {
  const j = jeu(slug);
  const t = seriesDuJeu(series, j.titres, sortiesDe(j));
  return {
    ...construireJeu({ ...j, codes: t.series }, GBC.prefixeCode),
    boites: boitesDuJeu(boites, j.titres, sortiesDe(j), t.japonaise),
  };
};

describe("Game Boy Color (étape 17)", () => {
  it("liste à une ligne d'en-tête : 45 jeux Nintendo, cartouches Dual Mode comprises, adresses distinctes", () => {
    expect(liste.jeux).toHaveLength(45);
    expect(new Set(liste.jeux.map((j) => j.slug)).size).toBe(45);
    expect(liste.autresEditeurs).toBe(15);
  });

  it("dates étiquetées dans « First released » et régions Oui / Non (Zelda Oracle of Ages)", () => {
    const zelda = jeu("the-legend-of-zelda-oracle-of-ages");
    expect(zelda.sorties.JAP?.date).toBe("2001-02-27");
    expect(zelda.sorties.US?.date).toBe("2001-05-14");
    expect(zelda.sorties.PAL?.date).toBe("2001-10-05");
  });

  it("éditeur par région : Kemco au Japon, Nintendo ailleurs (Bugs Bunny: Crazy Castle 3)", () => {
    const bugs = jeu("bugs-bunny-crazy-castle-3");
    expect(bugs.sorties.JAP?.editeur).toBe("Kemco");
    expect(bugs.sorties.US?.editeur).toBe("Nintendo");
  });

  it("code produit : DMG- pour une cartouche Dual Mode, CGB- sinon, avec la série No-Intro", () => {
    expect(
      importe("the-legend-of-zelda-links-awakening-dx").releases.US
        .code_produit,
    ).toBe("DMG-AZLE");
    expect(importe("pokemon-crystal-version").releases.US.code_produit).toBe(
      "CGB-BYTE",
    );
    // Série inconnue de No-Intro : « — », à saisir à la main.
    expect(importe("mario-tennis").releases.US.code_produit).toBeNull();
  });

  it("boîtes libretro par région ; couverture mesurée à l'étude", () => {
    expect(importe("pokemon-crystal-version").boites.US).toBe(
      "Pokemon - Crystal Version (USA)",
    );
    let us = 0;
    let pal = 0;
    for (const j of liste.jeux) {
      const b = boitesDuJeu(boites, j.titres, sortiesDe(j));
      if (b.US) us++;
      if (b.PAL) pal++;
    }
    expect(us).toBeGreaterThanOrEqual(35);
    expect(pal).toBeGreaterThanOrEqual(30);
  });
});
