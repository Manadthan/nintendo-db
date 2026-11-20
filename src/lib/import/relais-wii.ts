// Relais GameTDB, partie Wii (étape 8, DESIGN v1.2 §1 bis et §8) : utilisé par scripts/relais-gametdb.mjs (Node,
// sans alias « @/ ») et par l'import. Uniquement des imports relatifs ou de paquets.
import * as cheerio from "cheerio";
import sharp from "sharp";

/** Régions GameTDB suivies et langues des scans à essayer, dans l'ordre. */
export const LANGUES_SCAN_WII: Record<string, string[]> = {
  "NTSC-J": ["JA"],
  "NTSC-U": ["US", "EN"],
  PAL: ["EN", "FR", "DE"],
};

/**
 * Wii U : langues des scans à essayer, dans l'ordre. PAL : la boîte française (PEGI) d'abord ; l'anglaise de GameTDB
 * est souvent un scan allemand avec le grand logo USK (choix du propriétaire, 20/11/2026, SPEC v1.28).
 */
export const LANGUES_SCAN_WII_U: Record<string, string[]> = {
  "NTSC-J": ["JA"],
  "NTSC-U": ["US"],
  PAL: ["FR", "EN", "DE"],
};

/** Champs d'un jeu gardés dans la base réduite : ceux que lit l'import. */
const CHAMPS_GARDES = new Set([
  "id",
  "type",
  "region",
  "locale",
  "developer",
  "publisher",
  "date",
  "genre",
]);

/**
 * Disque Wii du commerce : type vide (pas « CUSTOM »), identifiant en R ou S (les disques système, de mise à jour
 * et les démos commencent autrement), région suivie.
 */
export function estDisqueWiiDuCommerce(
  type: string,
  id: string,
  region: string,
): boolean {
  return (
    type === "" && /^[RS][A-Z0-9]{5}$/.test(id) && region in LANGUES_SCAN_WII
  );
}

/**
 * Disque GameCube du commerce (étape 11, SPEC v1.13) : type `GameCube`, identifiant en G sans démo (« Interactive
 * Multi-Game Demo », genre « sampler »/« demo ») ; et deux compilations gardées par le propriétaire, identifiants en
 * P : The Legend of Zelda: Collector's Edition (PZL) et Pac-Man Vs. (PRJ). Démos en D et E, disques bonus en P,
 * Game Boy Player Start-Up Disc (U) : écartés.
 */
export function estDisqueGameCubeDuCommerce(
  type: string,
  id: string,
  region: string,
  titre: string,
  genre: string,
): boolean {
  if (type !== "GameCube" || !(region in LANGUES_SCAN_WII)) return false;
  if (/^P(ZL|RJ)[A-Z0-9]{3}$/.test(id)) return true;
  if (!/^G[A-Z0-9]{5}$/.test(id)) return false;
  const genres = genre
    .toLowerCase()
    .split(",")
    .map((g) => g.trim());
  return (
    !genres.includes("sampler") &&
    !genres.includes("demo") &&
    !/demo dis[ck]/i.test(titre)
  );
}

/** Disque édité par Nintendo : code éditeur 01 (fin de l'identifiant), ou éditeur « Nintendo ». */
export const estEditeNintendo = (id: string, editeur: string) =>
  id.slice(4, 6) === "01" || /nintendo/i.test(editeur);

export type DisqueRelais = { id: string; region: string };

/**
 * Base Wii réduite (≈ 300 Ko au lieu de 10 Mo, sous la limite du bucket) : seulement les disques du commerce des jeux
 * dont au moins une boîte est éditée par Nintendo (tous leurs disques, même ceux d'un autre éditeur : SPEC v1.9),
 * sans résumés ni empreintes ; le bloc `<genres>` (traductions françaises) est gardé.
 */
export function reduireBaseWii(
  xml: string,
  /** Disque à garder (Wii par défaut ; GameCube : étape 11), d'après type, identifiant, région, titre, genre. */
  estDisque: (
    type: string,
    id: string,
    region: string,
    titre: string,
    genre: string,
  ) => boolean = (type, id, region) => estDisqueWiiDuCommerce(type, id, region),
): {
  xml: string;
  disques: DisqueRelais[];
} {
  const $ = cheerio.load(xml, { xml: true });
  const parBase = new Map<
    string,
    { nintendo: boolean; disques: DisqueRelais[] }
  >();
  $("game").each((_, el) => {
    const jeu = $(el);
    const champ = (nom: string) => jeu.children(nom).first().text().trim();
    const id = champ("id");
    const region = champ("region");
    const titre = jeu.find("locale[lang=EN] > title").first().text().trim();
    if (!estDisque(champ("type"), id, region, titre, champ("genre"))) return;
    const base = parBase.get(id.slice(0, 3)) ?? {
      nintendo: false,
      disques: [],
    };
    base.nintendo ||= estEditeNintendo(id, champ("publisher"));
    base.disques.push({ id, region });
    parBase.set(id.slice(0, 3), base);
  });

  const gardes = new Set(
    [...parBase.values()]
      .filter((b) => b.nintendo)
      .flatMap((b) => b.disques.map((d) => d.id)),
  );
  $("game").each((_, el) => {
    const jeu = $(el);
    if (!gardes.has(jeu.children("id").first().text().trim())) {
      jeu.remove();
      return;
    }
    jeu.children().each((_, c) => {
      if (c.type === "tag" && !CHAMPS_GARDES.has(c.tagName)) $(c).remove();
    });
    jeu.find("locale").children(":not(title)").remove();
  });
  $("datafile").children(":not(game, WiiTDB, genres)").remove();
  $("genres loc:not([lang=FR])").remove();

  return {
    xml: $.xml().replace(/\n\s*\n/g, "\n"),
    disques: [...parBase.values()]
      .filter((b) => b.nintendo)
      .flatMap((b) => b.disques),
  };
}

/**
 * Petite image de la face (GameTDB `cover`, 160 × 224 PNG), repli de la GameCube quand la boîte dépliée n'existe pas
 * (surtout au Japon, SPEC v1.13) : convertie en JPEG comme les faces découpées.
 */
export async function versJpeg(image: Uint8Array): Promise<Buffer> {
  return sharp(image)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/** Part des lignes `[y0, y1)` où la luminosité saute (écart > 25) entre les colonnes x − 1 et x. */
function sautVertical(
  gris: Buffer,
  largeur: number,
  x: number,
  y0: number,
  y1: number,
): number {
  let sauts = 0;
  for (let y = y0; y < y1; y++)
    if (Math.abs(gris[y * largeur + x]! - gris[y * largeur + x - 1]!) > 25)
      sauts++;
  return sauts / (y1 - y0);
}

/** Colonne de [debut, fin] où l'image change le plus souvent, sur les lignes [y0, y1), et ce score. */
function meilleureLimite(
  gris: Buffer,
  largeur: number,
  debut: number,
  fin: number,
  y0: number,
  y1: number,
): { x: number; score: number } {
  let meilleure = { x: debut, score: -1 };
  for (let x = debut; x <= fin; x++) {
    const score = sautVertical(gris, largeur, x, y0, y1);
    if (score > meilleure.score) meilleure = { x, score };
  }
  return meilleure;
}

/** Une limite est nette quand l'image change sur au moins 40 % des lignes à cet endroit. */
const NETTE = 0.4;

/**
 * Première colonne de la face (#87). Mesure sur 44 vrais scans : la limite tranche–face est une colonne où l'image
 * change brusquement, entre x = 535 et 544 sur 1024, quelle que soit la couleur de la tranche. On la cherche sur
 * toute la hauteur, puis sur le quart haut et le quart bas : un scan penché donne deux limites, on garde la plus à
 * droite (aucune ligne ne commence par la tranche). Limite floue (blanc contre blanc) : repli prudent après la plus
 * grande limite observée.
 */
export function debutDeLaFace(
  gris: Buffer,
  largeur: number,
  hauteur: number,
): number {
  const echelle = (x: number) => Math.round((x * largeur) / 1024);
  const [debut, fin] = [echelle(528), echelle(556)];
  const quart = Math.round(hauteur / 4);
  const partout = meilleureLimite(gris, largeur, debut, fin, 0, hauteur);
  const haut = meilleureLimite(gris, largeur, debut, fin, 0, quart);
  const bas = meilleureLimite(
    gris,
    largeur,
    debut,
    fin,
    hauteur - quart,
    hauteur,
  );
  const net = (l: { score: number }) => l.score >= NETTE;
  if (net(partout)) {
    // Limite nette : le haut ou le bas ne la décalent que de quelques colonnes (léger penché), jamais au-delà
    // (un contour du dessin de la face n'est pas la tranche).
    const proches = [haut, bas].filter(
      (l) => net(l) && Math.abs(l.x - partout.x) <= echelle(6),
    );
    return Math.max(partout.x, ...proches.map((l) => l.x));
  }
  // Pas de limite nette sur toute la hauteur : scan penché si le haut et le bas en ont une, proches l'une de l'autre.
  if (net(haut) && net(bas) && Math.abs(haut.x - bas.x) <= echelle(8))
    return Math.max(haut.x, bas.x);
  return echelle(547);
}

/**
 * Face avant d'un scan `coverfullHQ` (boîte dépliée : dos, tranche, face) : tout ce qui est à droite de la limite
 * tranche–face (`debutDeLaFace`). La face d'un boîtier Wii fait 135 mm sur 284 de boîte dépliée. Sortie JPEG, sans
 * agrandissement.
 */
export async function decouperFaceAvant(scan: Uint8Array): Promise<Buffer> {
  const image = sharp(scan);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error("Scan illisible");
  if (width < height)
    throw new Error(
      `Scan inattendu : ${width} × ${height} (boîte dépliée attendue, plus large que haute)`,
    );
  const gris = await sharp(scan)
    .flatten({ background: "#ffffff" })
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const gauche = debutDeLaFace(gris, width, height);
  return image
    .extract({ left: gauche, top: 0, width: width - gauche, height })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
