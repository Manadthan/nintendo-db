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
  /** Code produit = préfixe + 4 premiers caractères de l'identifiant (`WUP-P-ALZP`, `RVL-RMCP`). */
  prefixeCode: string;
  /** Disque en boîte du commerce, d'après les champs GameTDB `type`, `id`, `region` et le titre anglais. */
  estDisque: (
    type: string,
    id: string,
    region: string,
    titre: string,
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
};

/** Sources d'une console ; erreur claire pour une console que l'import ne sait pas encore lire. */
export function sourceConsole(slug: string): SourceConsole {
  const source = SOURCES_CONSOLES[slug];
  if (!source) throw new Error(`Import non disponible pour « ${slug} »`);
  return source;
}
