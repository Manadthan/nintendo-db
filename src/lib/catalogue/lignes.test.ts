import { describe, expect, it } from "vitest";
import { versJeuCatalogue, type LigneJeu } from "./lignes";

const ID = "20000000-0000-0000-0000-000000000001";
const BASE = "https://exemple.supabase.co";

const ligne: LigneJeu = {
  id: ID,
  slug: "wii-karaoke-u",
  developpeur: "Xing",
  releases: [
    {
      region: "PAL",
      sortie: true,
      titre: "Wii Karaoke U",
      titre_romanise: null,
      date_sortie: "2013-10-04",
      precision_date: "jour",
      editeur: "Nintendo",
      jaquette_path: `${ID}/pal`,
    },
    {
      region: "US",
      sortie: false,
      titre: null,
      titre_romanise: null,
      date_sortie: null,
      precision_date: null,
      editeur: null,
      jaquette_path: null,
    },
  ],
};

describe("versJeuCatalogue", () => {
  const jeu = versJeuCatalogue(ligne, BASE);

  it("range les sorties par région et reprend l'éditeur connu", () => {
    expect(jeu.sorties.PAL).toMatchObject({
      sortie: true,
      titre: "Wii Karaoke U",
      date: "2013-10-04",
    });
    expect(jeu.sorties.US.sortie).toBe(false);
    expect(jeu.editeur).toBe("Nintendo");
  });

  it("compte une région absente de la base comme non sortie", () => {
    expect(jeu.sorties.JAP).toMatchObject({
      sortie: false,
      titre: null,
      date: null,
    });
  });

  it("donne les adresses des jaquettes seulement quand il y en a une (sinon vignette neutre)", () => {
    expect(jeu.sorties.PAL.jaquetteSrcset).toContain(
      `/jaquettes/${ID}/pal-600.webp 600w`,
    );
    expect(jeu.sorties.US.jaquetteSrcset).toBeNull();
  });
});
