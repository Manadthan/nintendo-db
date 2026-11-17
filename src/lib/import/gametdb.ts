import * as cheerio from "cheerio";
import { strFromU8, unzipSync } from "fflate";
import type { PrecisionDate, Region } from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";

/** Base GameTDB de la Wii U (DESIGN ADR-03 2 bis) : archive téléchargée à chaque import. */
export const URL_BASE_GAMETDB = "https://www.gametdb.com/wiiutdb.zip?LANG=EN";

/** Un disque en boîte d'une région (type `WiiU` de GameTDB ; l'eShop et les boîtes à code sont écartés). */
export type DisqueGameTdb = {
  /** Identifiant du disque, ex. `ALZP01` : 3 caractères du jeu, la région, l'éditeur. */
  id: string;
  region: Region;
  titre: string;
  editeur: string;
  developpeur: string | null;
  date: { date: string; precision: PrecisionDate } | null;
};

const REGIONS_GAMETDB: Record<string, Region> = {
  "NTSC-J": "JAP",
  "NTSC-U": "US",
  PAL: "PAL",
};

/** Extrait le fichier XML de l'archive `wiiutdb.zip`. */
export function lireArchiveGameTdb(zip: Uint8Array): string {
  const fichiers = unzipSync(zip, { filter: (f) => f.name.endsWith(".xml") });
  const xml = Object.values(fichiers)[0];
  if (!xml) throw new Error("Base GameTDB : aucun fichier XML dans l'archive");
  return strFromU8(xml);
}

function lireDate(
  annee: string,
  mois: string,
  jour: string,
): DisqueGameTdb["date"] {
  const a = Number(annee);
  const m = Number(mois);
  const j = Number(jour);
  if (!a) return null;
  const deux = (n: number) => String(n).padStart(2, "0");
  if (!m) return { date: `${a}-01-01`, precision: "annee" };
  if (!j) return { date: `${a}-${deux(m)}-01`, precision: "mois" };
  return { date: `${a}-${deux(m)}-${deux(j)}`, precision: "jour" };
}

/**
 * Disques en boîte de la base GameTDB. Écartés : l'eShop et la Console virtuelle (type autre que `WiiU`), les
 * boîtes qui ne contiennent qu'un code de téléchargement, les régions non suivies (Corée, Russie…).
 */
export function lireGameTdb(xml: string): DisqueGameTdb[] {
  const $ = cheerio.load(xml, { xml: true });
  const disques: DisqueGameTdb[] = [];
  $("game").each((_, el) => {
    const jeu = $(el);
    const champ = (nom: string) => jeu.children(nom).first().text().trim();
    const region = REGIONS_GAMETDB[champ("region")];
    const titre = jeu.find("locale[lang=EN] > title").first().text().trim();
    if (champ("type") !== "WiiU" || !region || !titre) return;
    if (/\(download code\)/i.test(titre)) return;
    const date = jeu.children("date").first();
    disques.push({
      id: champ("id"),
      region,
      titre,
      editeur: champ("publisher"),
      developpeur: champ("developer") || null,
      date: lireDate(
        date.attr("year") ?? "",
        date.attr("month") ?? "",
        date.attr("day") ?? "",
      ),
    });
  });
  return disques;
}

/** Un jeu GameTDB : ses disques en boîte, au plus un par région, regroupés par les 3 premiers caractères. */
export type JeuGameTdb = {
  base: string;
  disques: Partial<Record<Region, DisqueGameTdb>>;
  /** Au moins une boîte éditée par Nintendo (SPEC v1.4, US-10). */
  nintendo: boolean;
};

const estNintendo = (d: DisqueGameTdb) =>
  d.id.slice(4, 6) === "01" || /nintendo/i.test(d.editeur);

/**
 * Regroupe les disques par jeu : les 3 premiers caractères de l'identifiant sont communs aux régions (`ALZE01`,
 * `ALZJ01`, `ALZP01`). La région se lit dans le champ `region` (un disque PAL peut finir en D, F…). Si une région
 * a plusieurs disques, celui de Nintendo est préféré.
 */
export function regrouperGameTdb(
  disques: DisqueGameTdb[],
): Map<string, JeuGameTdb> {
  const jeux = new Map<string, JeuGameTdb>();
  for (const d of disques) {
    const base = d.id.slice(0, 3);
    const jeu = jeux.get(base) ?? { base, disques: {}, nintendo: false };
    const deja = jeu.disques[d.region];
    if (!deja || (!estNintendo(deja) && estNintendo(d)))
      jeu.disques[d.region] = d;
    jeu.nintendo ||= estNintendo(d);
    jeux.set(base, jeu);
  }
  return jeux;
}

/** Index des titres normalisés (US ou PAL de Wikipédia ↔ titre anglais d'un disque) vers les jeux GameTDB. */
export function indexerTitres(
  jeux: Map<string, JeuGameTdb>,
): Map<string, JeuGameTdb> {
  const index = new Map<string, JeuGameTdb>();
  for (const jeu of jeux.values())
    for (const d of Object.values(jeu.disques))
      if (d && !index.has(normaliser(d.titre)))
        index.set(normaliser(d.titre), jeu);
  return index;
}

/** Le jeu GameTDB d'un jeu Wikipédia, par son titre US ou PAL (identique une fois normalisé), ou null. */
export function rapprocherGameTdb(
  titres: string[],
  index: Map<string, JeuGameTdb>,
): JeuGameTdb | null {
  for (const t of titres) {
    const jeu = index.get(normaliser(t));
    if (jeu) return jeu;
  }
  return null;
}

/**
 * Jeux en boîte de Nintendo que la liste Wikipédia n'a pas donnés (compilations comme NES Remix Pack, sorties
 * japonaises sous un autre titre…) : ils ont leur propre fiche (SPEC v1.4).
 */
export function jeuxSansWikipedia(
  jeux: Map<string, JeuGameTdb>,
  basesRapprochees: Set<string>,
): JeuGameTdb[] {
  return [...jeux.values()].filter(
    (j) => j.nintendo && !basesRapprochees.has(j.base),
  );
}

/** Code produit imprimé sur la boîte : `WUP-P-` + les 4 premiers caractères de l'identifiant (ALZP01 → WUP-P-ALZP). */
export function codeProduit(id: string): string {
  return `WUP-P-${id.slice(0, 4)}`;
}

/** Langues de scan essayées dans l'ordre (ADR-04) : les scans PAL sont rangés par langue. */
const LANGUES_SCAN: Record<Region, string[]> = {
  JAP: ["JA"],
  US: ["US"],
  PAL: ["EN", "FR", "DE"],
};

/** Adresses du scan de la boîte (768 × 1080), à essayer dans l'ordre jusqu'à en trouver une. */
export function urlsScan(disque: DisqueGameTdb): string[] {
  return LANGUES_SCAN[disque.region].map(
    (langue) =>
      `https://art.gametdb.com/wiiu/coverHQ/${langue}/${disque.id}.jpg`,
  );
}
