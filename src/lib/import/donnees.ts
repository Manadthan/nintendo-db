import {
  REGIONS,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";
import type { Database } from "@/types/database";
import { cheminScan, codeProduit } from "./gametdb";
import type { JeuAImporter } from "./physique";

export type SourceJaquette = Database["public"]["Enums"]["jaquette_source"];

/** Champs d'un jeu écrits par l'import (le slug, adresse stable, ne change jamais : ADR-06). */
export type ChampsJeu = {
  developpeur: string | null;
  /** Genres séparés par « , » (US-06), ou null si GameTDB n'en donne pas. */
  genre: string | null;
  wikipedia_url: string | null;
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
 * GameTDB) + GameTDB (titre japonais et sa romanisation, code produit imprimé sur la boîte, genres).
 */
export function construireJeu(
  wiki: JeuAImporter,
  /** Préfixe des codes produit de la console (Wii U par défaut), ou sa règle selon l'identifiant (3DS). */
  prefixeCode: string | ((id: string) => string) = "WUP-P-",
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
        // Une sortie publiée a toujours un titre (contrainte de la base) : l'anglais sans titre japonais connu.
        titre: japon
          ? (wiki.japonais?.titre ?? titreAnglais)
          : wiki.titres[region],
        titre_romanise: japon ? (wiki.japonais?.romanise ?? null) : null,
        date_sortie: s.date,
        precision_date: s.precision,
        editeur: s.editeur,
        code_produit: wiki.disques[region]
          ? codeProduit(wiki.disques[region], prefixeCode)
          : null,
      };
      return [region, sortie];
    }),
  ) as Record<Region, ChampsSortie>;

  return {
    game: {
      slug: wiki.slug,
      developpeur: wiki.developpeur,
      genre: wiki.genres.length ? wiki.genres.join(", ") : null,
      wikipedia_url: wiki.wikipediaUrl,
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
  const { developpeur, genre, wikipedia_url, physique } = nouveau.game;
  const champsJeu: ChampsJeu = { developpeur, genre, wikipedia_url, physique };
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

/** Jaquette déjà en base pour une région. */
export type JaquetteEnBase = {
  path: string | null;
  source: SourceJaquette | null;
};

/**
 * Scan GameTDB à copier pour chaque région sortie (ADR-04 ; déposé par le relais, #53) : son chemin dans le
 * bucket du relais, ou null. Rien pour une région non sortie ou sans disque connu, ni pour une jaquette ajoutée à
 * la main ou déjà scannée ; une ancienne image IGDB est remplacée par le scan. `recopier` : recopier aussi les
 * scans déjà copiés (nouvelle taille d'image, #48), jamais les ajouts à la main.
 */
export function choisirJaquettes(
  jeu: JeuImporte,
  disques: JeuAImporter["disques"],
  existantes: Partial<Record<Region, JaquetteEnBase>> | null,
  recopier = false,
  /** Dossier des scans de la console dans le relais (Wii U par défaut), ou par région (Switch). */
  dossierScans: string | ((region: Region) => string) = "scans",
): Record<Region, string | null> {
  return Object.fromEntries(
    REGIONS.map((r) => {
      const deja = existantes?.[r];
      const manuelle = deja?.source === "photo" || deja?.source === "url";
      const scanne = deja?.path && deja.source === "gametdb";
      const id = disques[r];
      if (!jeu.releases[r].sortie || !id || manuelle || (scanne && !recopier))
        return [r, null];
      const dossier =
        typeof dossierScans === "function" ? dossierScans(r) : dossierScans;
      return [r, cheminScan(id, dossier)];
    }),
  ) as Record<Region, string | null>;
}
