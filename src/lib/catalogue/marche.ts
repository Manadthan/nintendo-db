import type { Marche } from "./types";

/** Clé du marché choisi dans le catalogue (US-03), gardée dans ce navigateur ; lue aussi par la fiche (US-04). */
export const CLE_MARCHE = "nintendo-db:marche";

const MARCHES: readonly Marche[] = ["TOUS", "JAP", "US", "PAL"];

/** Marché enregistré, ou « Tous » s'il n'y en a pas ou si le stockage est indisponible (navigation privée). */
export function lireMarche(): Marche {
  try {
    const valeur = localStorage.getItem(CLE_MARCHE);
    return MARCHES.find((m) => m === valeur) ?? "TOUS";
  } catch {
    return "TOUS";
  }
}
