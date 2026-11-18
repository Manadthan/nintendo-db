/**
 * Proportions de la boîte d'une console (étape 9, SPEC v1.10) : la jaquette n'est jamais recadrée et sa vignette garde
 * la forme de la vraie boîte. Classes Tailwind écrites en entier (Tailwind ne lit pas les classes construites).
 */
const PRESQUE_CARREE = "aspect-[768/680]"; // DS, 3DS : scans GameTDB 768 × 680
const EN_HAUTEUR = "aspect-[27/38]"; // Wii U, Wii (boîtier DVD)
const SWITCH = "aspect-[1166/1888]"; // Switch, Switch 2 : boîtier plus étroit (scans GameTDB 1166 × 1888)

const PAR_CONSOLE: Record<string, string> = {
  ds: PRESQUE_CARREE,
  "3ds": PRESQUE_CARREE,
  switch: SWITCH,
  "switch-2": SWITCH,
};

/** Classe Tailwind des proportions de la boîte d'une console ; en hauteur par défaut. */
export const classeProportions = (consoleSlug: string): string =>
  PAR_CONSOLE[consoleSlug] ?? EN_HAUTEUR;
