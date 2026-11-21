import { describe, expect, it } from "vitest";
import { trier } from "./catalogue";
import { decouperFrise, triFrise } from "./frise";
import type { JeuCatalogue } from "./types";

const jeu = (slug: string, date: string | null): JeuCatalogue => ({
  id: slug,
  slug,
  console: { slug: "n64", nom: "Nintendo 64" },
  developpeur: null,
  editeur: "Nintendo",
  genres: [],
  series: [],
  metacritic: null,
  sorties: {
    JAP: {
      sortie: false,
      titre: null,
      titreRomanise: null,
      date: null,
      precision: null,
      jaquetteSrcset: null,
    },
    US: {
      sortie: false,
      titre: null,
      titreRomanise: null,
      date: null,
      precision: null,
      jaquetteSrcset: null,
    },
    PAL: {
      sortie: true,
      titre: slug,
      titreRomanise: null,
      date,
      precision: date ? "jour" : null,
      jaquetteSrcset: null,
    },
  },
});

const JEUX = [
  jeu("goldeneye", "1997-11-07"),
  jeu("mario-kart-64", "1997-06-24"),
  jeu("yoshis-story", "1998-05-10"),
  jeu("sans-date", null),
];

describe("triFrise (SPEC v1.38)", () => {
  it("garde les tris par date, remplace A → Z et la note par « plus récents »", () => {
    expect(triFrise("anciens")).toBe("anciens");
    expect(triFrise("recents")).toBe("recents");
    expect(triFrise("az")).toBe("recents");
    expect(triFrise("note")).toBe("recents");
  });
});

describe("decouperFrise (SPEC v1.38)", () => {
  it("range les jeux par année, dans l'ordre du tri", () => {
    const frise = decouperFrise(trier(JEUX, "recents", "PAL"));
    expect(
      frise.map((a) => [a.annee, a.jeux.map((j) => j.version.jeu.slug)]),
    ).toEqual([
      ["1998", ["yoshis-story"]],
      ["1997", ["goldeneye", "mario-kart-64"]],
      ["Date inconnue", ["sans-date"]],
    ]);
  });

  it("alterne gauche et droite sans recommencer à chaque année", () => {
    const cotes = decouperFrise(trier(JEUX, "recents", "PAL")).flatMap((a) =>
      a.jeux.map((j) => j.cote),
    );
    expect(cotes).toEqual(["gauche", "droite", "gauche", "droite"]);
  });

  it("aucun jeu : aucune année", () => {
    expect(decouperFrise([])).toEqual([]);
  });
});
