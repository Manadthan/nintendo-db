import type { Region } from "@/lib/catalogue/types";
import { estCarteDuCommerce } from "./relais-portables";
import { estCartoucheSwitchDuCommerce } from "./relais-switch";
import {
  estDisqueGameCubeDuCommerce,
  estDisqueWiiDuCommerce,
} from "./relais-wii";
import { DEPOTS_LIBRETRO } from "./libretro";
import { FICHIERS_NOINTRO } from "./nointro";
import { lireListeCartouches } from "./wikipedia-cartouches";
import { lireListeSwitch2, type ListeSwitch2 } from "./wikipedia-switch-2";

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
  /** Dossier des scans dans le bucket du relais ; Switch : un dossier par région (une cartouche « ALL » a 3 boîtes). */
  scans: string | ((region: Region) => string);
  /** Garder les disques de genre « software » (GameCube : Pokémon Channel, étape 11). */
  garderLogiciels?: boolean;
  /** Caractères de l'identifiant communs aux disques d'un jeu (3 par défaut ; Switch : 4). */
  longueurBase?: number;
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
  /**
   * Console lue sur Wikipédia seul, sans GameTDB (Switch 2, étape 10) : lecteur de sa liste. L'aperçu propose alors
   * une case « en boîte » pour chaque nouveau jeu (la liste ne distingue pas boîte et téléchargement).
   */
  wikipediaSeul?: (html: string) => ListeSwitch2;
  /** Dépôt libretro-thumbnails des boîtes (N64, GBA : étape 14) ; index déposé par le relais dans `{slug}/libretro.xml`. */
  libretro?: string;
  /** Fichier No-Intro de libretro-database (N64, GBA : étape 15, ADR-10) : séries → codes produit, boîtes japonaises. */
  noIntro?: string;
};

/** Super Nintendo (étape 20) : SHVC- au Japon, SNS- aux États-Unis, SNSP- en Europe, selon la lettre de la série. */
export const prefixeSuperNintendo = (id: string) =>
  id.endsWith("J") ? "SHVC-" : id.endsWith("E") ? "SNS-" : "SNSP-";

/** NES (étape 21) : HVC- au Japon (Famicom), NES- ailleurs, selon la lettre de la série. */
export const prefixeNes = (id: string) => (id.endsWith("J") ? "HVC-" : "NES-");

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
  // Étape 11 (DESIGN v1.5 §1 quinquies) : GameTDB seul (base Wii avec la GameCube), faces découpées comme la Wii.
  gamecube: {
    slug: "gamecube",
    wikipedia: false,
    base: "gamecube/gctdb.xml",
    scans: "gamecube/faces",
    prefixeCode: "DOL-",
    garderLogiciels: true,
    estDisque: estDisqueGameCubeDuCommerce,
  },
  // Étape 10 (DESIGN v1.4 §1 quater) : GameTDB seul ; une cartouche « ALL » vaut pour les 3 régions, avec une
  // boîte (scan) propre à chaque région.
  switch: {
    slug: "switch",
    wikipedia: false,
    base: "switch/switchtdb.xml",
    scans: (region) => `switch/scans/${region}`,
    longueurBase: 4,
    prefixeCode: "HAC-P-",
    estDisque: estCartoucheSwitchDuCommerce,
  },
  // Étape 14 (DESIGN v1.8 ADR-09) : GameTDB ne couvre ni la N64 ni la GBA ; listes Wikipédia, toutes en boîte.
  // Étape 15 (ADR-10) : codes produit « NUS- » / « AGB- » + série No-Intro.
  ...Object.fromEntries(
    (
      [
        ["n64", "NUS-"],
        ["gba", "AGB-"],
        // Étape 17 (ADR-12) : « CGB- », ou « DMG- » pour une cartouche Dual Mode (préfixe porté par le jeu).
        ["gbc", "CGB-"],
        // Étape 18 : Game Boy, « DMG- » ; série No-Intro rare (cartouches d'avant 1996), codes surtout à la main.
        ["gb", "DMG-"],
        // Étape 19 : Virtual Boy, Japon et États-Unis seulement ; « VUE- ».
        ["vb", "VUE-"],
        // Étape 20 : Super Nintendo, préfixe selon la région de la série (rare : codes surtout à la main).
        ["snes", prefixeSuperNintendo],
        // Étape 21 : NES, HVC- au Japon, NES- ailleurs (série rare : codes surtout à la main).
        ["nes", prefixeNes],
      ] as const
    ).map(([slug, prefixeCode]) => [
      slug,
      {
        slug,
        wikipedia: true,
        base: "",
        scans: "",
        prefixeCode,
        estDisque: () => false,
        wikipediaSeul: lireListeCartouches,
        libretro: DEPOTS_LIBRETRO[slug],
        noIntro: FICHIERS_NOINTRO[slug],
      } satisfies SourceConsole,
    ]),
  ),
  // Étape 10 (DESIGN v1.4 §1 quater) : GameTDB n'a pas de base Switch 2 ; liste Wikipédia, jaquettes à la main.
  "switch-2": {
    slug: "switch-2",
    wikipedia: true,
    base: "",
    scans: "",
    prefixeCode: "",
    estDisque: () => false,
    wikipediaSeul: lireListeSwitch2,
  },
};

/** Sources d'une console ; erreur claire pour une console que l'import ne sait pas encore lire. */
export function sourceConsole(slug: string): SourceConsole {
  const source = SOURCES_CONSOLES[slug];
  if (!source) throw new Error(`Import non disponible pour « ${slug} »`);
  return source;
}
