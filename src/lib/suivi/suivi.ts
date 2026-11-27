// Endpoint de suivi externe (contrat /api/suivi) : calcule les compteurs possédés / total, la 1re image disponible,
// le titre suggéré et l'adresse canonique à partir des mêmes paramètres URL que le catalogue. Module pur, testé sans base.
import { timingSafeEqual } from "node:crypto";
import {
  texteRechercheAmiibo,
  versionsAmiibo,
  type AmiiboCatalogue,
} from "@/lib/amiibo/catalogue";
import { LIBELLES_TYPE, urlImageAmiibo } from "@/lib/amiibo/fiche";
import { trier, trierVersions } from "@/lib/catalogue/catalogue";
import {
  DISPONIBILITES,
  filtrer,
  filtresDepuisParametres,
} from "@/lib/catalogue/filtres";
import { MARCHES, marcheDepuisTexte } from "@/lib/catalogue/marche";
import {
  contientMots,
  motsRecherche,
  texteRecherche,
} from "@/lib/catalogue/recherche";
import { triDepuisParametres } from "@/lib/catalogue/tri";
import type { JeuCatalogue, VersionAffichee } from "@/lib/catalogue/types";
import {
  voirDepuisParametres,
  voirEffectif,
  type Voir,
} from "@/lib/catalogue/voir";
import { affichePossedee } from "@/lib/collection/collection";
import {
  relierGuides,
  texteRechercheGuide,
  versionsGuides,
  type GuideCatalogue,
} from "@/lib/guides/catalogue";
import { adresseCouvertureGuide } from "@/lib/guides/couverture";
import { cheminJaquette, urlJaquette } from "@/lib/jaquettes/stockage";
import { NOM_SITE, URL_SITE } from "@/lib/referencement/referencement";

export type ReponseSuivi = {
  source: "nintendo-db";
  owned: number;
  total: number;
  coverUrl: string | null;
  suggestedTitle: string;
  url: string;
};

/** Vérifie l'en-tête `Authorization: Bearer <jeton>` en temps constant (`timingSafeEqual`). */
export function verifierJetonSuivi(
  autorisation: string | null,
  attendu: string | undefined,
): boolean {
  const secret = attendu?.trim();
  if (!secret || !autorisation) return false;
  const correspondance = /^Bearer\s+(.+)$/i.exec(autorisation.trim());
  if (!correspondance) return false;
  const recu = Buffer.from(correspondance[1]!.trim(), "utf8");
  const ref = Buffer.from(secret, "utf8");
  if (recu.length !== ref.length) return false;
  return timingSafeEqual(recu, ref);
}

function imageDeVersion(
  v: VersionAffichee,
  baseUrlSupabase: string,
): string | null {
  if (v.guide) {
    return v.guide.couverture
      ? adresseCouvertureGuide(v.guide.couverture, baseUrlSupabase)
      : null;
  }
  if (v.amiibo) {
    return v.amiibo.image
      ? urlImageAmiibo(v.amiibo.image, 300, baseUrlSupabase)
      : null;
  }
  if (!v.sortie.jaquette) return null;
  try {
    return urlJaquette(cheminJaquette(v.sortie.jaquette, 300), baseUrlSupabase);
  } catch {
    return null;
  }
}

function libelleVoir(voir: Voir): string | null {
  if (voir.jeux && !voir.guides && !voir.amiibo) return null;
  const parties = [
    voir.jeux && "Jeux",
    voir.guides && "Guides",
    voir.amiibo && "Amiibo",
  ].filter((p): p is string => !!p);
  if (parties.length <= 1) return parties[0] ?? null;
  return `${parties.slice(0, -1).join(", ")} & ${parties.at(-1)}`;
}

function urlCanonique(urlSite: string, search: string): string {
  const params = new URLSearchParams(search);
  params.delete("collection");
  const base = urlSite.replace(/\/+$/, "");
  const query = params.toString();
  return query ? `${base}/?${query}` : `${base}/`;
}

export type EntreeSuivi = {
  search: string;
  jeux: readonly JeuCatalogue[];
  consoles: readonly { slug: string; nom: string }[];
  guides?: readonly GuideCatalogue[];
  amiibo?: readonly AmiiboCatalogue[];
  possessions: ReadonlySet<string>;
  baseUrlSupabase: string;
  urlSite?: string;
};

/**
 * Calcule le résumé de suivi d'une vue filtrée du catalogue (possédés / total, 1re image, titre suggéré, URL sans
 * `?collection=`). Réutilise exactement les mêmes fonctions de tri, recherche et filtrage que le catalogue.
 */
export function calculerSuivi({
  search,
  jeux,
  consoles,
  guides = [],
  amiibo = [],
  possessions,
  baseUrlSupabase,
  urlSite = URL_SITE,
}: EntreeSuivi): ReponseSuivi {
  const params = new URLSearchParams(search);
  const marche = marcheDepuisTexte(params.get("marche")) ?? "TOUS";
  const voir = voirEffectif(voirDepuisParametres(search), marche);
  const tri = triDepuisParametres(search);
  const filtresBruts = filtresDepuisParametres(search);
  const filtres = {
    ...filtresBruts,
    collection: null,
    typeAmiibo: voir.amiibo ? filtresBruts.typeAmiibo : null,
  };
  const rechercheBrute = params.get("q")?.trim() ?? "";
  const mots = motsRecherche(rechercheBrute);

  const jeuxTrouves = voir.jeux
    ? mots.length === 0
      ? [...jeux]
      : jeux.filter((j) => contientMots(texteRecherche(j), mots))
    : [];
  const guidesRelies = voir.guides ? relierGuides(guides, jeux) : [];
  const guidesTrouves = voir.guides
    ? mots.length === 0
      ? guidesRelies
      : guidesRelies.filter((g) => contientMots(texteRechercheGuide(g), mots))
    : [];
  const amiiboTrouves = voir.amiibo
    ? mots.length === 0
      ? [...amiibo]
      : amiibo.filter((a) => contientMots(texteRechercheAmiibo(a), mots))
    : [];

  const versions = filtrer(
    trierVersions(
      [
        ...(voir.jeux ? trier(jeuxTrouves, tri, marche) : []),
        ...(voir.guides ? versionsGuides(guidesTrouves) : []),
        ...(voir.amiibo ? versionsAmiibo(amiiboTrouves, marche) : []),
      ],
      tri,
    ),
    filtres,
  );

  const total = versions.length;
  const owned = versions.filter((v) =>
    affichePossedee(possessions, v, marche),
  ).length;

  let coverUrl: string | null = null;
  for (const v of versions) {
    const img = imageDeVersion(v, baseUrlSupabase);
    if (img) {
      coverUrl = img;
      break;
    }
  }

  const nomConsole = filtres.console
    ? (consoles.find((c) => c.slug === filtres.console)?.nom ?? filtres.console)
    : null;
  const libelleMarche =
    marche === "TOUS"
      ? null
      : (MARCHES.find((m) => m.valeur === marche)?.libelle ?? marche);
  const libelleDispo = filtres.disponibilite
    ? (DISPONIBILITES.find((d) => d.valeur === filtres.disponibilite)
        ?.libelle ?? null)
    : null;
  const libelleTypeAmiibo = filtres.typeAmiibo
    ? LIBELLES_TYPE[filtres.typeAmiibo]
    : null;

  const partiesTitre = [
    libelleVoir(voir),
    libelleTypeAmiibo,
    nomConsole,
    filtres.serie,
    filtres.genre,
    filtres.developpeur,
    filtres.annee,
    libelleDispo,
    libelleMarche,
    rechercheBrute || null,
  ].filter((p): p is string => !!p);

  const suggestedTitle =
    partiesTitre.length > 0 ? partiesTitre.join(" · ") : NOM_SITE;

  return {
    source: "nintendo-db",
    owned,
    total,
    coverUrl,
    suggestedTitle,
    url: urlCanonique(urlSite, search),
  };
}
