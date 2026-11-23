// Boîtier en plastique autour des jaquettes (choix du propriétaire, 23/11/2026) : les photos officielles de Nintendo
// (Switch) et toutes les jaquettes Switch 2 (gamecartdb, Nintendo Japon) montrent la boîte entière, boîtier gris clair
// ou rouge compris ; les scans de GameTDB, non. Pour un catalogue homogène, on ne garde que la jaquette.
// Pur et sans import : lu aussi par les scripts (scripts/jaquettes-sans-boitier.mjs, jaquettes-gamecartdb.mjs).

/** Épaisseur du boîtier sur chaque bord, en fraction de la largeur (gauche, droite) ou de la hauteur (haut, bas). */
export type Bords = {
  gauche: number;
  droite: number;
  haut: number;
  bas: number;
};

/**
 * Gabarits mesurés le 23/11/2026 sur les 102 jaquettes concernées (très réguliers d'une image à l'autre, un peu de
 * marge en plus). Côté droit plus épais : la charnière du boîtier. gamecartdb : boîtier vu sans bord gauche, sauf une
 * ombre d'un ou deux pixels.
 */
export const GABARITS = {
  nintendo: { gauche: 0.009, droite: 0.049, haut: 0.028, bas: 0.027 },
  gamecartdb: { gauche: 0.004, droite: 0.049, haut: 0.028, bas: 0.027 },
} as const satisfies Record<string, Bords>;

/** Gabarit d'une jaquette selon sa console et sa source ; null : jaquette jamais recadrée (scans, ajouts à la main). */
export function gabaritPour(
  console_: string,
  source: string | null,
): Bords | null {
  if (source === "gamecartdb" && console_ === "switch-2")
    return GABARITS.gamecartdb;
  if (
    source === "nintendo" &&
    (console_ === "switch" || console_ === "switch-2")
  )
    return GABARITS.nintendo;
  return null;
}

/** Rectangle à garder (pixels entiers, pour sharp.extract). */
export function zoneSansBoitier(
  largeur: number,
  hauteur: number,
  bords: Bords,
): { left: number; top: number; width: number; height: number } {
  const left = Math.round(largeur * bords.gauche);
  const top = Math.round(hauteur * bords.haut);
  const width = largeur - left - Math.round(largeur * bords.droite);
  const height = hauteur - top - Math.round(hauteur * bords.bas);
  return { left, top, width, height };
}

/**
 * Pixel du boîtier : gris clair ou blanc (plastique de la Switch), ou rouge terne (≈ 210, 42, 40) du boîtier de la
 * Switch 2. Le bandeau rouge de la jaquette Switch 2 (≈ 231, 0, 19) n'en est pas : vert et bleu presque nuls.
 */
export function estPixelDuBoitier(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (min > 150 && max - min < 30) return true;
  return r > 150 && g >= 22 && g < 75 && b >= 22 && b < 75 && r - g > 110;
}

/**
 * La jaquette a-t-elle encore son boîtier ? Image en portrait dont le bord droit (charnière, présente sur tous les
 * boîtiers) est fait, sur au moins 2 % de la largeur, de colonnes presque entièrement « boîtier ». Le bas ne compte
 * pas : une illustration blanche en bas (Paper Mario, Switch Sports Resort) y ressemble. Sert de garde-fou : une
 * image déjà recadrée (ou une jaquette plate) n'est pas recoupée. `pixels` : RVB brut, 3 octets par pixel.
 */
export function aUnBoitier(
  pixels: Uint8Array,
  largeur: number,
  hauteur: number,
): boolean {
  if (hauteur < largeur * 1.4) return false;
  const boitier = (x: number, y: number) => {
    const i = (y * largeur + x) * 3;
    return estPixelDuBoitier(
      pixels[i] ?? 0,
      pixels[i + 1] ?? 0,
      pixels[i + 2] ?? 0,
    );
  };
  const part = (n: number, total: number) => n / total > 0.9;
  const colonne = (x: number) => {
    let n = 0;
    const debut = Math.floor(hauteur * 0.15);
    const fin = Math.floor(hauteur * 0.85);
    for (let y = debut; y < fin; y++) if (boitier(x, y)) n++;
    return part(n, fin - debut);
  };
  let droite = 0;
  while (droite < largeur * 0.08 && colonne(largeur - 1 - droite)) droite++;
  return droite >= largeur * 0.02;
}
