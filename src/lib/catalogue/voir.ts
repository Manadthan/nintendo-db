import type { Marche } from "./types";

/**
 * Coches « Jeux » et « Guides » du catalogue (US-27), dans l'adresse (`?voir=guides`, `?voir=jeux,guides`) comme le
 * tri : le défaut (« Jeux » seule) n'ajoute rien. On ne peut pas tout décocher.
 */
export type Voir = { jeux: boolean; guides: boolean };

export const VOIR_PAR_DEFAUT: Voir = { jeux: true, guides: false };
// Trois choix possibles, toujours les mêmes objets (`useSyncExternalStore` compare par référence).
const GUIDES_SEULS: Voir = { jeux: false, guides: true };
const LES_DEUX: Voir = { jeux: true, guides: true };
const PARAMETRE = "voir";

/** Choix lu dans les paramètres d'une adresse ; inconnu, vide ou absent : « Jeux » seule. */
export function voirDepuisParametres(recherche: string): Voir {
  const valeurs = (new URLSearchParams(recherche).get(PARAMETRE) ?? "").split(
    ",",
  );
  if (!valeurs.includes("guides")) return VOIR_PAR_DEFAUT;
  return valeurs.includes("jeux") ? LES_DEUX : GUIDES_SEULS;
}

/** Paramètres de l'adresse avec ce choix, les autres gardés. */
export function avecVoir(recherche: string, voir: Voir): string {
  const params = new URLSearchParams(recherche);
  if (!voir.guides) params.delete(PARAMETRE);
  else params.set(PARAMETRE, voir.jeux ? "jeux,guides" : "guides");
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/** Les guides sont japonais : seulement sur les marchés « Tous » et « Japon » (US-27). */
export const guidesPermis = (marche: Marche) =>
  marche === "TOUS" || marche === "JAP";

/** Ce qui s'affiche vraiment : sur un autre marché, « Guides » est grisée et les jeux reviennent. */
export function voirEffectif(voir: Voir, marche: Marche): Voir {
  return guidesPermis(marche) ? voir : VOIR_PAR_DEFAUT;
}

/** Bascule d'une coche ; la dernière cochée ne se décoche pas. */
export function basculer(voir: Voir, coche: keyof Voir): Voir {
  const suivant = { ...voir, [coche]: !voir[coche] };
  return suivant.jeux || suivant.guides ? suivant : voir;
}

/** Choix en cours, lu dans l'adresse. */
export const lireVoir = (): Voir => voirDepuisParametres(window.location.search);

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient les composants quand le choix change. */
export function abonnerVoir(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Enregistre le choix dans l'adresse, sans recharger la page, et prévient les composants. */
export function enregistrerVoir(voir: Voir) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${avecVoir(search, voir)}${hash}`,
  );
  for (const rappel of abonnes) rappel();
}
