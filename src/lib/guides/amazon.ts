// Couvertures des guides copiées depuis Amazon Japon (SPEC v1.52 US-27, DESIGN ADR-19 point 2 révisé, 26/11/2026).
// Module pur, sans import : lu aussi par scripts/couvertures-amazon.mjs (Node sans alias « @/ »).

/** ISBN 10 d'un ISBN 13 en 978 (Amazon range ses images par ISBN 10) ; null pour un 979 ou un ISBN mal formé. */
export function isbn10(isbn13: string): string | null {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const neuf = isbn13.slice(3, 12);
  const somme = [...neuf].reduce((t, c, i) => t + Number(c) * (10 - i), 0);
  const cle = (11 - (somme % 11)) % 11;
  return neuf + (cle === 10 ? "X" : String(cle));
}

/** Couverture Amazon d'un ISBN, la plus grande taille donnée par ISBN (≈ 350 × 500, étude du 26/11). */
export function adresseCouvertureAmazon(isbn13: string): string | null {
  const i10 = isbn10(isbn13);
  return i10
    ? `https://images-na.ssl-images-amazon.com/images/P/${i10}.09.LZZZZZZZ.jpg`
    : null;
}

/** Page produit Amazon Japon d'un ISBN (secours quand l'ancien chemin /images/P/ renvoie 1 px sur les guides rétro). */
export function adressePageAmazon(isbn13: string): string | null {
  const i10 = isbn10(isbn13);
  return i10 ? `https://www.amazon.co.jp/dp/${i10}` : null;
}

/** Extrait l'URL de couverture haute résolution (`m.media-amazon.com/images/I/...`) depuis le HTML d'une fiche Amazon Japon. */
export function extraireCouverturePageAmazon(html: string): string | null {
  const brut =
    html.match(
      /id="(?:landingImage|imgBlkFront)"[^>]*data-a-dynamic-image="([^"]+)"/,
    )?.[1] ??
    html.match(
      /"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
    )?.[1] ??
    html.match(
      /data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
    )?.[1];
  if (!brut) return null;
  const decode = brut.replace(/&quot;/g, '"');
  let url: string | null = null;
  if (decode.startsWith("{")) {
    try {
      const carte = JSON.parse(decode) as Record<string, [number, number]>;
      let maxAire = -1;
      for (const [u, dims] of Object.entries(carte)) {
        const aire = Array.isArray(dims) ? (dims[0] ?? 0) * (dims[1] ?? 0) : 0;
        if (aire > maxAire) {
          maxAire = aire;
          url = u;
        }
      }
    } catch {
      return null;
    }
  } else {
    url = decode;
  }
  if (!url || !/^https:\/\/m\.media-amazon\.com\/images\/I\//.test(url)) {
    return null;
  }
  return url.replace(/\._[A-Z0-9,_]+_\.jpg$/i, ".jpg");
}

/** Amazon répond 200 avec une image d'1 px quand il n'a pas de couverture : seule une vraie image compte. */
export function estCouverture(taille: {
  width?: number;
  height?: number;
}): boolean {
  return (taille.width ?? 0) >= 100 && (taille.height ?? 0) >= 100;
}

/** Chemin de la copie dans le bucket `guides` : version suivante, pour qu'une nouvelle image change d'adresse (ADR-04). */
export function cheminCouverture(isbn: string, actuel: string | null): string {
  const version = Number(actuel?.match(/-(\d+)\.webp$/)?.[1] ?? 0) + 1;
  return `${isbn}-${version}.webp`;
}
