/** Une console telle que l'administration la propose (étape 8 : Wii U et Wii). */
export type ConsoleAdmin = { slug: string; nom: string };

/** Console ouverte sans choix explicite : la Wii U, première console du site. */
export const CONSOLE_PAR_DEFAUT = "wii-u";

/** Forme d'une adresse de console (même règle que la base : minuscules, chiffres, tirets). */
export const SLUG_CONSOLE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Console choisie dans l'adresse (`?console=wii`) parmi celles de la base ; sinon la Wii U, sinon la première.
 * Une valeur inconnue est ignorée.
 */
export function consoleChoisie(
  consoles: ConsoleAdmin[],
  demandee?: string | null,
): ConsoleAdmin | null {
  return (
    consoles.find((c) => c.slug === demandee) ??
    consoles.find((c) => c.slug === CONSOLE_PAR_DEFAUT) ??
    consoles[0] ??
    null
  );
}
