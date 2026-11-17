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

/** Disque édité par Nintendo : code éditeur 01 (fin de l'identifiant), ou éditeur « Nintendo ». */
export const estEditeNintendo = (id: string, editeur: string) =>
  id.slice(4, 6) === "01" || /nintendo/i.test(editeur);

export type DisqueRelais = { id: string; region: string };

/**
 * Base Wii réduite (≈ 300 Ko au lieu de 10 Mo, sous la limite du bucket) : seulement les disques du commerce des jeux
 * dont au moins une boîte est éditée par Nintendo (tous leurs disques, même ceux d'un autre éditeur : SPEC v1.9),
 * sans résumés ni empreintes ; le bloc `<genres>` (traductions françaises) est gardé.
 */
export function reduireBaseWii(xml: string): {
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
    if (!estDisqueWiiDuCommerce(champ("type"), id, region)) return;
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
 * Face avant d'un scan `coverfullHQ` (boîte dépliée : dos, tranche, face). Un boîtier Wii mesure 135 mm de large
 * par face et 14 mm de tranche : la face est la partie droite, sur 135/284 de la largeur totale. Sortie JPEG, sans
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
  const largeur = Math.round((width * 135) / 284);
  return image
    .extract({ left: width - largeur, top: 0, width: largeur, height })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
