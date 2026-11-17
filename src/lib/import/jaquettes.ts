import sharp from "sharp";
import {
  TAILLES_JAQUETTE,
  type TailleJaquette,
} from "@/lib/jaquettes/stockage";

const POIDS_MAX = 5 * 1024 * 1024;

/**
 * Télécharge une image IGDB. Seule l'adresse https://images.igdb.com est acceptée : le serveur ne va jamais
 * chercher une image sur un site arbitraire (protection SSRF). Image de 5 Mo au plus.
 */
export async function telechargerImageIgdb(
  url: string,
  fetch: (url: string) => Promise<Response> = globalThis.fetch,
): Promise<Buffer> {
  const adresse = new URL(url);
  if (adresse.protocol !== "https:" || adresse.hostname !== "images.igdb.com") {
    throw new Error(
      `Adresse refusée : seules les images de https://images.igdb.com sont copiées (${url})`,
    );
  }
  const reponse = await fetch(url);
  if (!reponse.ok)
    throw new Error(`Image IGDB introuvable (HTTP ${reponse.status})`);
  if (!reponse.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("La réponse d'IGDB n'est pas une image");
  }
  const image = Buffer.from(await reponse.arrayBuffer());
  if (image.length > POIDS_MAX)
    throw new Error("Image IGDB trop lourde (5 Mo au plus)");
  return image;
}

/**
 * Ré-encode une jaquette en WebP 300 et 600 px de large (ADR-04) : jamais servie telle quelle, jamais agrandie,
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
