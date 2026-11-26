import {
  versAmiiboDuJeu,
  type AmiiboDuJeu,
  type LigneAmiiboDuJeu,
} from "@/lib/amiibo/fiche";
import { type Couverture, choisirCouverture } from "@/lib/guides/couverture";
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
  screenscraper: "ScreenScraper",
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
  /** Captures RAWG (US-26), dans l'ordre, 6 au plus ; vides si le jeu n'a pas été reconnu. */
  captures: CaptureFiche[];
  /** Slug du jeu chez RAWG, pour le lien « Captures : RAWG ». */
  rawgSlug: string | null;
  /** Guides japonais du jeu (US-27, bloc « Guides (N) »), du plus ancien au plus récent ; vide sans guide. */
  guides: GuideFiche[];
  /** Amiibo que le jeu lit (US-29, bloc « Amiibo (N) »), du plus ancien au plus récent ; vide sans amiibo. */
  amiibo: AmiiboDuJeu[];
};

export type GuideFiche = {
  isbn: string;
  titre: string;
  editeur: string | null;
  annee: string | null;
  couverture: Couverture | null;
};

export type CaptureFiche = {
  url: string;
  largeur: number | null;
  hauteur: number | null;
};

/** Une ligne de `games` avec sa console et ses `releases`, telle que la renvoie la requête de la fiche. */
export type LigneFiche = Omit<LigneJeu, "releases"> & {
  genre: string | null;
  wikipedia_url: string | null;
  metacritic_url: string | null;
  rawg_slug?: string | null;
  captures?:
    | {
        position: number;
        url: string;
        largeur: number | null;
        hauteur: number | null;
      }[]
    | null;
  guides_jeux?:
    | {
        guides: {
          isbn: string;
          titre: string;
          editeur: string | null;
          date_parution: string | null;
          couverture: string | null;
          google_books_id: string | null;
        } | null;
      }[]
    | null;
  amiibo_jeux?: LigneAmiiboDuJeu[] | null;
  consoles: { slug: string; nom: string };
  releases: (LigneJeu["releases"][number] & {
    code_produit: string | null;
    jaquette_source: SourceJaquette | null;
  })[];
};

export function versJeuFiche(ligne: LigneFiche): JeuFiche {
  const jeu = versJeuCatalogue(ligne);
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
    captures: [...(ligne.captures ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(({ url, largeur, hauteur }) => ({ url, largeur, hauteur })),
    rawgSlug: ligne.rawg_slug ?? null,
    guides: (ligne.guides_jeux ?? [])
      .flatMap(({ guides: g }) => (g ? [g] : []))
      .sort(
        (a, b) =>
          (a.date_parution ?? "9999").localeCompare(
            b.date_parution ?? "9999",
          ) || a.titre.localeCompare(b.titre, "ja"),
      )
      .map((g) => ({
        isbn: g.isbn,
        titre: g.titre,
        editeur: g.editeur,
        annee: g.date_parution?.slice(0, 4) ?? null,
        couverture: choisirCouverture(g.couverture, g.google_books_id),
      })),
    amiibo: versAmiiboDuJeu(ligne.amiibo_jeux ?? []),
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
