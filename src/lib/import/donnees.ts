import {
  REGIONS,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";
import type { InfosIgdb } from "./igdb";
import type { JeuWikipedia } from "./wikipedia";

/** Champs d'un jeu écrits par l'import (le slug, adresse stable, ne change jamais : ADR-06). */
export type ChampsJeu = {
  developpeur: string | null;
  wikipedia_url: string | null;
  igdb_id: number | null;
  physique: boolean;
};

/** Champs d'une sortie écrits par l'import. */
export type ChampsSortie = {
  sortie: boolean;
  titre: string | null;
  titre_romanise: string | null;
  date_sortie: string | null;
  precision_date: PrecisionDate | null;
  editeur: string | null;
};

export type JeuImporte = {
  game: ChampsJeu & { slug: string };
  releases: Record<Region, ChampsSortie>;
};

/** Assemble un jeu : Wikipédia (titres NA/PAL, dates, éditeurs, développeur) + IGDB (titre japonais, lien). */
export function construireJeu(
  wiki: JeuWikipedia,
  igdb: InfosIgdb | null,
): JeuImporte {
  const titreAnglais = wiki.titres.PAL || wiki.titres.US;
  const releases = Object.fromEntries(
    REGIONS.map((region) => {
      const s = wiki.sorties[region];
      if (!s) {
        const absente: ChampsSortie = {
          sortie: false,
          titre: null,
          titre_romanise: null,
          date_sortie: null,
          precision_date: null,
          editeur: null,
        };
        return [region, absente];
      }
      const japon = region === "JAP";
      const sortie: ChampsSortie = {
        sortie: true,
        // Une sortie publiée a toujours un titre (contrainte de la base) : l'anglais si IGDB n'a pas le japonais.
        titre: japon
          ? (igdb?.titreJaponais ?? titreAnglais)
          : wiki.titres[region],
        titre_romanise:
          japon && igdb?.titreJaponais ? igdb.titreRomanise : null,
        date_sortie: s.date,
        precision_date: s.precision,
        editeur: s.editeur,
      };
      return [region, sortie];
    }),
  ) as Record<Region, ChampsSortie>;

  return {
    game: {
      slug: wiki.slug,
      developpeur: wiki.developpeur,
      wikipedia_url: wiki.wikipediaUrl,
      igdb_id: igdb?.igdbId ?? null,
      physique: true,
    },
    releases,
  };
}

type SortieEnBase = ChampsSortie & {
  verrous: string[];
  jaquette_path: string | null;
};

/** Un jeu déjà en base, avec ses champs verrouillés (corrections manuelles, US-11). */
export type JeuEnBase = ChampsJeu & {
  id: string;
  verrous: string[];
  releases: Partial<Record<Region, SortieEnBase>>;
};

export type Fusion = {
  game: Partial<ChampsJeu>;
  releases: Record<Region, Partial<ChampsSortie>>;
  /** Corrections manuelles gardées alors que l'import propose autre chose (signalées dans le résumé). */
  ecarts: string[];
};

const affiche = (v: unknown) =>
  v === null || v === undefined ? "—" : String(v);

function garderVerrous<T extends object>(
  nouveau: T,
  existant: Partial<T> | undefined,
  verrous: string[],
  prefixe: string,
  ecarts: string[],
): Partial<T> {
  const patch: Partial<T> = {};
  for (const champ of Object.keys(nouveau) as (keyof T & string)[]) {
    const valeur = nouveau[champ];
    if (!verrous.includes(champ)) {
      patch[champ] = valeur;
    } else if (existant && existant[champ] !== valeur) {
      ecarts.push(
        `${prefixe}${champ} : « ${affiche(existant[champ])} » gardé (import : « ${affiche(valeur)} »)`,
      );
    }
  }
  return patch;
}

/**
 * Ce que l'import écrit (ADR-03 point 4) : tout pour un nouveau jeu ; pour un jeu existant, tout sauf les champs
 * verrouillés (corrections manuelles), qui ne sont jamais remplacés et dont l'écart éventuel est signalé.
 */
export function fusionner(
  existant: JeuEnBase | null,
  nouveau: JeuImporte,
): Fusion {
  const ecarts: string[] = [];
  const { developpeur, wikipedia_url, igdb_id, physique } = nouveau.game;
  const champsJeu: ChampsJeu = {
    developpeur,
    wikipedia_url,
    igdb_id,
    physique,
  };
  const game = garderVerrous(
    champsJeu,
    existant ?? undefined,
    existant?.verrous ?? [],
    "",
    ecarts,
  );
  const releases = Object.fromEntries(
    REGIONS.map((r) => {
      const enBase = existant?.releases[r];
      return [
        r,
        garderVerrous(
          nouveau.releases[r],
          enBase,
          enBase?.verrous ?? [],
          `${r} `,
          ecarts,
        ),
      ];
    }),
  ) as Record<Region, Partial<ChampsSortie>>;
  return { game, releases, ecarts };
}

export type JaquetteChoisie = { imageId: string; secours: boolean } | null;

/**
 * Jaquette IGDB à copier pour chaque région (ADR-04) : celle de la région, sinon la principale en secours (R2).
 * Rien pour une région non sortie, ni pour une région qui a déjà sa jaquette (copiée ou ajoutée à la main).
 */
export function choisirJaquettes(
  jeu: JeuImporte,
  igdb: InfosIgdb | null,
  existantes: Record<Region, string | null> | null,
): Record<Region, JaquetteChoisie> {
  return Object.fromEntries(
    REGIONS.map((r) => {
      if (!igdb || !jeu.releases[r].sortie || existantes?.[r]) return [r, null];
      const propre = igdb.jaquettes[r];
      const imageId = propre ?? igdb.jaquettes.US;
      return [r, imageId ? { imageId, secours: !propre } : null];
    }),
  ) as Record<Region, JaquetteChoisie>;
}
