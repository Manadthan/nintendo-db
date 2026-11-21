import { versionAffichee } from "@/lib/catalogue/catalogue";
import { versJeuCatalogue, type LigneJeu } from "@/lib/catalogue/lignes";
import {
  REGIONS,
  type JeuCatalogue,
  type Marche,
  type Region,
  type SortieCatalogue,
} from "@/lib/catalogue/types";

/** Source affichée sous la jaquette (US-12) : « Jaquette : GameTDB ». */
export const SOURCES_JAQUETTE = {
  gametdb: "GameTDB",
  igdb: "IGDB",
  libretro: "libretro-thumbnails",
  gamecartdb: "gamecartdb",
  nintendo: "Nintendo",
  photo: "Photo",
  url: "Image ajoutée",
} as const;
export type SourceJaquette = keyof typeof SOURCES_JAQUETTE;

/** Une sortie telle que la fiche l'affiche : celle du catalogue, plus l'éditeur, le code produit et la source. */
export type SortieFiche = SortieCatalogue & {
  editeur: string | null;
  codeProduit: string | null;
  sourceJaquette: SourceJaquette | null;
};

/** Un jeu tel que la fiche l'affiche (US-04) ; utilisable partout où un jeu du catalogue l'est. */
export type JeuFiche = JeuCatalogue & {
  genre: string | null;
  wikipediaUrl: string | null;
  /** Page Metacritic du jeu (US-17), si connue. */
  metacriticUrl: string | null;
  console: { slug: string; nom: string };
  sorties: Record<Region, SortieFiche>;
};

/** Une ligne de `games` avec sa console et ses `releases`, telle que la renvoie la requête de la fiche. */
export type LigneFiche = Omit<LigneJeu, "releases"> & {
  genre: string | null;
  wikipedia_url: string | null;
  metacritic_url: string | null;
  consoles: { slug: string; nom: string };
  releases: (LigneJeu["releases"][number] & {
    code_produit: string | null;
    jaquette_source: SourceJaquette | null;
  })[];
};

export function versJeuFiche(ligne: LigneFiche, baseUrl: string): JeuFiche {
  const jeu = versJeuCatalogue(ligne, baseUrl);
  const parRegion = new Map(ligne.releases.map((r) => [r.region, r]));
  const sorties = Object.fromEntries(
    REGIONS.map((region) => {
      const r = parRegion.get(region);
      const sortie: SortieFiche = {
        ...jeu.sorties[region],
        editeur: r?.editeur ?? null,
        codeProduit: r?.code_produit ?? null,
        sourceJaquette: r?.jaquette_path ? r.jaquette_source : null,
      };
      return [region, sortie];
    }),
  ) as Record<Region, SortieFiche>;

  return {
    ...jeu,
    genre: ligne.genre,
    wikipediaUrl: ligne.wikipedia_url,
    metacriticUrl: ligne.metacritic_url,
    console: ligne.consoles,
    sorties,
  };
}

/**
 * Région ouverte à l'arrivée sur la fiche (US-04) : le marché choisi dans le catalogue si le jeu y est sorti,
 * sinon la version que le catalogue affiche avec « Tous » (PAL, puis US, puis JAP).
 */
export function regionParDefaut(jeu: JeuCatalogue, marche: Marche): Region {
  return (
    (versionAffichee(jeu, marche) ?? versionAffichee(jeu, "TOUS"))?.region ??
    "PAL"
  );
}
