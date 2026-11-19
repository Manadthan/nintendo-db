import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { construireJeu } from "./donnees";
import { lireListeCartouches } from "./wikipedia-cartouches";

// N64 et GBA (étape 14, SPEC v1.18) : listes Wikipédia du 19/11/2026 (fixtures réduites aux jeux Nintendo + 15 autres).
const lire = (f: string) =>
  lireListeCartouches(readFileSync(join(__dirname, "__fixtures__", f), "utf8"));
const N64 = lire("n64-wikipedia.html");
const GBA = lire("gba-wikipedia.html");
const jeu = (l: typeof N64, slug: string) => {
  const j = l.jeux.find((x) => x.slug === slug);
  if (!j) throw new Error(`${slug} absent`);
  return j;
};

describe("liste Wikipédia N64", () => {
  it("58 jeux édités par Nintendo, chacun à une adresse distincte ; les autres écartés", () => {
    expect(N64.jeux).toHaveLength(58);
    expect(new Set(N64.jeux.map((j) => j.slug)).size).toBe(58);
    expect(N64.autresEditeurs).toBe(15);
  });

  it("dates par région, développeur, lien ; pas de code produit", () => {
    const zelda = jeu(N64, "the-legend-of-zelda-ocarina-of-time");
    expect(zelda.developpeur).toBe("Nintendo EAD");
    expect(zelda.wikipediaUrl).toMatch(/Ocarina_of_Time$/);
    const { releases } = construireJeu(zelda, "");
    expect(releases.JAP.date_sortie).toBe("1998-11-21");
    expect(releases.US.date_sortie).toBe("1998-11-23");
    expect(releases.PAL.date_sortie).toBe("1998-12-11");
    expect(releases.PAL.code_produit).toBeNull();
  });

  it("éditeur par région : Hudson Soft au Japon, Nintendo ailleurs (Bomberman 64)", () => {
    const b = jeu(N64, "bomberman-64");
    expect(b.sorties.JAP?.editeur).toBe("Hudson Soft");
    expect(b.sorties.US?.editeur).toBe("Nintendo");
    expect(b.sorties.PAL?.editeur).toBe("Nintendo");
  });
});

describe("liste Wikipédia GBA", () => {
  it("≈ 120 jeux Nintendo, adresses distinctes", () => {
    expect(GBA.jeux).toHaveLength(120);
    expect(new Set(GBA.jeux.map((j) => j.slug)).size).toBe(120);
  });

  it("dates lues dans la cellule commune, par région ; clés de tri cachées ignorées (Advance Wars 2)", () => {
    const aw = jeu(GBA, "advance-wars-2-black-hole-rising");
    expect(aw.sorties.US).toMatchObject({
      date: "2003-06-24",
      precision: "jour",
    });
    expect(aw.sorties.PAL).toMatchObject({ date: "2003-03-10" });
    expect(aw.sorties.JAP).toMatchObject({ date: "2004-11-25" });
  });

  it("une région non cochée n'est pas sortie (bit Generations : Japon seulement)", () => {
    const b = jeu(GBA, "bit-generations-dialhex");
    expect(b.sorties.JAP).not.toBeNull();
    expect(b.sorties.US).toBeNull();
    expect(b.sorties.PAL).toBeNull();
  });
});

describe("éditeurs tels que Wikipédia les sert en direct (#139)", () => {
  // Page en direct : chaque retour à la ligne porte un attribut (<br id="…">), absent des fixtures nettoyées.
  const ligne = (editeurs: string) =>
    lireListeCartouches(`<table class="wikitable">
      <tr><th rowspan="2">Title</th><th rowspan="2">Developer</th><th rowspan="2">Publisher</th><th colspan="3">Release date</th></tr>
      <tr><th>Japan</th><th>North America</th><th>PAL</th></tr>
      <tr><td><i>Un jeu</i></td><td>Studio</td><td>${editeurs}</td>
        <td>June 1, 2000</td><td>July 1, 2000</td><td>August 1, 2000</td></tr>
    </table>`).jeux[0]?.sorties;

  it("un retour à la ligne avec attribut sépare deux éditeurs (Hudson Soft au Japon, Nintendo ailleurs)", () => {
    const sorties = ligne(
      '<a id="a1">Hudson Soft</a><sup id="s1"> JP</sup><br id="b1"><a id="a2">Nintendo</a><sup id="s2"> WW</sup>',
    );
    expect(sorties?.JAP?.editeur).toBe("Hudson Soft");
    expect(sorties?.US?.editeur).toBe("Nintendo");
  });

  it("un éditeur sans région vaut pour les régions sans éditeur précisé (Nintendo, Kemco au Japon)", () => {
    const sorties = ligne(
      '<a id="a1">Nintendo</a><br id="b1"><a id="a2">Kemco</a><sup id="s1"> JP</sup>',
    );
    expect(sorties?.JAP?.editeur).toBe("Kemco");
    expect(sorties?.US?.editeur).toBe("Nintendo");
    expect(sorties?.PAL?.editeur).toBe("Nintendo");
  });
});
