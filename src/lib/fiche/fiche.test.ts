import { describe, expect, it } from "vitest";
import { regionParDefaut, versJeuFiche, type LigneFiche } from "./fiche";

const ID = "20000000-0000-0000-0000-000000000001";

const release = (
  region: "JAP" | "US" | "PAL",
  titre: string | null,
  date: string | null,
  extra = {},
) => ({
  region,
  sortie: date !== null,
  titre,
  titre_romanise: null,
  date_sortie: date,
  precision_date: date ? ("jour" as const) : null,
  editeur: date ? "Nintendo" : null,
  code_produit: null,
  jaquette_path: null,
  jaquette_source: null,
  ...extra,
});

const KARAOKE: LigneFiche = {
  id: ID,
  slug: "wii-karaoke-u",
  developpeur: "Xing",
  series: [],
  genre: null,
  wikipedia_url: "https://en.wikipedia.org/wiki/Wii_Karaoke_U",
  metacritic_note: null,
  metacritic_url: null,
  consoles: { slug: "wii-u", nom: "Wii U" },
  releases: [
    release("JAP", "Wii カラオケ U", "2012-12-08", {
      titre_romanise: "Wii Karaoke U",
      code_produit: "WUP-P-AKRJ",
    }),
    release("US", null, null),
    release("PAL", "Wii Karaoke U", "2013-10-04"),
  ],
};

describe("captures RAWG de la fiche (US-26)", () => {
  it("les remet dans l'ordre et garde le slug RAWG", () => {
    const jeu = versJeuFiche({
      ...KARAOKE,
      rawg_slug: "wii-karaoke-u",
      captures: [
        {
          position: 2,
          url: "https://media.rawg.io/media/screenshots/b.jpg",
          largeur: 1280,
          hauteur: 720,
        },
        {
          position: 1,
          url: "https://media.rawg.io/media/screenshots/a.jpg",
          largeur: null,
          hauteur: null,
        },
      ],
    });
    expect(jeu.rawgSlug).toBe("wii-karaoke-u");
    expect(jeu.captures).toEqual([
      {
        url: "https://media.rawg.io/media/screenshots/a.jpg",
        largeur: null,
        hauteur: null,
      },
      {
        url: "https://media.rawg.io/media/screenshots/b.jpg",
        largeur: 1280,
        hauteur: 720,
      },
    ]);
  });

  it("sans captures : liste vide, pas de lien", () => {
    const jeu = versJeuFiche(KARAOKE);
    expect(jeu.captures).toEqual([]);
    expect(jeu.rawgSlug).toBeNull();
  });
});

describe("guides japonais de la fiche (US-27)", () => {
  const guide = (isbn: string, titre: string, date: string | null) => ({
    guides: {
      isbn,
      titre,
      editeur: "KADOKAWA",
      date_parution: date,
      couverture: null,
      google_books_id: null,
    },
  });

  it("les classe du plus ancien au plus récent, sans date à la fin", () => {
    const jeu = versJeuFiche({
      ...KARAOKE,
      guides_jeux: [
        guide("9784000000031", "C", null),
        guide("9784000000024", "B", "2023-05-01"),
        guide("9784000000017", "A", "2022-10-01"),
        { guides: null },
      ],
    });
    expect(jeu.guides.map((g) => [g.titre, g.annee])).toEqual([
      ["A", "2022"],
      ["B", "2023"],
      ["C", null],
    ]);
  });

  it("sans guide : liste vide (pas de bloc)", () => {
    expect(versJeuFiche(KARAOKE).guides).toEqual([]);
  });
});

describe("versJeuFiche (US-04)", () => {
  const jeu = versJeuFiche(KARAOKE);

  it("reprend les informations du jeu et sa console", () => {
    expect(jeu).toMatchObject({
      slug: "wii-karaoke-u",
      developpeur: "Xing",
      series: [],
      wikipediaUrl: "https://en.wikipedia.org/wiki/Wii_Karaoke_U",
      console: { slug: "wii-u", nom: "Wii U" },
    });
  });

  it("garde, pour chaque région, l'éditeur et le code produit (inconnu : null)", () => {
    expect(jeu.sorties.JAP).toMatchObject({
      editeur: "Nintendo",
      codeProduit: "WUP-P-AKRJ",
      titreRomanise: "Wii Karaoke U",
    });
    expect(jeu.sorties.PAL.codeProduit).toBeNull();
    expect(jeu.sorties.US).toMatchObject({
      sortie: false,
      editeur: null,
      codeProduit: null,
    });
  });
});

describe("regionParDefaut (US-04)", () => {
  const jeu = versJeuFiche(KARAOKE);

  it("ouvre la fiche sur le marché choisi dans le catalogue, si le jeu y est sorti", () => {
    expect(regionParDefaut(jeu, "JAP")).toBe("JAP");
  });

  it("ouvre sur PAL sans marché choisi", () => {
    expect(regionParDefaut(jeu, "TOUS")).toBe("PAL");
  });

  it("se rabat sur la version affichée dans le catalogue si le jeu n'est pas sorti sur ce marché", () => {
    expect(regionParDefaut(jeu, "US")).toBe("PAL");
  });
});
