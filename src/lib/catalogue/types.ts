import type { Couverture } from "@/lib/guides/couverture";
import type { Database } from "@/types/database";

export type Region = Database["public"]["Enums"]["region"];
export type PrecisionDate = Database["public"]["Enums"]["precision_date"];

/** Ordre d'affichage des régions partout sur le site. */
export const REGIONS: readonly Region[] = ["JAP", "US", "PAL"];

/** Marché choisi dans le catalogue (US-03) : une région, ou « Tous ». */
export type Marche = Region | "TOUS";

/** Tri du catalogue (US-02). */
/** « note » : note Metacritic, de la meilleure à la moins bonne (US-17, SPEC v1.21). */
export type Tri = "anciens" | "recents" | "az" | "note";

/** Une sortie, telle que le catalogue l'affiche (données sérialisables, envoyées au navigateur). */
export type SortieCatalogue = {
  sortie: boolean;
  titre: string | null;
  titreRomanise: string | null;
  date: string | null; // AAAA-MM-JJ
  precision: PrecisionDate | null;
  /**
   * Base du chemin de la jaquette (`{game_id}/{région}-{version}`, ADR-04) ; null : vignette neutre (US-12). Les
   * adresses des 3 tailles sont construites à l'affichage (srcsetJaquette) : envoyer ici les 3 adresses complètes de
   * chaque version doublait presque les données de l'accueil (audit de performance du 22/11/2026).
   */
  jaquette: string | null;
};

export type JeuCatalogue = {
  id: string;
  slug: string;
  /** Console du jeu (étape 8 : un seul catalogue pour toutes les consoles). */
  console: { slug: string; nom: string };
  developpeur: string | null;
  editeur: string | null;
  /** Genres (US-06), traduits à l'import ; vide si inconnus. */
  genres: string[];
  /** Séries (US-06, SPEC v1.37), triées ; vide si le jeu n'en a pas. */
  series: string[];
  /** Note Metacritic (US-17), 0 à 100 ; null si inconnue. */
  metacritic: number | null;
  sorties: Record<Region, SortieCatalogue>;
};

/** Un jeu dans la version affichée pour le marché choisi. */
export type VersionAffichee = {
  jeu: JeuCatalogue;
  region: Region;
  sortie: SortieCatalogue;
  /**
   * Présent pour la carte d'un guide japonais (US-27) : `sortie` porte alors son titre et sa date (tris, groupes,
   * frise, filtre Année) et `jeu` le premier jeu couvert (filtres Console, Genre, Développeur, Série).
   */
  guide?: GuideCarte;
};

/** Ce que la carte d'un guide affiche en plus (US-27). */
export type GuideCarte = {
  isbn: string;
  editeur: string | null;
  /** Copie Amazon ou Google Books (ADR-19 point 2) ; null : vignette neutre. */
  couverture: Couverture | null;
};

export type Groupe = { titre: string | null; versions: VersionAffichee[] };
