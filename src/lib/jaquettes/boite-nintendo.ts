import sharp from "sharp";
import { aUnBoitier, GABARITS, zoneSansBoitier } from "./boitier";

/**
 * Photo du My Nintendo Store (import des annonces, US-33) → jaquette, ou null si ce n'est pas une boîte. Les photos
 * sont des carrés de 2000 px à fond transparent : la marge est retirée, puis le boîtier en plastique (SPEC v1.44),
 * avec le gabarit de gamecartdb (mêmes photos de Nintendo : bords mesurés le 26/11/2026 sur Metroid Ravenous et
 * Xenoblade Chronicles 3, droite 60 px et bas 52 px sur 1230 × 1990). Une image en largeur (visuel du jeu : Hyrule
 * Warriors, 26/11/2026) n'est pas une boîte : vignette neutre.
 */
export async function preparerBoiteNintendo(
  image: Buffer,
): Promise<Buffer | null> {
  const rognee = await sharp(image).trim().png().toBuffer();
  const { width, height } = await sharp(rognee).metadata();
  if (!width || !height || height < width * 1.3) return null;
  // Liseré clair d'un pixel au bord droit : ignoré pour reconnaître le boîtier.
  const { data, info } = await sharp(rognee)
    .extract({ left: 0, top: 0, width: width - 2, height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (!aUnBoitier(data, info.width, info.height)) return rognee;
  return sharp(rognee)
    .extract(zoneSansBoitier(width, height, GABARITS.gamecartdb))
    .png()
    .toBuffer();
}
