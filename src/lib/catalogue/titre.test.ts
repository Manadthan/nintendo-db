import { describe, expect, it } from "vitest";
import { titreAffiche } from "./titre";
import type {
  JeuCatalogue,
  Region,
  SortieCatalogue,
  VersionAffichee,
} from "./types";

const sortie = (overrides: Partial<SortieCatalogue> = {}): SortieCatalogue => ({
  sortie: true,
  titre: "Titre",
  titreRomanise: null,
  date: "2015-01-22",
  precision: "jour",
  jaquette: null,
  ...overrides,
});

const version = (
  region: Region,
  s: Partial<SortieCatalogue>,
  extra: Partial<Pick<VersionAffichee, "guide" | "amiibo">> = {},
): VersionAffichee => {
  const courante = sortie(s);
  const absente = sortie({ sortie: false, titre: null, date: null });
  const jeu: JeuCatalogue = {
    id: "kirby",
    slug: "kirby",
    console: { slug: "wii-u", nom: "Wii U" },
    developpeur: null,
    editeur: "Nintendo",
    genres: [],
    series: [],
    metacritic: null,
    sorties: {
      JAP: region === "JAP" ? courante : absente,
      US: region === "US" ? courante : absente,
      PAL: region === "PAL" ? courante : absente,
    },
  };
  return { jeu, region, sortie: courante, ...extra };
};

describe("titreAffiche (US-03, SPEC v1.56)", () => {
  it("affiche le titre romanisé pour une version japonaise lorsqu'il est renseigné", () => {
    const v = version("JAP", {
      titre: "タッチ! カービィ スーパーレインボー",
      titreRomanise: "Touch! Kirby Super Rainbow",
    });
    expect(titreAffiche(v)).toBe("Touch! Kirby Super Rainbow");
  });

  it("se rabat sur le titre japonais si le titre romanisé est absent ou vide", () => {
    expect(
      titreAffiche(
        version("JAP", {
          titre: "マリオカート8",
          titreRomanise: null,
        }),
      ),
    ).toBe("マリオカート8");

    expect(
      titreAffiche(
        version("JAP", {
          titre: "マリオカート8",
          titreRomanise: "   ",
        }),
      ),
    ).toBe("マリオカート8");
  });

  it("affiche toujours le titre de la région pour PAL et US", () => {
    expect(
      titreAffiche(
        version("PAL", {
          titre: "Kirby and the Rainbow Paintbrush",
          titreRomanise: "Ignoré",
        }),
      ),
    ).toBe("Kirby and the Rainbow Paintbrush");

    expect(
      titreAffiche(
        version("US", {
          titre: "Kirby and the Rainbow Curse",
          titreRomanise: "Ignoré",
        }),
      ),
    ).toBe("Kirby and the Rainbow Curse");
  });

  it("conserve le titre d'un guide japonais (pas de titre romanisé)", () => {
    const v = version(
      "JAP",
      { titre: "マリオカート8 パーフェクトガイド", titreRomanise: null },
      {
        guide: {
          id: "g1",
          isbn: "9784000000017",
          editeur: null,
          couverture: null,
        },
      },
    );
    expect(titreAffiche(v)).toBe("マリオカート8 パーフェクトガイド");
  });
});
