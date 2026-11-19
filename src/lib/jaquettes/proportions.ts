/**
 * Proportions de la boîte d'une console (étape 9, SPEC v1.10) : la jaquette n'est jamais recadrée et sa vignette garde
 * la forme de la vraie boîte. Classes Tailwind écrites en entier (Tailwind ne lit pas les classes construites).
 */
const PRESQUE_CARREE = "aspect-[768/680]"; // DS, 3DS : scans GameTDB 768 × 680
const EN_HAUTEUR = "aspect-[27/38]"; // Wii U, Wii (boîtier DVD)
const SWITCH = "aspect-[1166/1888]"; // Switch, Switch 2 : boîtier plus étroit (scans GameTDB 1166 × 1888)
// N64, GBA (étape 14) : la forme change selon la région (en largeur, en hauteur, carrée) ; cadre carré dans le
// catalogue, la boîte entière au centre ; la fiche montre sa forme réelle (FORMES_REELLES).
const CARRE = "aspect-square";

const PAR_CONSOLE: Record<string, string> = {
  ds: PRESQUE_CARREE,
  "3ds": PRESQUE_CARREE,
  switch: SWITCH,
  "switch-2": SWITCH,
  n64: CARRE,
  gba: CARRE,
  gbc: CARRE,
  gb: CARRE,
  vb: CARRE,
};

/** Consoles dont la fiche montre la jaquette à sa forme réelle, différente selon la région (étape 14). */
export const FORMES_REELLES = new Set(["n64", "gba", "gbc", "gb", "vb"]);

/** Classe Tailwind des proportions de la boîte d'une console ; en hauteur par défaut. */
export const classeProportions = (consoleSlug: string): string =>
  PAR_CONSOLE[consoleSlug] ?? EN_HAUTEUR;
