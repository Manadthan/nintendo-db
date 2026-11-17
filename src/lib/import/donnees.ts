import {
  REGIONS,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";
import type { Database } from "@/types/database";
import { codeProduit, urlsScan } from "./gametdb";
import type { InfosIgdb } from "./igdb";
import type { JeuAImporter } from "./physique";

export type SourceJaquette = Database["public"]["Enums"]["jaquette_source"];

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
  code_produit: string | null;
};

export type JeuImporte = {
  game: ChampsJeu & { slug: string };
  releases: Record<Region, ChampsSortie>;
};

/**
 * Assemble un jeu : Wikipédia (titres NA/PAL, dates, éditeurs, développeur ; régions déjà réduites aux boîtes par
 * GameTDB) + IGDB (titre japonais, lien) + GameTDB (code produit imprimé sur la boîte).
 */
export function construireJeu(
  wiki: JeuAImporter,
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
          code_produit: null,
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
        code_produit: wiki.disques[region]
          ? codeProduit(wiki.disques[region])
          : null,
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
  jaquette_source: SourceJaquette | null;
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

/** Une image à essayer pour une région : scan de boîte GameTDB, ou image IGDB (de la région, ou principale). */
export type CandidatJaquette =
  | { source: "gametdb"; url: string }
  | { source: "igdb"; imageId: string; secours: boolean };

/** Jaquette déjà en base pour une région. */
export type JaquetteEnBase = {
  path: string | null;
  source: SourceJaquette | null;
};

/**
 * Images à essayer, dans l'ordre, pour chaque région sortie (ADR-04) : le scan GameTDB de la boîte (langues PAL
 * EN, FR, DE), puis l'image IGDB de la région, puis la principale en secours (R2). Rien à faire (null) pour une
 * région non sortie, une jaquette ajoutée à la main ou déjà scannée ; une image IGDB déjà copiée n'est remplacée
 * que par un scan.
 */
export function choisirJaquettes(
  jeu: JeuImporte,
  disques: JeuAImporter["disques"],
  igdb: InfosIgdb | null,
  existantes: Partial<Record<Region, JaquetteEnBase>> | null,
): Record<Region, CandidatJaquette[] | null> {
  return Object.fromEntries(
    REGIONS.map((r) => {
      const deja = existantes?.[r];
      const garder = deja?.path && deja.source !== "igdb";
      if (!jeu.releases[r].sortie || garder) return [r, null];
      const id = disques[r];
      const candidats: CandidatJaquette[] = id
        ? urlsScan({ id, region: r }).map((url) => ({
            source: "gametdb" as const,
            url,
          }))
        : [];
      if (!deja?.path && igdb) {
        const propre = igdb.jaquettes[r];
        const imageId = propre ?? igdb.jaquettes.US;
        if (imageId)
          candidats.push({ source: "igdb", imageId, secours: !propre });
      }
      return [r, candidats.length ? candidats : null];
    }),
  ) as Record<Region, CandidatJaquette[] | null>;
}
