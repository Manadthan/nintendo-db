import { TRI_PAR_DEFAUT } from "./catalogue";
import type { Tri } from "./types";

/**
 * Tri du catalogue dans l'adresse (`?tri=`, SPEC v1.45), comme la recherche et les filtres : il survit au retour
 * d'une fiche et se partage par lien. Le tri par défaut n'ajoute rien à l'adresse.
 */

const TRIS: readonly Tri[] = ["recents", "anciens", "az", "note"];
const PARAMETRE = "tri";

/** Tri lu dans les paramètres d'une adresse ; inconnu ou absent : le tri par défaut. */
export function triDepuisParametres(recherche: string): Tri {
  const valeur = new URLSearchParams(recherche).get(PARAMETRE);
  return TRIS.find((t) => t === valeur) ?? TRI_PAR_DEFAUT;
}

/** Paramètres de l'adresse avec ce tri, les autres gardés. */
export function avecTri(recherche: string, tri: Tri): string {
  const params = new URLSearchParams(recherche);
  if (tri === TRI_PAR_DEFAUT) params.delete(PARAMETRE);
  else params.set(PARAMETRE, tri);
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/** Tri en cours, lu dans l'adresse. */
export const lireTri = (): Tri => triDepuisParametres(window.location.search);

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient les composants quand le tri change. */
export function abonnerTri(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Enregistre le tri dans l'adresse, sans recharger la page, et prévient les composants. */
export function enregistrerTri(tri: Tri) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${avecTri(search, tri)}${hash}`,
  );
  for (const rappel of abonnes) rappel();
}
