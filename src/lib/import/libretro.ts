// Boîtes de libretro-thumbnails (étape 14, DESIGN v1.8 ADR-09) : noms No-Intro « Titre (Région) (…).png » du dossier
// Named_Boxarts d'un dépôt GitHub. Utilisé par le relais (Node, sans alias « @/ ») et par l'import : imports
// relatifs ou de paquets seulement.

type RegionSite = "JAP" | "US" | "PAL";

/** Dépôts libretro-thumbnails par console. */
export const DEPOTS_LIBRETRO: Record<string, string> = {
  n64: "Nintendo_-_Nintendo_64",
  gb: "Nintendo_-_Game_Boy",
  gbc: "Nintendo_-_Game_Boy_Color",
  gba: "Nintendo_-_Game_Boy_Advance",
};

/** Adresse d'une boîte (nom sans « .png ») dans le dépôt, sur raw.githubusercontent.com. */
export const adresseBoite = (depot: string, nom: string) =>
  `https://raw.githubusercontent.com/libretro-thumbnails/${depot}/master/Named_Boxarts/${encodeURIComponent(`${nom}.png`)}`;

/**
 * Lien Git du dépôt (#129, #143) : raw.githubusercontent.com sert alors le chemin de la cible (« Pokemon - Crystal
 * Version (USA).png »), pas une image. Rend le nom de la boîte visée (sans « .png »), ou null pour une vraie image.
 */
export function cibleDuLien(contenu: Uint8Array): string | null {
  if (contenu.length > 512) return null;
  const texte = new TextDecoder().decode(contenu).trim();
  const m = texte.match(/^(?:[^\n]*\/)?([^/\n]+)\.png$/);
  return m ? m[1]! : null;
}

/** Index des boîtes déposé par le relais : XML (seul format texte accepté par le bucket), un nom par élément. */
export function indexEnXml(noms: string[]): string {
  const echapper = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<boites>\n${noms
    .map((n) => `<b>${echapper(n)}</b>`)
    .join("\n")}\n</boites>\n`;
}

export function lireIndexXml(xml: string): string[] {
  return [...xml.matchAll(/<b>([^<]*)<\/b>/g)].map((m) =>
    m[1]!.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
  );
}

/**
 * Clé de rapprochement d'un titre : minuscules, sans accents ni ponctuation, « The » de tête ou « , The » retirés,
 * « & » = « and » (« Legend of Zelda, The - Ocarina of Time » = « The Legend of Zelda: Ocarina of Time »).
 */
export function cleTitre(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/,\s*the\b/g, " ")
    .replace(/^\s*the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Boîtes à écarter : prototypes, démos, rééditions Virtual Console ou GameCube, versions non officielles. */
const ECARTEES =
  /\((?:[^)]*\b(?:Beta|Proto|Demo|Sample|Kiosk|Virtual Console|Debug|GameCube|Wii U|Switch Online|Pirate|Unl|Aftermarket|Competition|Hack)\b[^)]*)\)/i;

/** Nom No-Intro écarté : prototype, démo, réédition, version non officielle, ou lien symbolique (#129). */
export const estEcartee = (nom: string) =>
  ECARTEES.test(nom) || /SymbolicLink/i.test(nom);

/** Régions No-Intro → régions du site ; priorité : la région exacte avant un pays de la même zone. */
const REGIONS_NOINTRO: Record<string, { regions: RegionSite[]; rang: number }> =
  {
    World: { regions: ["JAP", "US", "PAL"], rang: 1 },
    USA: { regions: ["US"], rang: 0 },
    Japan: { regions: ["JAP"], rang: 0 },
    Europe: { regions: ["PAL"], rang: 0 },
    UK: { regions: ["PAL"], rang: 2 },
    Australia: { regions: ["PAL"], rang: 3 },
    Germany: { regions: ["PAL"], rang: 4 },
    France: { regions: ["PAL"], rang: 4 },
  };

export type IndexBoites = Map<
  string,
  Partial<Record<RegionSite, { nom: string; rang: number }>>
>;

/** Index par titre : pour chaque titre, la meilleure boîte de chaque région (moins d'étiquettes, pas de révision). */
export function indexerBoites(noms: string[]): IndexBoites {
  const index: IndexBoites = new Map();
  for (const nom of noms) {
    // « … - SymbolicLink » : lien Git vers une autre boîte, servi comme un texte (son chemin), pas une image.
    if (estEcartee(nom)) continue;
    const m = nom.match(/^(.*?) \(([^)]+)\)(.*)$/);
    if (!m) continue;
    const zones = m[2]!.split(/,\s*/);
    const cle = cleTitre(m[1]!);
    const etiquettes = (m[3]!.match(/\(/g) ?? []).length;
    for (const zone of zones) {
      const z = REGIONS_NOINTRO[zone];
      if (!z) continue;
      // Une révision (« Rev 1 ») ou des langues en plus comptent peu : la région exacte d'abord, puis le nom le plus court.
      const rang = z.rang * 100 + (/\(Rev/.test(nom) ? 10 : 0) + etiquettes;
      const parRegion = index.get(cle) ?? {};
      for (const r of z.regions) {
        const deja = parRegion[r];
        if (!deja || rang < deja.rang) parRegion[r] = { nom, rang };
      }
      index.set(cle, parRegion);
    }
  }
  return index;
}

/**
 * Boîtes d'un jeu, par région sortie : titre américain pour les États-Unis, européen pour l'Europe, l'un ou l'autre
 * pour le Japon ; sinon, pour le Japon, le nom No-Intro de la cartouche japonaise retrouvée par sa série (« Zelda no
 * Densetsu - Mujura no Kamen (Japan) », étape 15, ADR-10).
 */
export function boitesDuJeu(
  index: IndexBoites,
  titres: { US: string; PAL: string },
  sorties: Record<RegionSite, boolean>,
  japonaise: string | null = null,
): Partial<Record<RegionSite, string>> {
  const pour = (titre: string) => index.get(cleTitre(titre)) ?? {};
  const us = pour(titres.US);
  const pal = pour(titres.PAL);
  const choix: Partial<Record<RegionSite, string>> = {};
  if (sorties.US && us.US) choix.US = us.US.nom;
  if (sorties.PAL && (pal.PAL ?? us.PAL)) choix.PAL = (pal.PAL ?? us.PAL)!.nom;
  const jap =
    us.JAP ??
    pal.JAP ??
    (japonaise ? pour(japonaise.replace(/ \(.*$/, "")).JAP : undefined);
  if (sorties.JAP && jap) choix.JAP = jap.nom;
  return choix;
}
