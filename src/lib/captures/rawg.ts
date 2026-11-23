// Captures RAWG (étape 28, SPEC US-26, DESIGN ADR-18 et étude §1 sexdecies) : rapprochement d'un jeu du catalogue
// avec un jeu RAWG, choix des captures, adresses réduites. Module pur, sans import : lu aussi par le relais
// (scripts/relais-rawg.mjs, Node sans alias « @/ »).

/** Nos consoles → identifiant de la plateforme chez RAWG (étude du 22/11). Virtual Boy et Switch 2 : absentes. */
export const PLATEFORMES_RAWG = {
  nes: 49,
  snes: 79,
  n64: 83,
  gamecube: 105,
  wii: 11,
  "wii-u": 10,
  switch: 7,
  gb: 26,
  gbc: 43,
  gba: 24,
  ds: 9,
  "3ds": 8,
} as const satisfies Record<string, number>;

/** Plateforme RAWG d'une de nos consoles, ou undefined (Virtual Boy, Switch 2). */
export function plateformeRawg(console: string): number | undefined {
  return (PLATEFORMES_RAWG as Record<string, number>)[console];
}

export const CAPTURES_MAX = 6;
const ADRESSE_RAWG = /^https:\/\/media\.rawg\.io\/media\/[A-Za-z0-9/_.-]+$/;

/** Noms de console qu'un titre RAWG porte parfois entre parenthèses : « 1080° Snowboarding (N64) ». */
const CONSOLES_SUFFIXE = new Set([
  "nes",
  "snes",
  "n64",
  "nintendo 64",
  "gc",
  "gcn",
  "gamecube",
  "wii",
  "wii u",
  "switch",
  "nintendo switch",
  "gb",
  "game boy",
  "gbc",
  "game boy color",
  "gba",
  "game boy advance",
  "ds",
  "nintendo ds",
  "3ds",
  "nintendo 3ds",
]);

export type JeuRawg = {
  id: number;
  slug: string;
  name: string;
  platforms?: { platform: { id: number } }[] | null;
};
export type CaptureRawg = {
  image: string;
  width?: number;
  height?: number;
  is_deleted?: boolean;
  hidden?: boolean;
};
export type Capture = {
  position: number;
  url: string;
  largeur: number | null;
  hauteur: number | null;
};

/** Minuscules, sans accents ni ponctuation, « & » lu « and ». */
export function simplifier(titre: string): string {
  return titre
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Forme comparable d'un titre : simplifié, sans « The » en tête et, côté RAWG, sans suffixe « (1989) » ou
 * « (N64) ». Rien d'autre n'est retiré (étude : un titre « contenu dans » un autre donnerait de faux jeux).
 */
export function comparable(titre: string): string {
  let t = titre.trim();
  const suffixe = /\s*\(([^()]*)\)\s*$/.exec(t);
  if (suffixe) {
    const dedans = simplifier(suffixe[1] ?? "");
    if (/^(19|20)\d\d$/.test(dedans) || CONSOLES_SUFFIXE.has(dedans))
      t = t.slice(0, suffixe.index);
  }
  return simplifier(t).replace(/^the /, "");
}

/** Premier jeu RAWG de la bonne plateforme dont le titre comparable est celui d'un de nos titres, sinon null. */
export function rapprocher(
  titres: readonly string[],
  resultats: readonly JeuRawg[],
  plateforme: number,
): JeuRawg | null {
  const voulus = new Set(titres.map(comparable).filter(Boolean));
  for (const jeu of resultats) {
    const surLaConsole = (jeu.platforms ?? []).some(
      (p) => p.platform.id === plateforme,
    );
    if (surLaConsole && voulus.has(comparable(jeu.name))) return jeu;
  }
  return null;
}

/** Captures visibles, adresses RAWG seulement (la base refuse les autres), 6 au plus, numérotées de 1 à 6. */
export function choisirCaptures(resultats: readonly CaptureRawg[]): Capture[] {
  return resultats
    .filter((c) => !c.is_deleted && !c.hidden && ADRESSE_RAWG.test(c.image))
    .slice(0, CAPTURES_MAX)
    .map((c, i) => ({
      position: i + 1,
      url: c.image,
      largeur: c.width || null,
      hauteur: c.height || null,
    }));
}

/** Version réduite par RAWG (largeur 640 pour le carrousel, 1280 pour l'agrandissement). */
export function adresseReduite(url: string, largeur: 640 | 1280): string {
  return url.replace(
    "https://media.rawg.io/media/",
    `https://media.rawg.io/media/resize/${largeur}/-/`,
  );
}

/** Lien « Captures : RAWG » vers la page du jeu. */
export function lienRawg(slug: string): string {
  return `https://rawg.io/games/${slug}`;
}
