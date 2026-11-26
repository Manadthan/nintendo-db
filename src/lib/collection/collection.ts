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

/** Clé d'un amiibo possédé (US-30 : une case par amiibo, pas par région) ; jamais celle d'une version de jeu. */
export const cleAmiibo = (amiiboId: string) => `amiibo:${amiiboId}`;

/**
 * Ensemble des possessions, à partir des lignes des tables `possessions` (versions des jeux) et
 * `possessions_amiibo` (US-30).
 */
export function ensemble(
  lignes: { game_id: string; region: Region }[],
  amiibo: { amiibo_id: string }[] = [],
): ReadonlySet<string> {
  return new Set([
    ...lignes.map((l) => cleVersion(l.game_id, l.region)),
    ...amiibo.map((a) => cleAmiibo(a.amiibo_id)),
  ]);
}

/** L'amiibo est-il possédé (US-30) ? */
export const possedeAmiibo = (
  possessions: ReadonlySet<string>,
  amiiboId: string,
) => possessions.has(cleAmiibo(amiiboId));

/** Nouvel ensemble après avoir coché ou décoché un amiibo ; l'ancien n'est pas modifié. */
export function avecAmiibo(
  possessions: ReadonlySet<string>,
  amiiboId: string,
  avoir: boolean,
): ReadonlySet<string> {
  const suite = new Set(possessions);
  if (avoir) suite.add(cleAmiibo(amiiboId));
  else suite.delete(cleAmiibo(amiiboId));
  return suite;
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
 * des versions du jeu (SPEC v1.14). Un amiibo : sa case, quel que soit le marché (US-30).
 */
export function affichePossedee(
  possessions: ReadonlySet<string>,
  v: VersionAffichee,
  marche: Marche,
): boolean {
  if (v.amiibo) return possedeAmiibo(possessions, v.amiibo.id);
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
  // Un guide (US-27, ADR-19 point 8) ne se possède pas : le filtre montre les jeux et les amiibo (US-30, choix du 26/11).
  return versions.filter(
    (v) =>
      !v.guide &&
      affichePossedee(possessions, v, marche) === (filtre === "possedes"),
  );
}
