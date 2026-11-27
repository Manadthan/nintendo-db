// Nettoyage et optimisation des images d'amiibo (détourage du fond blanc de Nintendo US / Europe, recadrage des marges
// vides et réglages WebP). Module pur, sans import : lu aussi par scripts/amiibo.mjs et scripts/amiibo-optimiser-images.mjs
// (Node sans alias « @/ »).

import type { TypeAmiibo } from "./amiibo";

/** Réglages WebP des images d'amiibo : effort maximal et alpha compressé (~23 % plus léger qu'alphaQuality 100). */
export const OPTIONS_WEBP_AMIIBO = {
  quality: 80,
  effort: 6,
  alphaQuality: 80,
} as const;

/** Seuil de `sharp.trim()` pour retirer les marges transparentes autour de la figurine. */
export const SEUIL_RECADRAGE = 10;

/** Les cartes amiibo ont un bord blanc légitime : on ne détoure que les figurines, peluches, bracelets et blocs. */
export function doitDetourer(type: TypeAmiibo): boolean {
  return type !== "carte";
}

function estPresqueBlanc(
  rgba: Uint8Array,
  indexPixel: number,
  minLum: number,
  maxSat: number,
): boolean {
  const o = indexPixel * 4;
  const a = rgba[o + 3] ?? 0;
  if (a < 16) return true;
  const r = rgba[o] ?? 0;
  const g = rgba[o + 1] ?? 0;
  const b = rgba[o + 2] ?? 0;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= minLum && max - min <= maxSat;
}

/**
 * L'image a-t-elle un fond blanc opaque ? Vrai si au moins 3 des 4 coins sont opaques (alpha >= 240) et presque blancs.
 * Sert de garde-fou : une image déjà transparente (AmiiboAPI) n'est jamais détourée.
 * `rgba` : 4 octets par pixel (R, V, B, A).
 */
export function aFondBlanc(
  rgba: Uint8Array,
  largeur: number,
  hauteur: number,
): boolean {
  if (largeur < 2 || hauteur < 2 || rgba.length < largeur * hauteur * 4)
    return false;
  const coins = [
    0,
    largeur - 1,
    (hauteur - 1) * largeur,
    largeur * hauteur - 1,
  ];
  let blancs = 0;
  for (const idx of coins) {
    const o = idx * 4;
    if ((rgba[o + 3] ?? 0) >= 240 && estPresqueBlanc(rgba, idx, 236, 18))
      blancs++;
  }
  return blancs >= 3;
}

/**
 * Retire le fond blanc d'une photo de figurine (RGBA brut, 4 octets/pixel) :
 * 1. remplissage par diffusion depuis les 4 bords sur les pixels presque blancs ;
 * 2. suppression des cavités intérieures fermées de fond studio (ex. entre les jambes et le socle) : zones composées à
 *    >= 70 % de blanc pur (>= 250) bordées par des pixels plus sombres (< 195), ce qui épargne les vêtements blancs ;
 * 3. décontamination douce sur 2 pixels de bordure contre le halo blanc, sans assombrir les blancs du sujet (ailes, gants).
 */
export function retirerFondBlanc(
  rgba: Uint8Array,
  largeur: number,
  hauteur: number,
): Uint8Array {
  const total = largeur * hauteur;
  const sortie = new Uint8Array(rgba);
  if (total === 0 || rgba.length < total * 4) return sortie;

  // 1. Diffusion depuis les 4 bords
  const fond = new Uint8Array(total);
  const file = new Int32Array(total);
  let tete = 0;
  let queue = 0;
  const empiler = (idx: number) => {
    if (!fond[idx] && estPresqueBlanc(sortie, idx, 236, 18)) {
      fond[idx] = 1;
      file[queue++] = idx;
    }
  };
  for (let x = 0; x < largeur; x++) {
    empiler(x);
    empiler((hauteur - 1) * largeur + x);
  }
  for (let y = 1; y < hauteur - 1; y++) {
    empiler(y * largeur);
    empiler(y * largeur + (largeur - 1));
  }
  while (tete < queue) {
    const cur = file[tete++]!;
    const x = cur % largeur;
    const y = (cur - x) / largeur;
    if (x > 0) empiler(cur - 1);
    if (x + 1 < largeur) empiler(cur + 1);
    if (y > 0) empiler(cur - largeur);
    if (y + 1 < hauteur) empiler(cur + largeur);
  }

  // 2. Cavités intérieures de fond blanc pur (entre jambes, bras, socle)
  const vu = new Uint8Array(total);
  const aireMin = Math.max(80, Math.round(total * 0.0001));
  for (let i = 0; i < total; i++) {
    if (fond[i] || vu[i] || !estPresqueBlanc(sortie, i, 236, 18)) continue;
    const comp = [i];
    vu[i] = 1;
    let ch = 0;
    let purs = 0;
    while (ch < comp.length) {
      const cur = comp[ch++]!;
      const x = cur % largeur;
      const y = (cur - x) / largeur;
      if (estPresqueBlanc(sortie, cur, 250, 8)) purs++;
      const voisins = [
        x > 0 ? cur - 1 : -1,
        x + 1 < largeur ? cur + 1 : -1,
        y > 0 ? cur - largeur : -1,
        y + 1 < hauteur ? cur + largeur : -1,
      ];
      for (const ni of voisins) {
        if (
          ni >= 0 &&
          !fond[ni] &&
          !vu[ni] &&
          estPresqueBlanc(sortie, ni, 236, 18)
        ) {
          vu[ni] = 1;
          comp.push(ni);
        }
      }
    }
    if (comp.length < aireMin || purs / comp.length < 0.7) continue;
    const dansComp = new Uint8Array(total);
    for (const idx of comp) dansComp[idx] = 1;
    let sommeBord = 0;
    let nbBord = 0;
    for (const idx of comp) {
      const x = idx % largeur;
      const y = (idx - x) / largeur;
      for (const [dx, dy] of [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= largeur || ny >= hauteur) continue;
        const ni = ny * largeur + nx;
        if (dansComp[ni] || fond[ni]) continue;
        const o = ni * 4;
        sommeBord +=
          ((sortie[o] ?? 0) + (sortie[o + 1] ?? 0) + (sortie[o + 2] ?? 0)) / 3;
        nbBord++;
      }
    }
    if (nbBord > 0 && sommeBord / nbBord < 195) {
      for (const idx of comp) fond[idx] = 1;
    }
  }

  for (let i = 0; i < total; i++) {
    if (fond[i]) sortie[i * 4 + 3] = 0;
  }

  // 3. Décontamination anti-halo sur les 2 anneaux de bordure
  const bord1 = new Uint8Array(total);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const i = y * largeur + x;
      if (fond[i]) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < largeur &&
          ny < hauteur &&
          fond[ny * largeur + nx]
        ) {
          bord1[i] = 1;
          break;
        }
      }
    }
  }
  const bord2 = new Uint8Array(total);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const i = y * largeur + x;
      if (fond[i] || bord1[i]) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < largeur &&
          ny < hauteur &&
          bord1[ny * largeur + nx]
        ) {
          bord2[i] = 1;
          break;
        }
      }
    }
  }

  const nettoyerAnneau = (anneau: Uint8Array, rayon: number) => {
    for (let y = 0; y < hauteur; y++) {
      for (let x = 0; x < largeur; x++) {
        const i = y * largeur + x;
        if (!anneau[i]) continue;
        const o = i * 4;
        const r = rgba[o] ?? 0;
        const g = rgba[o + 1] ?? 0;
        const b = rgba[o + 2] ?? 0;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let n = 0;
        for (let dy = -rayon; dy <= rayon; dy++) {
          for (let dx = -rayon; dx <= rayon; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= largeur || ny >= hauteur) continue;
            const ni = ny * largeur + nx;
            if (!fond[ni] && !bord1[ni] && !bord2[ni]) {
              const no = ni * 4;
              sr += rgba[no] ?? 0;
              sg += rgba[no + 1] ?? 0;
              sb += rgba[no + 2] ?? 0;
              n++;
            }
          }
        }
        if (n === 0) continue;
        const fr = sr / n;
        const fg = sg / n;
        const fb = sb / n;
        const distSujet = Math.hypot(255 - fr, 255 - fg, 255 - fb);
        // Sujet blanc (ailes, gants, robe) : ne jamais assombrir
        if (distSujet < 42) continue;
        const distPixel = Math.hypot(255 - r, 255 - g, 255 - b);
        if (distPixel >= distSujet * 0.96) continue;
        const alpha = Math.max(0, Math.min(1, distPixel / distSujet));
        if (alpha < 0.08) {
          sortie[o + 3] = 0;
        } else {
          const clamp = (v: number, ref: number, orig: number) =>
            Math.max(
              0,
              Math.min(
                255,
                Math.round(
                  Math.max(Math.min(ref, orig) - 10, Math.min(255, v)),
                ),
              ),
            );
          sortie[o] = clamp((r - (1 - alpha) * 255) / alpha, fr, r);
          sortie[o + 1] = clamp((g - (1 - alpha) * 255) / alpha, fg, g);
          sortie[o + 2] = clamp((b - (1 - alpha) * 255) / alpha, fb, b);
          sortie[o + 3] = Math.round(alpha * 255);
        }
      }
    }
  };

  nettoyerAnneau(bord1, 3);
  nettoyerAnneau(bord2, 2);
  return sortie;
}
