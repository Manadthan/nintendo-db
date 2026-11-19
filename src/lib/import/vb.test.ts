import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { construireJeu } from "./donnees";
import { boitesDuJeu, indexerBoites, lireIndexXml } from "./libretro";
import { indexerSeries, lireNoIntro, seriesDuJeu } from "./nointro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// Virtual Boy (étape 19, SPEC v1.24, DESIGN §1 decies) : liste Wikipédia, index libretro et No-Intro du 19/11/2026.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const liste = lireListeCartouches(f("vb-wikipedia.html"));
const series = indexerSeries(lireNoIntro(f("vb-nointro.dat")));
const boites = indexerBoites(lireIndexXml(f("vb-libretro.xml")));
const VB = sourceConsole("vb");
const jeu = (slug: string) => {
  const j = liste.jeux.find((x) => x.slug === slug);
  if (!j) throw new Error(`${slug} absent`);
  return j;
};
const importe = (slug: string) => {
  const j = jeu(slug);
  const sorties = {
    JAP: !!j.sorties.JAP,
    US: !!j.sorties.US,
    PAL: !!j.sorties.PAL,
  };
  const t = seriesDuJeu(series, j.titres, sorties);
  return {
    ...construireJeu({ ...j, codes: t.series }, VB.prefixeCode),
    boites: boitesDuJeu(boites, j.titres, sorties, t.japonaise),
  };
};

describe("Virtual Boy (étape 19)", () => {
  it("11 jeux Nintendo, Japon et États-Unis seulement", () => {
    expect(liste.jeux).toHaveLength(11);
    expect(liste.jeux.every((j) => !j.sorties.PAL)).toBe(true);
  });

  it("« —N/a » : 3D Tetris n'est pas sorti au Japon", () => {
    expect(jeu("3d-tetris").sorties.JAP).toBeNull();
    expect(jeu("3d-tetris").sorties.US?.date).toBe("1996-03-22");
  });

  it("éditeur par région entre parenthèses : T&E Soft au Japon, Nintendo aux États-Unis (Golf)", () => {
    expect(jeu("golf").sorties.JAP?.editeur).toBe("T&E Soft");
    expect(jeu("golf").sorties.US?.editeur).toBe("Nintendo");
  });

  it("boîte « (Japan, USA) » pour les États-Unis seulement ; vraie boîte japonaise gardée (Red Alarm)", () => {
    expect(importe("marios-tennis").boites).toEqual({
      US: "Mario's Tennis (Japan, USA)",
    });
    expect(importe("red-alarm").boites.JAP).toBe("Red Alarm (Japan)");
  });

  it("codes VUE- : série de chaque région, sinon rien (cartouche commune)", () => {
    const tennis = importe("marios-tennis").releases;
    expect(tennis.JAP.code_produit).toBe("VUE-VMTJ");
    expect(tennis.US.code_produit).toBeNull();
    expect(importe("red-alarm").releases.US.code_produit).toBe("VUE-VREE");
  });

  it("boîte japonaise retrouvée malgré « & » écrit « _ » (T_E Virtual Golf)", () => {
    expect(importe("golf").boites.JAP).toBe("T_E Virtual Golf (Japan)");
  });
});
