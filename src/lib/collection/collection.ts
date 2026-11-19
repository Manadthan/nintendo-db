import {
  REGIONS,
  type Marche,
  type Region,
  type VersionAffichee,
} from "@/lib/catalogue/types";

/**
 * Ma collection (US-16, DESIGN ADR-07) : versions régionales possédées, identifiées par `(jeu, région)`. Fonctions
 * pures, testées sans base ni navigateur.
 */
export type Version = { gameId: string; region: Region };

/** Clé d'une version dans l'ensemble des possessions. */
export const cleVersion = (gameId: string, region: Region) =>
  `${gameId}:${region}`;

/** Ensemble des versions possédées, à partir des lignes de la table `possessions`. */
export function ensemble(
  lignes: { game_id: string; region: Region }[],
): ReadonlySet<string> {
  return new Set(lignes.map((l) => cleVersion(l.game_id, l.region)));
}

/** La version est-elle possédée ? */
export const possede = (
  possessions: ReadonlySet<string>,
  gameId: string,
  region: Region,
) => possessions.has(cleVersion(gameId, region));

/** Nouvel ensemble après avoir coché (`avoir` vrai) ou décoché une version ; l'ancien n'est pas modifié. */
export function avecVersion(
  possessions: ReadonlySet<string>,
  { gameId, region }: Version,
  avoir: boolean,
): ReadonlySet<string> {
  const suite = new Set(possessions);
  if (avoir) suite.add(cleVersion(gameId, region));
  else suite.delete(cleVersion(gameId, region));
  return suite;
}

/**
 * Version affichée possédée ? Sur un marché (JAP, US, PAL) : la version de ce marché. Marché « Tous » : au moins une
 * des versions du jeu (SPEC v1.14).
 */
export function affichePossedee(
  possessions: ReadonlySet<string>,
  v: VersionAffichee,
  marche: Marche,
): boolean {
  return marche === "TOUS"
    ? REGIONS.some((r) => possede(possessions, v.jeu.id, r))
    : possede(possessions, v.jeu.id, v.region);
}

/** Filtre « Collection » (US-16) : tous, possédés ou manquants. */
export type FiltreCollection = "possedes" | "manquants";

export function filtrerCollection(
  versions: VersionAffichee[],
  filtre: FiltreCollection | null,
  possessions: ReadonlySet<string>,
  marche: Marche,
): VersionAffichee[] {
  if (!filtre) return versions;
  return versions.filter(
    (v) => affichePossedee(possessions, v, marche) === (filtre === "possedes"),
  );
}

/** Compteur par console (« GameCube : 12 / 58 ») : jeux possédés et jeux affichés du marché, consoles qui en ont. */
export function compteurs(
  versions: VersionAffichee[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
  marche: Marche,
): { slug: string; nom: string; possedes: number; total: number }[] {
  return consoles
    .map((c) => {
      const deLaConsole = versions.filter((v) => v.jeu.console.slug === c.slug);
      return {
        ...c,
        possedes: deLaConsole.filter((v) =>
          affichePossedee(possessions, v, marche),
        ).length,
        total: deLaConsole.length,
      };
    })
    .filter((c) => c.total > 0);
}
