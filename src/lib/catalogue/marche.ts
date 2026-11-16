import type { Marche } from "./types";

/** Clé du marché choisi dans le catalogue (US-03), gardée dans ce navigateur ; lue aussi par la fiche (US-04). */
export const CLE_MARCHE = "nintendo-db:marche";

/** Choix proposés dans le catalogue, dans l'ordre d'affichage (SPEC US-03). */
export const MARCHES: readonly { valeur: Marche; libelle: string }[] = [
  { valeur: "TOUS", libelle: "Tous" },
  { valeur: "PAL", libelle: "Europe" },
  { valeur: "US", libelle: "Amérique du Nord" },
  { valeur: "JAP", libelle: "Japon" },
];

/** « jap », « JAP »… → marché ; null si la valeur est inconnue. */
export function marcheDepuisTexte(texte: string | null): Marche | null {
  const valeur = texte?.toUpperCase();
  return MARCHES.find((m) => m.valeur === valeur)?.valeur ?? null;
}

/** Paramètres de l'adresse avec le marché (`?marche=us`) ; « Tous », le défaut, n'y figure pas. */
export function versParametre(recherche: string, marche: Marche): string {
  const params = new URLSearchParams(recherche);
  if (marche === "TOUS") params.delete("marche");
  else params.set("marche", marche.toLowerCase());
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/**
 * Marché en cours : celui de l'adresse (lien partagé) s'il y en a un, sinon celui enregistré dans ce navigateur,
 * sinon « Tous ». Le stockage peut être indisponible (navigation privée) : on l'ignore alors.
 */
export function lireMarche(): Marche {
  const depuisAdresse = marcheDepuisTexte(
    new URLSearchParams(window.location.search).get("marche"),
  );
  if (depuisAdresse) return depuisAdresse;
  try {
    return marcheDepuisTexte(localStorage.getItem(CLE_MARCHE)) ?? "TOUS";
  } catch {
    return "TOUS";
  }
}

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient les composants quand le marché change. */
export function abonnerMarche(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Enregistre le marché choisi (navigateur + adresse, sans recharger la page) et prévient les composants. */
export function enregistrerMarche(marche: Marche) {
  try {
    localStorage.setItem(CLE_MARCHE, marche);
  } catch {
    // Stockage indisponible : le choix vaut pour cette visite (et reste dans l'adresse).
  }
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${versParametre(search, marche)}${hash}`,
  );
  for (const rappel of abonnes) rappel();
}
