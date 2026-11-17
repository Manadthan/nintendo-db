/** Plus grand côté d'une photo envoyée (US-12) : assez pour la jaquette HD (768 px), léger à envoyer. */
export const COTE_MAX = 1600;

/** Dimensions réduites d'une photo, proportions gardées, jamais agrandie. */
export function dimensionsReduites(
  largeur: number,
  hauteur: number,
  coteMax = COTE_MAX,
): { largeur: number; hauteur: number } {
  const echelle = Math.min(1, coteMax / Math.max(largeur, hauteur));
  return {
    largeur: Math.round(largeur * echelle),
    hauteur: Math.round(hauteur * echelle),
  };
}

/**
 * Dans le navigateur : réduit une photo (souvent 12 Mpx sur iPhone) en JPEG de 1600 px au plus avant l'envoi,
 * pour rester loin de la limite de taille des requêtes de Vercel. Orientation de l'appareil photo respectée.
 */
export async function reduirePhoto(fichier: File): Promise<Blob> {
  const image = await createImageBitmap(fichier, {
    imageOrientation: "from-image",
  });
  const { largeur, hauteur } = dimensionsReduites(image.width, image.height);
  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext("2d")!.drawImage(image, 0, 0, largeur, hauteur);
  image.close();
  return new Promise((resoudre, rejeter) =>
    toile.toBlob(
      (blob) =>
        blob ? resoudre(blob) : rejeter(new Error("Photo illisible.")),
      "image/jpeg",
      0.88,
    ),
  );
}
