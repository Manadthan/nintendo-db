/**
 * Prix eBay d'un amiibo (US-29, ADR-21 point 6) : recherche « amiibo {nom} » sur les mêmes marchés que les jeux
 * (JAP et US sur eBay US, PAL sur eBay FR + UK), sans catégorie (les amiibo ne sont pas des « Video Games »), annonces
 * en cours, médiane en euros. Calculs purs ; l'accès au réseau est passé en paramètre (testé sans réseau).
 */
import type { TypeAmiibo } from "@/lib/amiibo/fiche";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";
import type { ReponsePrix, Sources } from "./calcul";
import {
  contient,
  JAPON,
  MARCHES,
  motsDuTitre,
  PAL,
  resumerPrix,
  SUITES,
} from "./prix";

/** Autres objets que l'amiibo seul : lots, copies, cartes NFC faites maison, boîte vide, socle… */
const HORS_SUJET = [
  "lot",
  "lots",
  "bundle",
  "set",
  "pack",
  "custom",
  "repro",
  "reproduction",
  "fake",
  "nfc card",
  "nfc cards",
  "nfc tag",
  "nfc tags",
  "coin",
  "coins",
  "box only",
  "empty box",
  "boite vide",
  "stand only",
  "display case",
  "case only",
  "sticker",
  "poster",
  "keychain",
];
const CARTE = ["card", "cards", "carte", "cartes"];

/** Texte cherché sur eBay : « amiibo » + nom, et « japanese » pour la version JAP. */
export function requeteAmiibo(nom: string, region: Region): string {
  return ["amiibo", nom, region === "JAP" ? "japanese" : null]
    .filter(Boolean)
    .join(" ");
}

/**
 * Annonce qui parle bien de cet amiibo : « amiibo » et tous les mots du nom, aucun numéro de suite absent du nom,
 * aucun autre objet ; une carte doit dire « card », une figurine ne le dit pas ; règles de région des jeux (JAP :
 * mention du Japon exigée ; US : ni Japon ni PAL ; PAL : pas de Japon).
 */
export function estAmiiboPertinent(
  titreAnnonce: string,
  nom: string,
  type: TypeAmiibo,
  region: Region,
): boolean {
  const t = normaliser(titreAnnonce);
  const mots = motsDuTitre(nom);
  if (!contient(t, ["amiibo"]) || !mots.every((m) => contient(t, [m])))
    return false;
  if (
    contient(
      t,
      SUITES.filter((n) => !mots.includes(n)),
    )
  )
    return false;
  if (contient(t, HORS_SUJET)) return false;
  if (type === "carte" ? !contient(t, CARTE) : contient(t, CARTE)) return false;
  if (region === "JAP") return contient(t, JAPON);
  if (region === "US") return !contient(t, JAPON) && !contient(t, PAL);
  return !contient(t, JAPON);
}

/** Recherche des objets vendus de l'amiibo : ebay.com pour JAP et US, ebay.fr pour PAL (toutes catégories). */
export function lienVentesAmiibo(nom: string, region: Region): string {
  const site =
    region === "PAL" ? "https://www.ebay.fr" : "https://www.ebay.com";
  const params = new URLSearchParams({
    _nkw: requeteAmiibo(nom, region),
    LH_Sold: "1",
    LH_Complete: "1",
  });
  return `${site}/sch/i.html?${params}`;
}

/** Ce qu'il faut savoir de l'amiibo : son nom (anglais, celui des annonces), son type, ses régions sorties. */
export type AmiiboPrix = {
  nom: string;
  /** Le type compte : une figurine n'est pas une carte (fausses cartes NFC très nombreuses). */
  type: TypeAmiibo;
  sorties: Record<Region, boolean>;
};

/** Au plus 4 recherches en parallèle, comme pour un jeu ; une erreur fait tout échouer (bloc masqué). */
export async function calculerPrixAmiibo(
  amiibo: AmiiboPrix,
  sources: Sources,
  maintenant = new Date(),
): Promise<ReponsePrix> {
  const versions = REGIONS.filter((r) => amiibo.sorties[r]);
  const [taux, ...annonces] = await Promise.all([
    sources.taux(),
    ...versions.map((region) =>
      Promise.all(
        MARCHES[region].map((m) =>
          sources.chercher(m, requeteAmiibo(amiibo.nom, region), null),
        ),
      ).then((l) => l.flat()),
    ),
  ]);
  const regions: ReponsePrix["regions"] = {};
  versions.forEach((region, i) => {
    regions[region] = resumerPrix(
      annonces[i] ?? [],
      (t) => estAmiiboPertinent(t, amiibo.nom, amiibo.type, region),
      region,
      taux,
      lienVentesAmiibo(amiibo.nom, region),
    );
  });
  return { regions, calculeLe: maintenant.toISOString() };
}
