import { estCarteDuCommerce } from "./relais-portables";
import { estDisqueWiiDuCommerce } from "./relais-wii";

/**
 * Sources de l'import pour une console (étape 8, DESIGN v1.2 §8) : où le relais GameTDB a déposé la base et les
 * scans, comment reconnaître un disque du commerce, le préfixe des codes produit, et si une liste Wikipédia
 * s'ajoute à GameTDB.
 */
export type SourceConsole = {
  slug: string;
  /** Wii U : liste Wikipédia + GameTDB (ADR-03) ; Wii : GameTDB seul (SPEC v1.9). */
  wikipedia: boolean;
  /** Chemin de la base dans le bucket du relais. */
  base: string;
  /** Dossier des scans dans le bucket du relais. */
  scans: string;
  /**
   * Code produit = préfixe + 4 premiers caractères de l'identifiant (`WUP-P-ALZP`, `RVL-RMCP`, `NTR-A2DP`) ; préfixe
   * selon l'identifiant quand la console en a plusieurs (3DS : `CTR-P-`, New 3DS : `KTR-P-`).
   */
  prefixeCode: string | ((id: string) => string);
  /**
   * Disque ou carte en boîte du commerce, d'après les champs GameTDB `type`, `id`, `region`, le titre anglais et le
   * genre.
   */
  estDisque: (
    type: string,
    id: string,
    region: string,
    titre: string,
    genre: string,
  ) => boolean;
};

export const SOURCES_CONSOLES: Record<string, SourceConsole> = {
  "wii-u": {
    slug: "wii-u",
    wikipedia: true,
    base: "wiiutdb.xml",
    scans: "scans",
    prefixeCode: "WUP-P-",
    // Type « WiiU » = disque en boîte ; une boîte ne contenant qu'un code de téléchargement est écartée.
    estDisque: (type, _id, _region, titre) =>
      type === "WiiU" && !/\(download code\)/i.test(titre),
  },
  wii: {
    slug: "wii",
    wikipedia: false,
    base: "wii/wiitdb.xml",
    // Faces recoupées sans la bande blanche de la tranche (#87).
    scans: "wii/faces",
    prefixeCode: "RVL-",
    estDisque: (type, id, region) => estDisqueWiiDuCommerce(type, id, region),
  },
  // Étape 9 (DESIGN v1.3 §1 ter) : GameTDB seul, scans de la face (haute définition, sinon moyens).
  ds: {
    slug: "ds",
    wikipedia: false,
    base: "ds/dstdb.xml",
    scans: "ds/scans",
    prefixeCode: "NTR-",
    estDisque: (type, id, region, titre, genre) =>
      estCarteDuCommerce("ds", type, id, region, titre, genre),
  },
  "3ds": {
    slug: "3ds",
    wikipedia: false,
    base: "3ds/3dstdb.xml",
    scans: "3ds/scans",
    // Les cartes New 3DS (identifiant en C) portent KTR-P- (Xenoblade Chronicles 3D : KTR-P-CAFP).
    prefixeCode: (id) => (id.startsWith("C") ? "KTR-P-" : "CTR-P-"),
    estDisque: (type, id, region, titre, genre) =>
      estCarteDuCommerce("3ds", type, id, region, titre, genre),
  },
};

/** Sources d'une console ; erreur claire pour une console que l'import ne sait pas encore lire. */
export function sourceConsole(slug: string): SourceConsole {
  const source = SOURCES_CONSOLES[slug];
  if (!source) throw new Error(`Import non disponible pour « ${slug} »`);
  return source;
}
