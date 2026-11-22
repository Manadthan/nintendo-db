import type { Metadata, MetadataRoute } from "next";
import { REGIONS } from "@/lib/catalogue/types";
import { versionAffichee } from "@/lib/catalogue/catalogue";
import type { JeuFiche } from "@/lib/fiche/fiche";
import { srcsetJaquette } from "@/lib/jaquettes/stockage";

/** Adresse du site en production : adresses canoniques, sitemap, aperçus de partage (référencement, étape 7). */
export const URL_SITE = "https://nintendo-db.vercel.app";
export const NOM_SITE = "Nintendo DB";

/** Adresse stable d'une fiche (ADR-06). */
export const cheminFiche = (consoleSlug: string, jeuSlug: string) =>
  `/jeux/${consoleSlug}/${jeuSlug}`;

/** Aperçu de partage commun à toutes les pages (Next.js remplace l'objet `openGraph` du layout, sans le fusionner). */
export const OPEN_GRAPH_DE_BASE = {
  siteName: NOM_SITE,
  locale: "fr_FR",
  type: "website",
} as const;

/** Plan du site : accueil, À propos, puis chaque fiche. */
export function entreesSitemap(
  fiches: { console: string; jeu: string }[],
): MetadataRoute.Sitemap {
  return [
    { url: `${URL_SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${URL_SITE}/a-propos`, changeFrequency: "yearly", priority: 0.3 },
    ...fiches.map((f) => ({
      url: `${URL_SITE}${cheminFiche(f.console, f.jeu)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

/** Robots : tout le site public est indexable ; l'administration ne l'est pas. */
export function reglesRobots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}

/** Les 3 adresses d'une jaquette, ou null sans jaquette. */
const srcsetDe = (base: string | null | undefined) =>
  base ? srcsetJaquette(base) : null;

/** Adresse d'une taille précise dans un `srcset` (« … 600w ») ; null si absente. */
export function imageDuSrcset(
  srcset: string | null,
  largeur: number,
): string | null {
  const entree = srcset
    ?.split(",")
    .map((e) => e.trim().split(/\s+/))
    .find(([, l]) => l === `${largeur}w`);
  return entree?.[0] ?? null;
}

/** Titre et version montrés aux moteurs : ceux du catalogue avec « Tous » (PAL, sinon US, sinon JAP). */
function versionDeReference(jeu: JeuFiche) {
  return versionAffichee(jeu, "TOUS");
}

/** Métadonnées d'une fiche : titre, description, adresse canonique, aperçu de partage avec la jaquette. */
export function metadonneesFiche(jeu: JeuFiche): Metadata {
  const version = versionDeReference(jeu);
  const titre = version?.sortie.titre ?? jeu.slug;
  const description = `${titre} sur ${jeu.console.nom} : jaquettes, titres et dates de sortie au Japon, en Amérique du Nord et en Europe.`;
  const chemin = cheminFiche(jeu.console.slug, jeu.slug);
  const image = imageDuSrcset(srcsetDe(version?.sortie.jaquette), 600);
  return {
    title: `${titre} · ${jeu.console.nom} · ${NOM_SITE}`,
    description,
    alternates: { canonical: chemin },
    openGraph: {
      ...OPEN_GRAPH_DE_BASE,
      title: `${titre} · ${jeu.console.nom}`,
      description,
      url: chemin,
      ...(image && {
        images: [{ url: image, alt: `Jaquette de ${titre}` }],
      }),
    },
  };
}

/**
 * Données structurées schema.org `VideoGame` d'une fiche, pour les moteurs de recherche : titres des 3 régions,
 * console, éditeur, première date de sortie, genres, jaquette.
 */
export function donneesStructurees(jeu: JeuFiche): Record<string, unknown> {
  const version = versionDeReference(jeu);
  const nom = version?.sortie.titre ?? jeu.slug;
  const autresTitres = [
    ...new Set(
      REGIONS.map((r) => jeu.sorties[r].titre).filter(
        (t): t is string => !!t && t !== nom,
      ),
    ),
  ];
  // Une date connue au mois ou à l'année seulement reste imprécise (« 2014-05 », « 2014 ») : rien d'inventé.
  const dates = REGIONS.map((r) => {
    const { date, precision } = jeu.sorties[r];
    if (!date) return null;
    return precision === "annee"
      ? date.slice(0, 4)
      : precision === "mois"
        ? date.slice(0, 7)
        : date;
  })
    .filter((d): d is string => !!d)
    .sort();
  const image = imageDuSrcset(srcsetDe(version?.sortie.jaquette), 768);
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: nom,
    ...(autresTitres.length && { alternateName: autresTitres }),
    url: `${URL_SITE}${cheminFiche(jeu.console.slug, jeu.slug)}`,
    gamePlatform: jeu.console.nom,
    ...(jeu.editeur && {
      publisher: { "@type": "Organization", name: jeu.editeur },
    }),
    ...(dates[0] && { datePublished: dates[0] }),
    ...(jeu.genres.length && { genre: jeu.genres }),
    ...(image && { image }),
  };
}

/** JSON à placer dans une balise <script> : « < » échappé, le contenu ne peut pas fermer la balise. */
export const jsonPourScript = (donnees: unknown) =>
  JSON.stringify(donnees).replace(/</g, "\\u003c");
