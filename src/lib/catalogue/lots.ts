import type { Groupe, VersionAffichee } from "./types";

/**
 * Affichage par lots (SPEC v1.41, audit de performance C) : les 60 premiers jeux, puis 60 de plus chaque fois que
 * le visiteur approche du bas. Dessiner les ≈ 1 000 cartes d'un coup bloquait le téléphone.
 */
export const LOT = 60;

/**
 * Les `limite` premières versions, dans leurs groupes (années ou tranches de note). Un groupe garde sa liste
 * complète dans `versions` (son nombre de jeux reste juste) ; `affichees` ne contient que celles à dessiner.
 * Les groupes sans version à dessiner sont retirés.
 */
export function premiersDesGroupes(
  groupes: Groupe[],
  limite: number,
): (Groupe & { affichees: VersionAffichee[] })[] {
  let reste = limite;
  const resultat: (Groupe & { affichees: VersionAffichee[] })[] = [];
  for (const groupe of groupes) {
    if (reste <= 0) break;
    const affichees = groupe.versions.slice(0, reste);
    reste -= affichees.length;
    resultat.push({ ...groupe, affichees });
  }
  return resultat;
}

/** Nombre de jeux à dessiner au retour d'une fiche : au moins un lot, et assez pour retrouver le jeu cliqué. */
export function limiteRestauree(nombre: number | undefined): number {
  return Math.max(LOT, Math.ceil((nombre ?? 0) / LOT) * LOT);
}
