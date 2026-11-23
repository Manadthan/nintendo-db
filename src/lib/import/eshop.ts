import sharp from "sharp";

/**
 * Visuel « Nintendo eShop » de GameTDB (23/11/2026) : pour certains jeux Switch, GameTDB donne à la place du scan de
 * la boîte un visuel générique (fond rouge, logo Switch en haut à gauche, bannière du jeu au milieu, « Nintendo
 * eShop » en bas). Ce n'est pas une jaquette : le relais ne le dépose pas, l'import ne le copie pas.
 *
 * Reconnaissance par empreinte : l'image réduite à 6 × 10 pixels, sans les lignes 2 à 5 (la bannière, propre à
 * chaque jeu), comparée à celle du visuel. Écart moyen mesuré sur les 2 760 jaquettes du site : 2,4 au plus pour
 * les 6 visuels eShop, 24 au moins pour les vraies boîtes (la plus proche : Daemon X Machina JAP, boîte rouge).
 */
const LARGEUR = 6;
const HAUTEUR = 10;
const BANNIERE = [2, 3, 4, 5];
const SEUIL = 10;

/** Empreinte du visuel eShop (scan GameTDB ALC7C, Dragon Quest XI S), lignes RVB hors bannière. */
// prettier-ignore
export const EMPREINTE_ESHOP = [
  248,65,70,209,15,28,190,0,15,192,0,16,192,0,16,192,0,16,
  209,15,27,198,3,15,193,0,13,194,0,14,193,0,13,192,0,15,
  191,0,15,190,0,15,193,1,16,192,1,13,191,0,14,191,0,16,
  195,10,25,200,29,43,199,25,40,198,23,37,199,27,41,194,8,24,
  193,6,21,195,13,28,195,11,26,195,11,27,195,13,28,193,5,21,
  192,0,16,192,0,15,192,0,15,192,0,15,192,0,15,192,0,16,
];

/** Écart moyen (0 à 255) entre des pixels RVB 6 × 10 et l'empreinte du visuel eShop. */
export function ecartEshop(pixels: Uint8Array): number {
  let somme = 0;
  let i = 0;
  for (let y = 0; y < HAUTEUR; y++) {
    if (BANNIERE.includes(y)) continue;
    for (let x = 0; x < LARGEUR * 3; x++)
      somme += Math.abs(
        (pixels[y * LARGEUR * 3 + x] ?? 0) - (EMPREINTE_ESHOP[i++] ?? 0),
      );
  }
  return somme / EMPREINTE_ESHOP.length;
}

/** L'image est-elle le visuel « Nintendo eShop » de GameTDB ? Faux si ce n'est pas une image. */
export async function estVisuelEshop(image: Buffer): Promise<boolean> {
  try {
    const pixels = await sharp(image)
      .resize(LARGEUR, HAUTEUR, { fit: "fill", kernel: "cubic" })
      .removeAlpha()
      .raw()
      .toBuffer();
    return ecartEshop(pixels) < SEUIL;
  } catch {
    return false;
  }
}
