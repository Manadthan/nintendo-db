import sharp from "sharp";
import {
  TAILLES_JAQUETTE,
  type TailleJaquette,
} from "@/lib/jaquettes/stockage";

/**
 * Ré-encode une jaquette en WebP 300, 600 et 768 px de large (ADR-04) : jamais servie telle quelle, jamais agrandie,
 * proportions gardées (pas de recadrage). Échoue si le fichier n'est pas une image.
 */
export async function convertirEnWebp(
  image: Buffer,
): Promise<Record<TailleJaquette, Buffer>> {
  const tailles = await Promise.all(
    TAILLES_JAQUETTE.map(async (largeur) => {
      const webp = await sharp(image, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: largeur, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return [largeur, webp] as const;
    }),
  );
  return Object.fromEntries(tailles) as Record<TailleJaquette, Buffer>;
}
