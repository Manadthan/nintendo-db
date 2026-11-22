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
