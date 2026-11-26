// Amiibo dans le catalogue (US-29, ADR-21 point 5) : ce que la route /amiibo.json envoie au navigateur, et la carte
// de chaque amiibo mêlée aux jeux (marché, recherche, filtres, tris). Module pur, testé sans base.
import { versionAffichee } from "@/lib/catalogue/catalogue";
import {
  REGIONS,
  type JeuCatalogue,
  type Marche,
  type PrecisionDate,
  type Region,
  type SortieCatalogue,
  type VersionAffichee,
} from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";
import { seriesDuTitre } from "@/lib/series/series";
import { baseImageValide, type TypeAmiibo } from "./fiche";

/** Une sortie d'amiibo ; une région absente : pas sorti. */
export type SortieAmiiboCatalogue = {
  date: string | null;
  precision: PrecisionDate | null;
};

/** Un amiibo tel que /amiibo.json l'envoie : le strict nécessaire à sa carte, à la recherche et aux filtres. */
export type AmiiboCatalogue = {
  slug: string;
  nom: string;
  nomJap: string | null;
  type: TypeAmiibo;
  serieAmiibo: string | null;
  /** Séries de jeux, aux noms de nos jeux quand ils existent (filtre Série). */
  series: string[];
  /** Base du chemin de la photo ; null : vignette neutre. */
  image: string | null;
  sorties: Partial<Record<Region, SortieAmiiboCatalogue>>;
  /** Consoles des jeux du catalogue qui le lisent, sans doublon, triées. */
  consoles: string[];
};

/** Une ligne de `amiibo`, telle que la renvoie la requête de la route. */
export type LigneAmiiboCatalogue = {
  slug: string;
  nom: string;
  nom_jap: string | null;
  type: TypeAmiibo;
  serie_amiibo: string | null;
  serie_jeux: string | null;
  image_path: string | null;
  amiibo_sorties: {
    region: Region;
    date_sortie: string | null;
    precision_date: PrecisionDate | null;
  }[];
  amiibo_jeux: { games: { consoles: { slug: string } | null } | null }[];
};

/**
 * Séries de jeux d'un amiibo (choix du propriétaire du 26/11) : celles de nos jeux reconnues dans sa série de jeux et
 * sa série amiibo, comme pour un titre (« Super Mario » → Mario, « Pokemon » → Pokémon, « Super Smash Bros. ») ; une
 * série de jeux que nos jeux n'ont pas garde son nom (Street Fighter, Monster Hunter) et devient un choix du filtre.
 */
export function seriesAmiibo(
  serieJeux: string | null,
  serieAmiibo: string | null,
): string[] {
  const reconnues = seriesDuTitre([serieJeux, serieAmiibo]);
  const propre =
    serieJeux?.trim() && seriesDuTitre([serieJeux]).length === 0
      ? [serieJeux.trim()]
      : [];
  return [...new Set([...reconnues, ...propre])].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

/** Amiibo du catalogue, triés par slug (réponse stable). */
export function versAmiiboCatalogue(
  lignes: readonly LigneAmiiboCatalogue[],
): AmiiboCatalogue[] {
  return lignes
    .map((l) => ({
      slug: l.slug,
      nom: l.nom,
      nomJap: l.nom_jap,
      type: l.type,
      serieAmiibo: l.serie_amiibo,
      series: seriesAmiibo(l.serie_jeux, l.serie_amiibo),
      image: baseImageValide(l.image_path),
      sorties: Object.fromEntries(
        l.amiibo_sorties.map((s) => [
          s.region,
          { date: s.date_sortie, precision: s.precision_date },
        ]),
      ),
      consoles: [
        ...new Set(
          l.amiibo_jeux.flatMap((j) =>
            j.games?.consoles ? [j.games.consoles.slug] : [],
          ),
        ),
      ].sort(),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Console « Amiibo » de la carte (jamais une vraie console : le filtre Console lit `amiibo.consoles`). */
export const CONSOLE_AMIIBO = { slug: "amiibo", nom: "Amiibo" } as const;

/** L'amiibo mis à la forme d'un jeu : ses sorties portent son nom, sans jaquette ; ni genre, ni studio, ni note. */
function versJeu(a: AmiiboCatalogue): JeuCatalogue {
  const sorties = Object.fromEntries(
    REGIONS.map((r): [Region, SortieCatalogue] => {
      const s = a.sorties[r];
      return [
        r,
        {
          sortie: !!s,
          titre: s ? a.nom : null,
          titreRomanise: null,
          date: s?.date ?? null,
          precision: s?.precision ?? null,
          jaquette: null,
        },
      ];
    }),
  ) as Record<Region, SortieCatalogue>;
  return {
    id: `amiibo:${a.slug}`,
    slug: a.slug,
    console: CONSOLE_AMIIBO,
    developpeur: null,
    editeur: null,
    genres: [],
    series: a.series,
    metacritic: null,
    sorties,
  };
}

/**
 * Cartes des amiibo sortis sur le marché choisi (comme un jeu, US-03 : « Tous » montre la date PAL, sinon US, sinon
 * JAP) ; un amiibo non sorti sur ce marché est caché. Leur identifiant commence par « amiibo: » (jamais une possession
 * de jeu).
 */
export function versionsAmiibo(
  amiibo: readonly AmiiboCatalogue[],
  marche: Marche,
): VersionAffichee[] {
  return amiibo.flatMap((a) => {
    const version = versionAffichee(versJeu(a), marche);
    if (!version) return [];
    return [
      {
        ...version,
        amiibo: {
          slug: a.slug,
          type: a.type,
          serieAmiibo: a.serieAmiibo,
          image: a.image,
          consoles: a.consoles,
        },
      },
    ];
  });
}

/** Texte cherché d'un amiibo (US-29) : son nom, son nom japonais, sa série amiibo et ses séries de jeux. */
export function texteRechercheAmiibo(a: AmiiboCatalogue): string {
  return normaliser(
    [a.nom, a.nomJap, a.serieAmiibo, ...a.series].filter(Boolean).join(" "),
  );
}
