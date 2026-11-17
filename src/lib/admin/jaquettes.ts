import { REGIONS, type Region } from "@/lib/catalogue/types";
import { srcsetJaquette } from "@/lib/jaquettes/stockage";
import type { Database } from "@/types/database";

type Source = Database["public"]["Enums"]["jaquette_source"];

/** Une sortie telle que la page « Jaquettes » la lit (US-12). */
export type LigneSortie = {
  region: Region;
  sortie: boolean;
  titre: string | null;
  jaquette_path: string | null;
  jaquette_source: Source | null;
};

export type LigneJeuJaquettes = { slug: string; releases: LigneSortie[] };

/** Une vignette de la page « Jaquettes » : une sortie, sa jaquette et sa source. */
export type VignetteJaquette = {
  slug: string;
  region: Region;
  titre: string;
  srcset: string | null;
  source: Source | null;
  aRemplacer: boolean;
};

export type Filtre = "a-remplacer" | "toutes";

/**
 * Jaquette à remplacer : pas de jaquette, ou une ancienne image IGDB qui n'est pas un scan de boîte (R6).
 * Un scan GameTDB, une photo ou une image ajoutée à la main sont gardés.
 */
export function aRemplacer(
  path: string | null,
  source: Source | null,
): boolean {
  return !path || source === "igdb";
}

/**
 * Vignettes de la page « Jaquettes » (US-12) : une par sortie publiée, triées par titre puis région ; avec le
 * filtre « à remplacer », seulement celles qui ne sont pas des scans de boîte ni des ajouts à la main.
 */
export function vignettesJaquettes(
  jeux: LigneJeuJaquettes[],
  filtre: Filtre,
  baseUrl: string,
): VignetteJaquette[] {
  return jeux
    .flatMap((jeu) =>
      jeu.releases
        .filter((r) => r.sortie && r.titre)
        .map((r) => ({
          slug: jeu.slug,
          region: r.region,
          titre: r.titre!,
          srcset: r.jaquette_path
            ? srcsetJaquette(r.jaquette_path, baseUrl)
            : null,
          source: r.jaquette_path ? r.jaquette_source : null,
          aRemplacer: aRemplacer(r.jaquette_path, r.jaquette_source),
        })),
    )
    .filter((v) => filtre === "toutes" || v.aRemplacer)
    .sort(
      (a, b) =>
        a.titre.localeCompare(b.titre, "fr") ||
        REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region),
    );
}

/** Région lue dans l'adresse (`/admin/jaquettes/{jeu}/pal`) ; null si inconnue. */
export function regionDepuisAdresse(texte: string): Region | null {
  const r = texte.toUpperCase();
  return REGIONS.includes(r as Region) ? (r as Region) : null;
}
