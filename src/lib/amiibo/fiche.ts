// Fiche d'un amiibo (US-29, ADR-21 point 6) et bloc « Amiibo (N) » de la fiche du jeu : données affichées,
// adresses des images, région ouverte à l'arrivée, métadonnées et données structurées schema.org `Product`.
// Module pur (testé sans base) ; la lecture est dans charger.ts.
import type { Metadata } from "next";
import { sortieAVenir } from "@/lib/catalogue/a-venir";
import { formaterDate } from "@/lib/catalogue/catalogue";
import {
  REGIONS,
  type Marche,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";
import {
  cheminFiche,
  NOM_SITE,
  OPEN_GRAPH_DE_BASE,
  URL_SITE,
} from "@/lib/referencement/referencement";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type TypeAmiibo = Database["public"]["Enums"]["amiibo_type"];

/** Étiquette du type (US-29). */
export const LIBELLES_TYPE: Record<TypeAmiibo, string> = {
  figurine: "Figurine",
  carte: "Carte",
  peluche: "Peluche",
  bracelet: "Bracelet",
  bloc: "Bloc",
};

/** Source citée (liste, dates, jeux compatibles, images) : dépôt AmiiboAPI, licence MIT. */
export const SOURCE_AMIIBOAPI = "https://github.com/N3evin/AmiiboAPI";

/** Adresse stable de la fiche d'un amiibo. */
export const cheminAmiibo = (slug: string) => `/amiibo/${slug}`;

/** Un slug tel que la base l'accepte (migration 0033) : rien d'autre n'est cherché. */
export const estSlugAmiibo = (texte: string) =>
  texte.length <= 140 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(texte);

/** Bucket public des images d'amiibo (migration 0033). */
export const BUCKET_AMIIBO = "amiibo";
export const TAILLES_AMIIBO = [300, 600] as const;
export type TailleAmiibo = (typeof TAILLES_AMIIBO)[number];

// `{amiibo_id}/figurine-{version}` ou `{amiibo_id}/boite-{version}` (scripts/amiibo.mjs) : un chemin ne peut pas
// sortir du dossier d'un amiibo.
const BASE_IMAGE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(figurine|boite)-[a-z0-9]{1,16}$/;

/** Base d'une image telle que la base la garde (`{amiibo_id}/figurine-{version}`), ou null si elle a une autre forme. */
export const baseImageValide = (base: string | null): string | null =>
  base && BASE_IMAGE.test(base) ? base : null;

/**
 * Adresse publique d'une taille d'image (`{base}-{300|600}.webp`), construite à l'affichage comme les jaquettes
 * (audit de performance : pas d'adresses complètes dans les données envoyées au navigateur).
 */
export function urlImageAmiibo(
  base: string,
  taille: TailleAmiibo,
  baseUrl: string = supabaseEnv().url,
): string {
  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET_AMIIBO}/${base}-${taille}.webp`;
}

/** Attribut `srcset` : 300 et 600 px. */
export const srcsetAmiibo = (base: string, baseUrl?: string) =>
  TAILLES_AMIIBO.map((t) => `${urlImageAmiibo(base, t, baseUrl)} ${t}w`).join(
    ", ",
  );

export type SortieAmiibo = {
  sortie: boolean;
  date: string | null;
  precision: PrecisionDate | null;
};

/** Un jeu qui lit l'amiibo : lien vers sa fiche s'il est au catalogue, sinon le titre de la source seul. */
export type JeuCompatible = {
  titre: string;
  console: string;
  usage: string | null;
  fiche: string | null;
};

export type AmiiboFiche = {
  slug: string;
  identifiant: string;
  nom: string;
  nomJap: string | null;
  type: TypeAmiibo;
  serieAmiibo: string | null;
  serieJeux: string | null;
  personnage: string | null;
  editeur: string;
  /** Base du chemin de la photo de la figurine (bucket `amiibo`) ; null : vignette neutre. */
  image: string | null;
  /** Base du chemin de la photo de la boîte américaine ; null si Nintendo US ne la montre pas. */
  boite: string | null;
  sorties: Record<Region, SortieAmiibo>;
  jeux: JeuCompatible[];
};

/** Une ligne de `amiibo` avec ses sorties et ses jeux, telle que la renvoie la requête de la fiche. */
export type LigneAmiibo = {
  slug: string;
  identifiant: string;
  nom: string;
  nom_jap: string | null;
  type: TypeAmiibo;
  serie_amiibo: string | null;
  serie_jeux: string | null;
  personnage: string | null;
  editeur: string;
  image_path: string | null;
  boite_path: string | null;
  amiibo_sorties: {
    region: Region;
    date_sortie: string | null;
    precision_date: PrecisionDate | null;
  }[];
  amiibo_jeux: {
    titre_jeu: string;
    console: string;
    usage: string | null;
    games: { slug: string; consoles: { slug: string } | null } | null;
  }[];
};

export function versAmiiboFiche(ligne: LigneAmiibo): AmiiboFiche {
  const parRegion = new Map(ligne.amiibo_sorties.map((s) => [s.region, s]));
  const sorties = Object.fromEntries(
    REGIONS.map((r) => {
      const s = parRegion.get(r);
      return [
        r,
        {
          sortie: !!s,
          date: s?.date_sortie ?? null,
          precision: s?.precision_date ?? null,
        },
      ];
    }),
  ) as Record<Region, SortieAmiibo>;
  const jeux = ligne.amiibo_jeux
    .map((j): JeuCompatible => ({
      titre: j.titre_jeu,
      console: j.console,
      usage: j.usage,
      fiche: j.games?.consoles
        ? cheminFiche(j.games.consoles.slug, j.games.slug)
        : null,
    }))
    // Jeux du catalogue d'abord (ils mènent à leur fiche), puis les autres ; par titre dans chaque groupe.
    .sort(
      (a, b) =>
        Number(a.fiche === null) - Number(b.fiche === null) ||
        a.titre.localeCompare(b.titre, "en") ||
        a.console.localeCompare(b.console),
    );
  return {
    slug: ligne.slug,
    identifiant: ligne.identifiant,
    nom: ligne.nom,
    nomJap: ligne.nom_jap,
    type: ligne.type,
    serieAmiibo: ligne.serie_amiibo,
    serieJeux: ligne.serie_jeux,
    personnage: ligne.personnage,
    editeur: ligne.editeur,
    image: baseImageValide(ligne.image_path),
    boite: baseImageValide(ligne.boite_path),
    sorties,
    jeux,
  };
}

/**
 * Région ouverte à l'arrivée (comme la fiche du jeu, US-04) : le marché choisi si l'amiibo y est sorti, sinon la
 * première région sortie dans l'ordre PAL, US, JAP ; PAL s'il n'est sorti nulle part.
 */
export function regionAmiiboParDefaut(
  sorties: Record<Region, SortieAmiibo>,
  marche: Marche,
): Region {
  if (marche !== "TOUS" && sorties[marche].sortie) return marche;
  return (
    (["PAL", "US", "JAP"] as const).find((r) => sorties[r].sortie) ?? "PAL"
  );
}

/**
 * Ligne de date sous le nom : « Sorti le 5 juin 2025 », « Sorti en juin 2025 », « Sortie prévue : Printemps 2027 »
 * (US-32) ou « Non sorti dans cette région ». `aujourdhui` : jour de préparation de la page (AAAA-MM-JJ, Paris).
 */
export function libelleSortieAmiibo(
  sortie: SortieAmiibo,
  aujourdhui: string,
): string {
  if (!sortie.sortie) return "Non sorti dans cette région";
  if (sortie.precision === "inconnue") return "Date de sortie à venir";
  const date = formaterDate(sortie.date, sortie.precision);
  if (sortieAVenir(sortie.date, sortie.precision, aujourdhui))
    return `Sortie prévue : ${date}`;
  if (!sortie.date) return "Sorti, date inconnue";
  return sortie.precision === "jour" ? `Sorti le ${date}` : `Sorti en ${date}`;
}

/** « 010A0000 04A40902 » : l'identifiant AmiiboAPI lisible ; « us:… » / « eu:… » tel quel. */
export function identifiantLisible(identifiant: string): string {
  return /^[0-9a-f]{16}$/.test(identifiant)
    ? `${identifiant.slice(0, 8)} ${identifiant.slice(8)}`.toUpperCase()
    : identifiant;
}

/** Une date imprécise reste imprécise pour les moteurs (« 2014-05 », « 2014 ») : rien d'inventé. */
function dateIso(date: string, precision: PrecisionDate | null): string {
  return precision === "annee" || precision === "saison"
    ? date.slice(0, 4)
    : precision === "mois"
      ? date.slice(0, 7)
      : date;
}

/** Métadonnées : titre, description, adresse canonique, aperçu de partage avec la photo. */
export function metadonneesAmiibo(
  amiibo: AmiiboFiche,
  baseUrl?: string,
): Metadata {
  const type = LIBELLES_TYPE[amiibo.type].toLowerCase();
  const serie = amiibo.serieAmiibo ? `, série ${amiibo.serieAmiibo}` : "";
  const description = `Amiibo ${amiibo.nom} (${type}${serie}) : dates de sortie au Japon, en Amérique du Nord et en Europe, et ${amiibo.jeux.length} jeu${amiibo.jeux.length > 1 ? "x" : ""} compatible${amiibo.jeux.length > 1 ? "s" : ""}.`;
  const chemin = cheminAmiibo(amiibo.slug);
  return {
    title: `${amiibo.nom} · Amiibo · ${NOM_SITE}`,
    description,
    alternates: { canonical: chemin },
    openGraph: {
      ...OPEN_GRAPH_DE_BASE,
      title: `${amiibo.nom} · Amiibo`,
      description,
      url: chemin,
      ...(amiibo.image && {
        images: [
          {
            url: urlImageAmiibo(amiibo.image, 600, baseUrl),
            alt: `Amiibo ${amiibo.nom}`,
          },
        ],
      }),
    },
  };
}

/** Données structurées schema.org `Product` : marque, éditeur, première sortie, photo, jeux compatibles. */
export function donneesAmiibo(
  amiibo: AmiiboFiche,
  baseUrl?: string,
): Record<string, unknown> {
  const dates = REGIONS.flatMap((r) => {
    const { date, precision } = amiibo.sorties[r];
    return date ? [dateIso(date, precision)] : [];
  }).sort();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `amiibo ${amiibo.nom}`,
    url: `${URL_SITE}${cheminAmiibo(amiibo.slug)}`,
    brand: { "@type": "Brand", name: "amiibo" },
    manufacturer: { "@type": "Organization", name: amiibo.editeur },
    category: LIBELLES_TYPE[amiibo.type],
    ...(amiibo.serieAmiibo && { model: amiibo.serieAmiibo }),
    ...(dates[0] && { releaseDate: dates[0] }),
    ...(amiibo.image && { image: urlImageAmiibo(amiibo.image, 600, baseUrl) }),
    ...(amiibo.jeux.some((j) => j.fiche) && {
      isRelatedTo: amiibo.jeux
        .filter((j) => j.fiche)
        .map((j) => ({
          "@type": "VideoGame",
          name: j.titre,
          url: `${URL_SITE}${j.fiche}`,
        })),
    }),
  };
}

/** Un amiibo du bloc « Amiibo (N) » de la fiche du jeu : petite image, nom, lien vers sa fiche. */
export type AmiiboDuJeu = { slug: string; nom: string; image: string | null };

/** Lignes `amiibo_jeux` d'un jeu, avec leur amiibo, telles que les renvoie la requête de la fiche du jeu. */
export type LigneAmiiboDuJeu = {
  amiibo: {
    slug: string;
    nom: string;
    image_path: string | null;
    amiibo_sorties: { date_sortie: string | null }[];
  } | null;
};

/**
 * Amiibo lus par un jeu, sans doublon (un amiibo peut être relié au même jeu par deux lignes de la source), du plus
 * ancien au plus récent (première sortie, toutes régions), puis par nom ; un amiibo sans date va à la fin.
 */
export function versAmiiboDuJeu(
  lignes: readonly LigneAmiiboDuJeu[],
): AmiiboDuJeu[] {
  const parSlug = new Map<string, { a: AmiiboDuJeu; date: string }>();
  for (const { amiibo: a } of lignes) {
    if (!a || parSlug.has(a.slug)) continue;
    const date =
      a.amiibo_sorties
        .map((s) => s.date_sortie)
        .filter((d): d is string => !!d)
        .sort()[0] ?? "9999";
    parSlug.set(a.slug, {
      a: {
        slug: a.slug,
        nom: a.nom,
        image: baseImageValide(a.image_path),
      },
      date,
    });
  }
  return [...parSlug.values()]
    .sort(
      (x, y) =>
        x.date.localeCompare(y.date) || x.a.nom.localeCompare(y.a.nom, "en"),
    )
    .map(({ a }) => a);
}
