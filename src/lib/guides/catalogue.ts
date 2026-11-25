// Guides japonais dans le catalogue (US-27, ADR-19 point 4) : ce que la route /guides.json envoie au navigateur,
// et le lien de chaque guide avec les jeux du catalogue déjà chargés (console, genres, studios, séries, titres).
// Module pur, testé sans base.
import { texteRecherche } from "@/lib/catalogue/recherche";
import type {
  JeuCatalogue,
  PrecisionDate,
  VersionAffichee,
} from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";

/** Un guide tel que /guides.json l'envoie : le strict nécessaire à sa carte, les jeux par leur identifiant. */
export type GuideCatalogue = {
  isbn: string;
  titre: string;
  editeur: string | null;
  date: string | null;
  precision: PrecisionDate | null;
  /** Identifiant Google Books de la couverture ; null : vignette neutre. */
  couverture: string | null;
  /** Identifiants des jeux couverts (`games.id`). */
  jeux: string[];
};

/** Une ligne de `guides` avec ses liens, telle que la renvoie la requête de la route. */
export type LigneGuideCatalogue = {
  isbn: string;
  titre: string;
  editeur: string | null;
  date_parution: string | null;
  precision_date: PrecisionDate | null;
  google_books_id: string | null;
  guides_jeux: { game_id: string }[];
};

/** Guides du catalogue, triés par ISBN (réponse stable) ; un guide qui ne couvre aucun jeu n'est pas envoyé. */
export function versGuidesCatalogue(
  lignes: readonly LigneGuideCatalogue[],
): GuideCatalogue[] {
  return lignes
    .filter((l) => l.guides_jeux.length > 0)
    .map((l) => ({
      isbn: l.isbn,
      titre: l.titre,
      editeur: l.editeur,
      date: l.date_parution,
      precision: l.precision_date,
      couverture: l.google_books_id,
      jeux: [...new Set(l.guides_jeux.map((j) => j.game_id))].sort(),
    }))
    .sort((a, b) => a.isbn.localeCompare(b.isbn));
}

/** Un guide relié aux jeux du catalogue qu'il couvre (recherche, filtres et console de sa carte). */
export type GuideRelie = Omit<GuideCatalogue, "jeux"> & {
  jeux: JeuCatalogue[];
};

/** Relie chaque guide aux jeux chargés ; un guide dont aucun jeu n'est dans le catalogue est écarté. */
export function relierGuides(
  guides: readonly GuideCatalogue[],
  jeux: readonly JeuCatalogue[],
): GuideRelie[] {
  const parId = new Map(jeux.map((j) => [j.id, j]));
  return guides.flatMap((g) => {
    const couverts = g.jeux.flatMap((id) => {
      const jeu = parId.get(id);
      return jeu ? [jeu] : [];
    });
    return couverts.length ? [{ ...g, jeux: couverts }] : [];
  });
}

/**
 * Cartes des guides, mêlées aux jeux du catalogue : la « sortie » porte le titre et la date du guide (tris, groupes,
 * frise, filtre Année), le « jeu » est le premier jeu couvert, sans note (filtres Console, Genre, Développeur, Série ;
 * tri par note : en fin). Son identifiant commence par « guide: » (jamais une possession).
 */
export function versionsGuides(guides: readonly GuideRelie[]): VersionAffichee[] {
  return guides.flatMap((g) => {
    const [premier] = g.jeux;
    if (!premier) return [];
    return [
      {
        jeu: { ...premier, id: `guide:${g.isbn}`, metacritic: null },
        region: "JAP" as const,
        sortie: {
          sortie: true,
          titre: g.titre,
          titreRomanise: null,
          date: g.date,
          precision: g.precision,
          jaquette: null,
        },
        guide: { isbn: g.isbn, editeur: g.editeur, couverture: g.couverture },
      },
    ];
  });
}

/** Texte cherché d'un guide (US-27) : son titre, son éditeur et les titres des jeux qu'il couvre. */
export function texteRechercheGuide(guide: GuideRelie): string {
  return [
    normaliser([guide.titre, guide.editeur].filter(Boolean).join(" ")),
    ...guide.jeux.map(texteRecherche),
  ].join(" ");
}
