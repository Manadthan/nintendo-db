import type { Region } from "@/lib/catalogue/types";

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
