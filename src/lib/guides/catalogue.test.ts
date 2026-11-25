import { describe, expect, it } from "vitest";
import type { JeuCatalogue } from "@/lib/catalogue/types";
import {
  relierGuides,
  versGuidesCatalogue,
  type LigneGuideCatalogue,
} from "./catalogue";

// Guides du catalogue (US-27, ADR-19 point 4) : lignes écrites à la main.

const ligne = (
  isbn: string,
  jeux: string[],
  google: string | null = null,
): LigneGuideCatalogue => ({
  isbn,
  titre: `Guide ${isbn}`,
  editeur: "KADOKAWA",
  date_parution: "2016-06-01",
  precision_date: "mois",
  google_books_id: google,
  guides_jeux: jeux.map((game_id) => ({ game_id })),
});

const jeu = (id: string): JeuCatalogue => ({
  id,
  slug: id,
  console: { slug: "3ds", nom: "3DS" },
  developpeur: null,
  editeur: null,
  genres: [],
  series: [],
  metacritic: null,
  sorties: {
    JAP: {
      sortie: true,
      titre: id,
      titreRomanise: null,
      date: null,
      precision: null,
      jaquette: null,
    },
    US: {
      sortie: false,
      titre: null,
      titreRomanise: null,
      date: null,
      precision: null,
      jaquette: null,
    },
    PAL: {
      sortie: false,
      titre: null,
      titreRomanise: null,
      date: null,
      precision: null,
      jaquette: null,
    },
  },
});

describe("guides du catalogue (/guides.json)", () => {
  it("envoie le strict nécessaire, trié par ISBN, jeux sans doublon", () => {
    expect(
      versGuidesCatalogue([
        ligne("9784000000024", ["b", "a", "a"], "abcDEF12345_"),
        ligne("9784000000017", ["c"]),
      ]),
    ).toEqual([
      {
        isbn: "9784000000017",
        titre: "Guide 9784000000017",
        editeur: "KADOKAWA",
        date: "2016-06-01",
        precision: "mois",
        couverture: null,
        jeux: ["c"],
      },
      {
        isbn: "9784000000024",
        titre: "Guide 9784000000024",
        editeur: "KADOKAWA",
        date: "2016-06-01",
        precision: "mois",
        couverture: "abcDEF12345_",
        jeux: ["a", "b"],
      },
    ]);
  });

  it("n'envoie pas un guide qui ne couvre aucun jeu", () => {
    expect(versGuidesCatalogue([ligne("9784000000017", [])])).toEqual([]);
  });

  it("relie chaque guide aux jeux chargés et écarte ceux dont aucun jeu n'est connu", () => {
    const guides = versGuidesCatalogue([
      ligne("9784000000017", ["fe-birthright", "fe-conquest", "inconnu"]),
      ligne("9784000000024", ["inconnu"]),
    ]);
    const relies = relierGuides(guides, [
      jeu("fe-conquest"),
      jeu("fe-birthright"),
    ]);
    expect(relies).toHaveLength(1);
    expect(relies[0]?.jeux.map((j) => j.id)).toEqual([
      "fe-birthright",
      "fe-conquest",
    ]);
  });
});
