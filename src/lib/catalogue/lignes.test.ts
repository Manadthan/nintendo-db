import { describe, expect, it } from "vitest";
import { versJeuCatalogue, type LigneJeu } from "./lignes";

const ID = "20000000-0000-0000-0000-000000000001";
const BASE = "https://exemple.supabase.co";

const ligne: LigneJeu = {
  id: ID,
  slug: "wii-karaoke-u",
  consoles: { slug: "wii-u", nom: "Wii U" },
  developpeur: "Xing",
  genre: "Musique, Karaoké, Démo",
  metacritic_note: 62,
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

  it("découpe les genres écrits par l'import (US-06), vide s'ils sont inconnus", () => {
    expect(jeu.genres).toEqual(["Musique", "Karaoké", "Démo"]);
    expect(versJeuCatalogue({ ...ligne, genre: null }, BASE).genres).toEqual(
      [],
    );
  });

  it("compte une région absente de la base comme non sortie", () => {
    expect(jeu.sorties.JAP).toMatchObject({
      sortie: false,
      titre: null,
      date: null,
    });
  });

  it("suit le chemin versionné de la jaquette : une jaquette remplacée change d'adresse (#60)", () => {
    const remplacee = versJeuCatalogue(
      {
        ...ligne,
        releases: [
          { ...ligne.releases[0]!, jaquette_path: `${ID}/pal-mi3x9k` },
        ],
      },
      BASE,
    );
    expect(remplacee.sorties.PAL.jaquetteSrcset).toContain(
      `/jaquettes/${ID}/pal-mi3x9k-600.webp 600w`,
    );
  });

  it("donne les adresses des jaquettes seulement quand il y en a une (sinon vignette neutre)", () => {
    expect(jeu.sorties.PAL.jaquetteSrcset).toContain(
      `/jaquettes/${ID}/pal-600.webp 600w`,
    );
    expect(jeu.sorties.US.jaquetteSrcset).toBeNull();
  });
});

describe("note Metacritic (US-17)", () => {
  it("passe telle quelle au catalogue, ou null si inconnue", () => {
    expect(versJeuCatalogue(ligne, BASE).metacritic).toBe(62);
    expect(
      versJeuCatalogue({ ...ligne, metacritic_note: null }, BASE).metacritic,
    ).toBeNull();
  });
});
