import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import {
  REGIONS,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";

/**
 * Lecture du tableau « List of Wii U games » de Wikipédia anglais (import, ADR-03 point 1).
 * Page lue : https://en.wikipedia.org/w/index.php?title=List_of_Wii_U_games&action=render (CC BY-SA 4.0).
 */

export type DateLue = { date: string; precision: PrecisionDate };

/** Une sortie lue sur Wikipédia ; null pour une région où le jeu n'est pas sorti. */
export type SortieWikipedia = (DateLue & { editeur: string | null }) | null;

export type JeuWikipedia = {
  slug: string;
  /** Wikipédia anglais donne les titres nord-américain et européen ; le japonais viendra d'IGDB. */
  titres: { US: string; PAL: string };
  developpeur: string | null;
  wikipediaUrl: string | null;
  sorties: Record<Region, SortieWikipedia>;
};

const MOIS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const deux = (n: number) => String(n).padStart(2, "0");

/** « November 18, 2012 », « March 2013 », « 2013 » ; « Unreleased » ou vide → null (non sorti). */
export function lireDate(texte: string): DateLue | null {
  const t = texte.replace(/\s+/g, " ").trim();
  if (!t || /^unreleased$/i.test(t)) return null;

  let m = t.match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  if (m && MOIS.includes(m[1]!)) {
    return {
      date: `${m[3]}-${deux(MOIS.indexOf(m[1]!) + 1)}-${deux(Number(m[2]))}`,
      precision: "jour",
    };
  }
  m = t.match(/^([A-Z][a-z]+) (\d{4})$/);
  if (m && MOIS.includes(m[1]!))
    return {
      date: `${m[2]}-${deux(MOIS.indexOf(m[1]!) + 1)}-01`,
      precision: "mois",
    };
  m = t.match(/^(\d{4})$/);
  if (m) return { date: `${m[1]}-01-01`, precision: "annee" };

  // Jamais de date inventée (R6) : un format inconnu arrête l'import avec un message clair.
  throw new Error(`Date Wikipédia illisible : « ${t} »`);
}

/** Adresse stable tirée d'un titre (ADR-06) : minuscules, chiffres et tirets. */
export function slugifier(titre: string): string {
  return titre
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Étiquettes de région de la colonne « Publisher(s) » → nos régions (AU : Australasie, non suivie). */
const ETIQUETTES: Record<string, Region[]> = {
  JP: ["JAP"],
  NA: ["US"],
  PAL: ["PAL"],
  EU: ["PAL"],
  WW: [...REGIONS],
  AU: [],
};

const texte = ($: CheerioAPI, el: Cheerio<AnyNode>) =>
  el.text().replace(/\s+/g, " ").trim();

/** Liste « a, b » d'une cellule (listes à puces de Wikipédia ou texte simple). */
function liste($: CheerioAPI, cellule: Cheerio<AnyNode>): string | null {
  const items = cellule
    .find("li")
    .toArray()
    .map((li) => texte($, $(li)));
  const valeur = items.length ? items.join(", ") : texte($, cellule);
  return valeur || null;
}

/** Éditeur par région : « JP: Koei Tecmo · WW: Nintendo », ou un éditeur unique pour toutes les régions. */
function editeursParRegion(
  $: CheerioAPI,
  cellule: Cheerio<AnyNode>,
): Record<Region, string | null> {
  const editeurs: Record<Region, string | null> = {
    JAP: null,
    US: null,
    PAL: null,
  };
  const items = cellule
    .find("li")
    .toArray()
    .map((li) => texte($, $(li)));
  const etiquetes = items.map((i) =>
    i.match(/^([A-Z]{2,3}(?:\/[A-Z]{2,3})*)\s*:\s*(.+)$/),
  );

  if (items.length && etiquetes.every(Boolean)) {
    // « WW » (reste du monde) d'abord, puis les étiquettes précises (JP, NA…), qui l'emportent.
    const ordonnees = [...etiquetes].sort(
      (a, b) => Number(!a![1]!.includes("WW")) - Number(!b![1]!.includes("WW")),
    );
    for (const m of ordonnees) {
      for (const code of m![1]!.split("/"))
        for (const region of ETIQUETTES[code] ?? []) editeurs[region] = m![2]!;
    }
    return editeurs;
  }
  const unique = liste($, cellule);
  return { JAP: unique, US: unique, PAL: unique };
}

/** Titres de la cellule « Title » : un titre, ou « Titre NA » / « Titre PAL » quand ils diffèrent. */
function titres(
  $: CheerioAPI,
  cellule: Cheerio<AnyNode>,
): { US: string; PAL: string } {
  const parRegion: Partial<Record<"NA" | "PAL", string>> = {};
  cellule.find("i").each((_, i) => {
    const marque = $(i).next("sup").text().trim();
    if (marque === "NA" || marque === "PAL") parRegion[marque] = texte($, $(i));
  });
  const principal =
    texte($, cellule.find("i").first()) ||
    texte($, cellule).replace(/†/g, "").trim();
  return { US: parRegion.NA ?? principal, PAL: parRegion.PAL ?? principal };
}

/** Repère les colonnes par leurs en-têtes, pas par leur position (R6). */
function colonnes($: CheerioAPI, table: Cheerio<AnyNode>) {
  const lignes = table.find("tr");
  const haut = lignes
    .eq(0)
    .children("th")
    .toArray()
    .map((th) => texte($, $(th)));
  const bas = lignes
    .eq(1)
    .children("th")
    .toArray()
    .map((th) => texte($, $(th)));
  const index = (nom: string) => {
    const i = haut.findIndex((h) => h === nom);
    if (i < 0)
      throw new Error(
        `Tableau Wikipédia de forme inattendue : colonne « ${nom} » introuvable`,
      );
    return i;
  };
  const debutDates = index("Release date");
  const date = (nom: string) => {
    const i = bas.findIndex((b) => b.startsWith(nom));
    if (i < 0)
      throw new Error(
        `Tableau Wikipédia de forme inattendue : colonne de date « ${nom} » introuvable`,
      );
    return debutDates + i;
  };
  return {
    titre: index("Title"),
    developpeur: index("Developer(s)"),
    editeur: index("Publisher(s)"),
    dates: {
      JAP: date("Japan"),
      US: date("North America"),
      PAL: date("Europe"),
    } as Record<Region, number>,
    nombre: haut.length + bas.length - 1,
  };
}

/** Jeux en boîte (†) dont Nintendo est éditeur dans au moins une région (SPEC décision 1, US-10). */
export function lireListeWikipedia(html: string): JeuWikipedia[] {
  const $ = cheerio.load(html);
  const table = $("table.wikitable").first();
  if (!table.length)
    throw new Error("Tableau des jeux introuvable dans la page Wikipédia");
  const col = colonnes($, table);

  const jeux: JeuWikipedia[] = [];
  table
    .find("tr")
    .slice(2)
    .each((_, tr) => {
      const cellules = $(tr).children("th, td");
      if (cellules.length < col.nombre - 1) return; // ligne d'intertitre (A, B, C…)
      const cellule = (i: number) => cellules.eq(i);

      const enBoite = texte($, cellule(col.titre)).includes("†");
      const editeurs = editeursParRegion($, cellule(col.editeur));
      const sorties = Object.fromEntries(
        REGIONS.map((r) => {
          const date = lireDate(texte($, cellule(col.dates[r])));
          return [r, date ? { ...date, editeur: editeurs[r] } : null];
        }),
      ) as Record<Region, SortieWikipedia>;
      const nintendo = REGIONS.some((r) =>
        sorties[r]?.editeur?.includes("Nintendo"),
      );
      if (!enBoite || !nintendo) return;

      const t = titres($, cellule(col.titre));
      const lien = cellule(col.titre)
        .find("a[href*='/wiki/']")
        .first()
        .attr("href");
      jeux.push({
        slug: slugifier(t.PAL || t.US),
        titres: t,
        developpeur: liste($, cellule(col.developpeur)),
        wikipediaUrl: lien ? lien.replace(/#.*$/, "") : null,
        sorties,
      });
    });
  return jeux;
}
