import { REGIONS, type Region } from "@/lib/catalogue/types";
import { cleVersion } from "@/lib/collection/collection";

/**
 * Statistiques du propriétaire (US-18, DESIGN ADR-11) : calculées à l'ouverture de la page, jamais stockées.
 * Fonctions pures, testées sur des jeux d'exemple.
 */
export type JeuStat = {
  id: string;
  titre: string;
  console: { slug: string; nom: string };
  metacritic: number | null;
  /** Régions où le jeu est sorti. */
  sorties: Region[];
  /** Régions sorties dont la jaquette est à remplacer (vignette neutre ou image IGDB, US-12). */
  sansJaquette: Region[];
  /** Régions sorties sans code produit. */
  sansCode: Region[];
};

export type Avancement = { possedes: number; total: number; pourcent: number };

const avancement = (possedes: number, total: number): Avancement => ({
  possedes,
  total,
  pourcent: total ? Math.round((100 * possedes) / total) : 0,
});

/** Un jeu compte comme possédé dès une version possédée (choix du propriétaire, SPEC v1.20). */
export const jeuPossede = (jeu: JeuStat, possessions: ReadonlySet<string>) =>
  REGIONS.some((r) => possessions.has(cleVersion(jeu.id, r)));

/** Ma collection : au total, puis par console dans l'ordre donné (consoles sans jeu omises). */
export function maCollection(
  jeux: JeuStat[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
): {
  total: Avancement;
  consoles: ({ slug: string; nom: string } & Avancement)[];
} {
  const possede = (j: JeuStat) => jeuPossede(j, possessions);
  return {
    total: avancement(jeux.filter(possede).length, jeux.length),
    consoles: consoles
      .map((c) => {
        const deLaConsole = jeux.filter((j) => j.console.slug === c.slug);
        return {
          ...c,
          ...avancement(deLaConsole.filter(possede).length, deLaConsole.length),
        };
      })
      .filter((c) => c.total > 0),
  };
}

/** Versions possédées par région (un jeu possédé en JAP et PAL compte une fois dans chacune). */
export function parRegion(
  jeux: JeuStat[],
  possessions: ReadonlySet<string>,
): Record<Region, number> {
  return Object.fromEntries(
    REGIONS.map((r) => [
      r,
      jeux.filter((j) => possessions.has(cleVersion(j.id, r))).length,
    ]),
  ) as Record<Region, number>;
}

export type JeuNote = {
  id: string;
  titre: string;
  console: string;
  note: number;
};

/**
 * Notes Metacritic : moyenne arrondie des jeux possédés notés (null sans aucun), puis les `n` mieux notés possédés
 * et non possédés (à égalité : ordre alphabétique).
 */
export function notesMetacritic(
  jeux: JeuStat[],
  possessions: ReadonlySet<string>,
  n = 3,
): {
  moyenne: number | null;
  meilleursPossedes: JeuNote[];
  meilleursManquants: JeuNote[];
} {
  const notes = jeux
    .filter((j) => j.metacritic !== null)
    .map((j) => ({
      jeu: {
        id: j.id,
        titre: j.titre,
        console: j.console.nom,
        note: j.metacritic!,
      },
      possede: jeuPossede(j, possessions),
    }))
    .sort(
      (a, b) =>
        b.jeu.note - a.jeu.note || a.jeu.titre.localeCompare(b.jeu.titre, "fr"),
    );
  const possedes = notes.filter((x) => x.possede).map((x) => x.jeu);
  return {
    moyenne: possedes.length
      ? Math.round(possedes.reduce((s, j) => s + j.note, 0) / possedes.length)
      : null,
    meilleursPossedes: possedes.slice(0, n),
    meilleursManquants: notes
      .filter((x) => !x.possede)
      .slice(0, n)
      .map((x) => x.jeu),
  };
}

export type Manque = {
  /** Versions sorties (jaquettes, codes) ou jeux (notes) concernés. */
  nombre: number;
  /** Première console concernée, dans l'ordre donné : la liste s'ouvre sur elle ; null si rien ne manque. */
  console: string | null;
};

/**
 * État du catalogue (US-18 2/2) : nombre de jeux ; versions sorties sans jaquette (à remplacer) ou sans code produit ;
 * jeux sans note Metacritic.
 */
export function etatCatalogue(
  jeux: JeuStat[],
  consoles: { slug: string }[],
): { jeux: number; jaquettes: Manque; codes: Manque; notes: Manque } {
  const manque = (combien: (j: JeuStat) => number): Manque => {
    const nombre = jeux.reduce((s, j) => s + combien(j), 0);
    return {
      nombre,
      console:
        consoles.find((c) =>
          jeux.some((j) => j.console.slug === c.slug && combien(j) > 0),
        )?.slug ?? null,
    };
  };
  return {
    jeux: jeux.length,
    jaquettes: manque((j) => j.sansJaquette.length),
    codes: manque((j) => j.sansCode.length),
    notes: manque((j) => (j.metacritic === null ? 1 : 0)),
  };
}
