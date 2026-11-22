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

export type Ajout = {
  cle: string;
  titre: string;
  region: Region;
  console: { slug: string; nom: string };
  href: string;
  jaquetteSrcset: string | null;
};

/** Derniers ajouts (US-22) : la version ajoutée, avec son titre et sa jaquette (le titre d'une autre région sinon). */
export function derniersAjouts(
  lignes: LigneAjout[],
  baseUrl?: string,
): Ajout[] {
  return lignes.map(({ region, cree_le, games }) => {
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
  });
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

/** Tout ce qu'un profil montre de la collection (Mon profil US-22, profil public US-23) : résumé, badges, ajouts. */
export function syntheseProfil(
  jeux: JeuStat[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
  lignesAjouts: LigneAjout[],
  baseUrl?: string,
) {
  const badges = calculerBadges(jeux, consoles, possessions);
  return {
    resume: resumeCollection(jeux, consoles, possessions),
    badges: {
      gagnes: badges.filter((b) => b.gagne),
      prochains: prochainsBadges(badges),
    },
    ajouts: derniersAjouts(lignesAjouts, baseUrl),
  };
}
