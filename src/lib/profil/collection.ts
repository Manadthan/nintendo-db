import { srcsetAmiibo } from "@/lib/amiibo/fiche";
import { calculerBadges, prochainsBadges } from "@/lib/badges/badges";
import { cleVersion } from "@/lib/collection/collection";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import { srcsetJaquette } from "@/lib/jaquettes/stockage";
import {
  maCollection,
  parRegion,
  type Avancement,
  type JeuStat,
} from "@/lib/statistiques/statistiques";

/**
 * Collection résumée de Mon profil (US-22), sans accès à la base : mêmes calculs que la page Statistiques du
 * propriétaire (US-18), réduits aux consoles où le compte possède au moins un jeu.
 */
export function resumeCollection(
  jeux: JeuStat[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
): {
  jeux: number;
  versions: number;
  consoles: ({ slug: string; nom: string } & Avancement)[];
  regions: Record<Region, number>;
} {
  const collection = maCollection(jeux, consoles, possessions);
  const regions = parRegion(jeux, possessions);
  return {
    jeux: collection.total.possedes,
    versions: REGIONS.reduce((n, r) => n + regions[r], 0),
    consoles: collection.consoles.filter((c) => c.possedes > 0),
    regions,
  };
}

export type LigneAjout = {
  region: Region;
  cree_le: string;
  games: {
    slug: string;
    consoles: { slug: string; nom: string };
    releases: {
      region: Region;
      titre: string | null;
      jaquette_path: string | null;
    }[];
  };
};

/** Un amiibo ajouté (US-30), tel que le lisent Mon profil et `profil_public()` (migration 0036). */
export type LigneAjoutAmiibo = {
  cree_le: string;
  amiibo: { slug: string; nom: string; image_path: string | null };
};

export type Ajout = {
  cle: string;
  titre: string;
  /** Version ajoutée ; null pour un amiibo (une case par amiibo, US-30). */
  region: Region | null;
  /** Console du jeu, pour les proportions de sa jaquette ; null pour un amiibo (photo carrée). */
  console: { slug: string; nom: string } | null;
  href: string;
  jaquetteSrcset: string | null;
};

/** Nombre d'ajouts montrés (US-22). */
export const NOMBRE_AJOUTS = 6;

/**
 * Derniers ajouts (US-22, US-30) : versions de jeux et amiibo mêlés, du plus récent au plus ancien, 6 au plus. Une
 * version a son titre et sa jaquette (le titre d'une autre région sinon) ; un amiibo, son nom et sa photo.
 */
export function derniersAjouts(
  lignes: LigneAjout[],
  baseUrl?: string,
  lignesAmiibo: LigneAjoutAmiibo[] = [],
): Ajout[] {
  const amiibo = lignesAmiibo.map(({ cree_le, amiibo: a }) => ({
    cree_le,
    ajout: {
      cle: `amiibo-${a.slug}-${cree_le}`,
      titre: a.nom,
      region: null,
      console: null,
      href: `/amiibo/${a.slug}`,
      jaquetteSrcset: a.image_path ? srcsetAmiibo(a.image_path, baseUrl) : null,
    } satisfies Ajout,
  }));
  const jeux = lignes.map(({ region, cree_le, games }) => ({
    cree_le,
    ajout: versionAjoutee(region, cree_le, games, baseUrl),
  }));
  return [...jeux, ...amiibo]
    .sort((a, b) => b.cree_le.localeCompare(a.cree_le))
    .slice(0, NOMBRE_AJOUTS)
    .map(({ ajout }) => ajout);
}

function versionAjoutee(
  region: Region,
  cree_le: string,
  games: LigneAjout["games"],
  baseUrl?: string,
): Ajout {
  const version = games.releases.find((r) => r.region === region);
  const titre =
    version?.titre ??
    (["US", "PAL", "JAP"] as const)
      .map((r) => games.releases.find((s) => s.region === r)?.titre)
      .find(Boolean) ??
    "Sans titre";
  return {
    cle: `${games.slug}-${region}-${cree_le}`,
    titre,
    region,
    console: games.consoles,
    href: `/jeux/${games.consoles.slug}/${games.slug}`,
    jaquetteSrcset: version?.jaquette_path
      ? srcsetJaquette(version.jaquette_path, baseUrl)
      : null,
  };
}

export type JeuxDeConsole = {
  console: { slug: string; nom: string };
  jeux: { id: string; titre: string; href: string | null }[];
};

/** Jeux possédés par console (profil public, US-23) : consoles dans l'ordre donné, jeux par titre. */
export function jeuxParConsole(
  jeux: JeuStat[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
): JeuxDeConsole[] {
  const possede = (j: JeuStat) =>
    REGIONS.some((r) => possessions.has(cleVersion(j.id, r)));
  return consoles
    .map((c) => ({
      console: c,
      jeux: jeux
        .filter((j) => j.console.slug === c.slug && possede(j))
        .map((j) => ({
          id: j.id,
          titre: j.titre,
          href: j.slug ? `/jeux/${c.slug}/${j.slug}` : null,
        }))
        .sort((a, b) => a.titre.localeCompare(b.titre, "fr")),
    }))
    .filter((c) => c.jeux.length > 0);
}

/** Amiibo d'un profil (US-30) : nombre possédé, total du catalogue, derniers ajoutés. */
export type AmiiboProfil = {
  possedes: number;
  total: number;
  ajouts: LigneAjoutAmiibo[];
};

/**
 * Tout ce qu'un profil montre de la collection (Mon profil US-22, profil public US-23) : résumé (avec la ligne
 * « Amiibo : N / total », US-30), badges, ajouts.
 */
export function syntheseProfil(
  jeux: JeuStat[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
  lignesAjouts: LigneAjout[],
  baseUrl?: string,
  amiibo: AmiiboProfil = { possedes: 0, total: 0, ajouts: [] },
) {
  const badges = calculerBadges(jeux, consoles, possessions);
  return {
    resume: {
      ...resumeCollection(jeux, consoles, possessions),
      amiibo: { possedes: amiibo.possedes, total: amiibo.total },
    },
    badges: {
      gagnes: badges.filter((b) => b.gagne),
      prochains: prochainsBadges(badges),
    },
    ajouts: derniersAjouts(lignesAjouts, baseUrl, amiibo.ajouts),
  };
}
