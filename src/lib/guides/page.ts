// Page d'un guide japonais (US-27, ADR-19 point 5) : données affichées, métadonnées, données structurées schema.org
// `Book`. Module pur (testé sans base) ; la lecture est dans charger.ts.
import type { Metadata } from "next";
import { formaterDate, versionAffichee } from "@/lib/catalogue/catalogue";
import { versJeuCatalogue, type LigneJeu } from "@/lib/catalogue/lignes";
import type { PrecisionDate, SortieCatalogue } from "@/lib/catalogue/types";
import {
  cheminFiche,
  NOM_SITE,
  OPEN_GRAPH_DE_BASE,
  URL_SITE,
} from "@/lib/referencement/referencement";
import {
  type Couverture,
  adresseCouvertureGuide,
  choisirCouverture,
} from "./couverture";

/** Adresse stable de la page d'un guide. */
export const cheminGuide = (isbn: string) => `/guides/${isbn}`;

/** Un ISBN à 13 chiffres, seul format accepté dans l'adresse (comme la base, migration 0031). */
export const estIsbn13 = (texte: string) => /^97[89]\d{10}$/.test(texte);

/** Un jeu couvert par le guide, tel que la page le montre : vignette, titre, console, année, lien vers la fiche. */
export type JeuCouvert = {
  slug: string;
  console: { slug: string; nom: string };
  titre: string;
  annee: string | null;
  sortie: SortieCatalogue;
};

export type GuidePage = {
  id: string;
  isbn: string;
  titre: string;
  editeur: string | null;
  date: string | null;
  precision: PrecisionDate | null;
  pages: number | null;
  /** Copie Amazon ou Google Books (ADR-19 point 2) ; null : vignette neutre. */
  couverture: Couverture | null;
  /** Lien « Google Books › » quand Google Books connaît le livre. */
  googleBooksId: string | null;
  ndlUrl: string | null;
  jeux: JeuCouvert[];
};

/** Une ligne de `guides` avec ses jeux, telle que la renvoie la requête de la page. */
export type LigneGuide = {
  id: string;
  isbn: string;
  titre: string;
  editeur: string | null;
  date_parution: string | null;
  precision_date: PrecisionDate | null;
  pages: number | null;
  couverture: string | null;
  google_books_id: string | null;
  ndl_url: string | null;
  guides_jeux: { games: LigneJeu | null }[];
};

export function versGuidePage(ligne: LigneGuide): GuidePage {
  const jeux = ligne.guides_jeux
    .flatMap(({ games }) => (games ? [versJeuCatalogue(games)] : []))
    .map((jeu): JeuCouvert | null => {
      // Le titre de la carte du catalogue avec « Tous » (PAL, sinon US, sinon JAP).
      const version = versionAffichee(jeu, "TOUS");
      if (!version) return null;
      return {
        slug: jeu.slug,
        console: jeu.console,
        titre: version.sortie.titre ?? jeu.slug,
        annee: version.sortie.date?.slice(0, 4) ?? null,
        sortie: version.sortie,
      };
    })
    .filter((j): j is JeuCouvert => j !== null)
    .sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
  return {
    id: ligne.id,
    isbn: ligne.isbn,
    titre: ligne.titre,
    editeur: ligne.editeur,
    date: ligne.date_parution,
    precision: ligne.precision_date,
    pages: ligne.pages,
    couverture: choisirCouverture(ligne.couverture, ligne.google_books_id),
    googleBooksId: ligne.google_books_id,
    ndlUrl: ligne.ndl_url,
    jeux,
  };
}

/** « Paru en novembre 2023 » ; « Date de parution inconnue » sans date. */
export function libelleParution(guide: GuidePage): string {
  if (!guide.date) return "Date de parution inconnue";
  const date = formaterDate(guide.date, guide.precision);
  return guide.precision === "jour" ? `Paru le ${date}` : `Paru en ${date}`;
}

/** Consoles des jeux couverts, sans doublon (étiquettes de la page). */
export const consolesDuGuide = (guide: GuidePage) => [
  ...new Map(guide.jeux.map((j) => [j.console.slug, j.console])).values(),
];

/** Métadonnées de la page : titre, description, adresse canonique, aperçu de partage avec la couverture. */
export function metadonneesGuide(guide: GuidePage): Metadata {
  const jeux = guide.jeux.map((j) => `${j.titre} (${j.console.nom})`);
  const description = `Guide japonais${jeux.length ? ` de ${jeux.join(", ")}` : ""}${guide.editeur ? `, ${guide.editeur}` : ""} : ISBN ${guide.isbn}, parution, pages, où l'acheter.`;
  const chemin = cheminGuide(guide.isbn);
  return {
    title: `${guide.titre} · Guide · ${NOM_SITE}`,
    description,
    alternates: { canonical: chemin },
    openGraph: {
      ...OPEN_GRAPH_DE_BASE,
      title: guide.titre,
      description,
      url: chemin,
      ...(guide.couverture && {
        images: [
          {
            url: adresseCouvertureGuide(guide.couverture),
            alt: `Couverture de ${guide.titre}`,
          },
        ],
      }),
    },
  };
}

/** Données structurées schema.org `Book` : ISBN, éditeur, date (imprécise si NDL ne donne que le mois), jeux. */
export function donneesGuide(guide: GuidePage): Record<string, unknown> {
  const date = !guide.date
    ? null
    : guide.precision === "annee"
      ? guide.date.slice(0, 4)
      : guide.precision === "mois"
        ? guide.date.slice(0, 7)
        : guide.date;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: guide.titre,
    isbn: guide.isbn,
    inLanguage: "ja",
    url: `${URL_SITE}${cheminGuide(guide.isbn)}`,
    ...(guide.editeur && {
      publisher: { "@type": "Organization", name: guide.editeur },
    }),
    ...(date && { datePublished: date }),
    ...(guide.pages && { numberOfPages: guide.pages }),
    ...(guide.couverture && {
      image: adresseCouvertureGuide(guide.couverture),
    }),
    ...(guide.jeux.length && {
      about: guide.jeux.map((j) => ({
        "@type": "VideoGame",
        name: j.titre,
        gamePlatform: j.console.nom,
        url: `${URL_SITE}${cheminFiche(j.console.slug, j.slug)}`,
      })),
    }),
  };
}
