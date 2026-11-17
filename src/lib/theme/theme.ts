/** Choix du thème (US-08) : « auto » suit le réglage de l'iPhone ; « clair » et « sombre » le forcent. */
export type Theme = "auto" | "clair" | "sombre";

/** Clé du choix, gardée dans ce navigateur. */
export const CLE_THEME = "nintendo-db:theme";

/** Ordre du bouton de l'en-tête : un appui passe au choix suivant. */
const ORDRE: readonly Theme[] = ["auto", "clair", "sombre"];

export const LIBELLES: Record<Theme, string> = {
  auto: "Thème : automatique",
  clair: "Thème : clair",
  sombre: "Thème : sombre",
};

export function themeSuivant(theme: Theme): Theme {
  return ORDRE[(ORDRE.indexOf(theme) + 1) % ORDRE.length]!;
}

/** Valeur lue dans le stockage → thème ; « auto » pour une valeur absente ou inconnue. */
export function themeDepuisTexte(texte: string | null): Theme {
  return texte === "clair" || texte === "sombre" ? texte : "auto";
}

/**
 * Script placé en tête de page, exécuté avant le premier affichage : pose le choix forcé sur <html> pour
 * qu'une page en mode sombre ne s'affiche jamais d'abord en blanc. Le stockage peut être indisponible.
 */
export const SCRIPT_THEME = `try{var t=localStorage.getItem(${JSON.stringify(CLE_THEME)});if(t==="clair"||t==="sombre")document.documentElement.dataset.theme=t}catch(e){}`;

/** Applique un choix : sur <html> (immédiat) et dans le stockage (prochaines visites). */
export function appliquerTheme(theme: Theme) {
  const racine = document.documentElement;
  if (theme === "auto") delete racine.dataset.theme;
  else racine.dataset.theme = theme;
  try {
    if (theme === "auto") localStorage.removeItem(CLE_THEME);
    else localStorage.setItem(CLE_THEME, theme);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour cette page seulement.
  }
  abonnes.forEach((rappel) => rappel());
}

/** Thème en cours, lu sur <html> (posé par le script de tête ou par le bouton). */
export function lireTheme(): Theme {
  return themeDepuisTexte(document.documentElement.dataset.theme ?? null);
}

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient le bouton quand le thème change. */
export function abonnerTheme(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}
