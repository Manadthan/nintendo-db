import { srcsetJaquette } from "@/lib/jaquettes/stockage";
import {
  REGIONS,
  type JeuCatalogue,
  type PrecisionDate,
  type Region,
  type SortieCatalogue,
} from "./types";

/** Une ligne de `games` avec ses `releases`, telle que la renvoie la requête du catalogue. */
export type LigneJeu = {
  id: string;
  slug: string;
  developpeur: string | null;
  genre: string | null;
  metacritic_note: number | null;
  consoles: { slug: string; nom: string };
  releases: {
    region: Region;
    sortie: boolean;
    titre: string | null;
    titre_romanise: string | null;
    date_sortie: string | null;
    precision_date: PrecisionDate | null;
    editeur: string | null;
    jaquette_path: string | null;
  }[];
};

const NON_SORTI: SortieCatalogue = {
  sortie: false,
  titre: null,
  titreRomanise: null,
  date: null,
  precision: null,
  jaquetteSrcset: null,
};

/**
 * Convertit les lignes de la base en données du catalogue.
 * Une région absente compte comme « non sortie » ; l'éditeur affiché est le premier connu.
 */
export function versJeuCatalogue(
  ligne: LigneJeu,
  baseUrl: string,
): JeuCatalogue {
  const parRegion = new Map(ligne.releases.map((r) => [r.region, r]));
  const sorties = Object.fromEntries(
    REGIONS.map((region) => {
      const r = parRegion.get(region);
      if (!r) return [region, NON_SORTI];
      const sortie: SortieCatalogue = {
        sortie: r.sortie,
        titre: r.titre,
        titreRomanise: r.titre_romanise,
        date: r.date_sortie,
        precision: r.precision_date,
        jaquetteSrcset: r.jaquette_path
          ? srcsetJaquette(r.jaquette_path, baseUrl)
          : null,
      };
      return [region, sortie];
    }),
  ) as Record<Region, SortieCatalogue>;

  return {
    id: ligne.id,
    slug: ligne.slug,
    console: { slug: ligne.consoles.slug, nom: ligne.consoles.nom },
    developpeur: ligne.developpeur,
    editeur: ligne.releases.find((r) => r.editeur)?.editeur ?? null,
    // Écrits par l'import séparés par « , » (DESIGN ADR-03).
    genres: (ligne.genre ?? "")
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean),
    metacritic: ligne.metacritic_note,
    sorties,
  };
}
