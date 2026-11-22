/**
 * Prix eBay (US-25, DESIGN ADR-17) : calculs purs, sans réseau. La route `/api/prix/…` interroge eBay et la BCE,
 * puis s'appuie sur ces fonctions pour trier les annonces, calculer la médiane en euros et construire les liens.
 * Règles reprises de l'étude du 22/11/2026 (DESIGN §1 quindecies).
 */
import { normaliser } from "@/lib/recherche/normaliser";
import type { Region } from "@/lib/catalogue/types";

/** En dessous, pas de prix : « Pas assez d'annonces (N) ». */
export const SEUIL_ANNONCES = 5;
/** Catégorie eBay « Video Games » : jeux seuls, sans consoles ni accessoires. */
export const CATEGORIE_JEUX = "139973";

export type Marche = "EBAY_US" | "EBAY_FR" | "EBAY_GB";
export type Devise = "EUR" | "USD" | "GBP";

/** Marchés interrogés par version : eBay Japon a fermé, la version JAP se cherche sur eBay US. */
export const MARCHES: Record<Region, Marche[]> = {
  JAP: ["EBAY_US"],
  US: ["EBAY_US"],
  PAL: ["EBAY_FR", "EBAY_GB"],
};

/** Nom de la console tel qu'on le tape dans eBay (slug de la table consoles). */
const NOMS_EBAY: Record<string, string> = {
  nes: "NES",
  snes: "Super Nintendo",
  n64: "Nintendo 64",
  gamecube: "GameCube",
  wii: "Wii",
  "wii-u": "Wii U",
  switch: "Switch",
  "switch-2": "Switch 2",
  gb: "Game Boy",
  gbc: "Game Boy Color",
  gba: "Game Boy Advance",
  vb: "Virtual Boy",
  ds: "DS",
  "3ds": "3DS",
};

const HORS_SUJET = [
  "lot",
  "bundle",
  "guide",
  "manual only",
  "manuel seul",
  "notice seule",
  "box only",
  "case only",
  "empty",
  "boite vide",
  "steelbook",
  "amiibo",
  "repro",
  "reproduction",
  "replacement",
  "console",
  "poster",
  "artwork",
  "insert",
];
const JAPON = [
  "jp",
  "jap",
  "japan",
  "japanese",
  "japon",
  "japonais",
  "ntsc j",
  "import",
];
const PAL = ["pal", "fr", "fra", "uk", "eur", "europe", "version francaise"];
/** Numéros de suite : « Super Mario Galaxy 2 » n'est pas « Super Mario Galaxy ». */
const SUITES = ["2", "3", "ii", "iii"];

/** Vrai si l'un des mots (ou groupes de mots) apparaît en entier dans le texte normalisé. */
const contient = (texte: string, mots: string[]) =>
  mots.some((m) => ` ${texte} `.includes(` ${m} `));

/** Mots significatifs du titre : plus de 2 lettres, ou avec un chiffre (« 2 », « 64 », « 3d »). */
export function motsDuTitre(titre: string): string[] {
  return normaliser(titre)
    .split(" ")
    .filter((m) => m.length > 2 || /\d/.test(m));
}

/** Texte cherché sur eBay : titre + console, et « japanese » pour la version JAP. */
export function requete(
  titre: string,
  console: string,
  region: Region,
): string {
  return [
    titre,
    NOMS_EBAY[console] ?? console,
    region === "JAP" ? "japanese" : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Annonce qui parle bien de ce jeu, dans cette version : tous les mots du titre, aucun numéro de suite absent du
 * titre, aucun mot d'un autre objet (lot, guide, boîte vide…) ; JAP : mention du Japon exigée ; US : aucune mention
 * du Japon ni de PAL ; PAL : aucune mention du Japon.
 */
export function estPertinente(
  titreAnnonce: string,
  titreJeu: string,
  region: Region,
): boolean {
  const t = normaliser(titreAnnonce);
  const mots = motsDuTitre(titreJeu);
  if (!mots.every((m) => contient(t, [m]))) return false;
  if (
    contient(
      t,
      SUITES.filter((n) => !mots.includes(n)),
    )
  )
    return false;
  if (contient(t, HORS_SUJET)) return false;
  if (region === "JAP") return contient(t, JAPON);
  if (region === "US") return !contient(t, JAPON) && !contient(t, PAL);
  return !contient(t, JAPON);
}

export function mediane(valeurs: number[]): number | null {
  if (!valeurs.length) return null;
  const t = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  const haut = t[m] ?? 0;
  return t.length % 2 ? haut : ((t[m - 1] ?? haut) + haut) / 2;
}

/** Taux de la BCE : 1 € = `taux[devise]` unités de la devise. */
export type Taux = Partial<Record<Devise, number>>;

/** Lit `eurofxref-daily.xml` de la BCE : `<Cube currency="USD" rate="1.0832"/>`. */
export function lireTauxBce(xml: string): Taux {
  const taux: Taux = { EUR: 1 };
  for (const [, devise, valeur] of xml.matchAll(
    /currency=['"](USD|GBP)['"]\s+rate=['"]([\d.]+)['"]/g,
  )) {
    taux[devise as Devise] = Number(valeur);
  }
  return taux;
}

/** Montant en euros ; null si la devise n'a pas de taux. */
export function enEuros(
  montant: number,
  devise: string,
  taux: Taux,
): number | null {
  const t = taux[devise as Devise];
  return t ? montant / t : null;
}

export type Annonce = { titre: string; prix: number; devise: string };

/** Annonces d'une réponse `item_summary/search` de la Browse API (champs manquants ignorés). */
export function lireAnnonces(reponse: unknown): Annonce[] {
  const items = (reponse as { itemSummaries?: unknown[] } | null)
    ?.itemSummaries;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const i = item as {
      title?: unknown;
      price?: { value?: unknown; currency?: unknown };
    };
    const prix = Number(i.price?.value);
    if (
      typeof i.title !== "string" ||
      !Number.isFinite(prix) ||
      typeof i.price?.currency !== "string"
    )
      return [];
    return [{ titre: i.title, prix, devise: i.price.currency }];
  });
}

export type PrixRegion =
  | {
      etat: "prix";
      euros: number;
      annonces: number;
      marches: Marche[];
      lien: string;
    }
  | { etat: "peu"; annonces: number; marches: Marche[]; lien: string };

/** Prix d'une version : annonces de tous ses marchés réunies, pertinentes seulement, médiane en euros arrondie. */
export function prixRegion(
  annonces: Annonce[],
  titreJeu: string,
  console: string,
  region: Region,
  taux: Taux,
): PrixRegion {
  const euros = annonces
    .filter((a) => estPertinente(a.titre, titreJeu, region))
    .map((a) => enEuros(a.prix, a.devise, taux))
    .filter((v): v is number => v !== null);
  const commun = {
    annonces: euros.length,
    marches: MARCHES[region],
    lien: lienVentes(titreJeu, console, region),
  };
  if (euros.length < SEUIL_ANNONCES) return { etat: "peu", ...commun };
  return { etat: "prix", euros: Math.round(mediane(euros)!), ...commun };
}

/** Recherche des objets vendus du jeu sur eBay : ebay.com pour JAP et US, ebay.fr pour PAL. */
export function lienVentes(
  titre: string,
  console: string,
  region: Region,
): string {
  const site =
    region === "PAL" ? "https://www.ebay.fr" : "https://www.ebay.com";
  const params = new URLSearchParams({
    _nkw: requete(titre, console, region),
    _sacat: CATEGORIE_JEUX,
    LH_Sold: "1",
    LH_Complete: "1",
  });
  return `${site}/sch/i.html?${params}`;
}
