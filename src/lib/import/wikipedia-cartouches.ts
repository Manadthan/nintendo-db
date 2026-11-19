import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { JeuAImporter, JeuEcarte } from "./physique";
import { lireDate, slugifier, type SortieWikipedia } from "./wikipedia";

/**
 * Listes Wikipédia des consoles à cartouches sans base GameTDB (étape 14, SPEC v1.18, DESIGN ADR-09) : « List of
 * Nintendo 64 games » et « List of Game Boy Advance games ». Toutes les cartouches sont vendues en boîte ; un jeu est
 * retenu si Nintendo l'édite dans au moins une région. Colonnes repérées par leurs en-têtes (R6), cellules fusionnées
 * (rowspan, colspan) dépliées.
 */
export type ListeCartouches = {
  jeux: JeuAImporter[];
  autresEditeurs: number;
  ecartes: JeuEcarte[];
};

/** Régions suivies et leurs étiquettes dans ces listes (« JP », « NA », « EU », « PAL », « WW » = partout). */
const ETIQUETTES: Record<string, Region[]> = {
  JP: ["JAP"],
  JAP: ["JAP"],
  NA: ["US"],
  US: ["US"],
  EU: ["PAL"],
  PAL: ["PAL"],
  WW: [...REGIONS],
};

const texte = ($: CheerioAPI, el: Cheerio<AnyNode>) =>
  el
    .text()
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Tableau → grille de cellules, cellules fusionnées recopiées dans chaque case qu'elles couvrent. */
function grille($: CheerioAPI, table: Cheerio<Element>): Element[][] {
  const lignes: Element[][] = [];
  table.find("tr").each((y, tr) => {
    lignes[y] ??= [];
    let x = 0;
    $(tr)
      .children("th, td")
      .each((_, cellule) => {
        while (lignes[y]![x]) x++;
        const larg = Number(cellule.attribs.colspan ?? 1) || 1;
        const haut = Number(cellule.attribs.rowspan ?? 1) || 1;
        for (let dy = 0; dy < haut; dy++)
          for (let dx = 0; dx < larg; dx++) {
            lignes[y + dy] ??= [];
            lignes[y + dy]![x + dx] = cellule;
          }
        x += larg;
      });
  });
  return lignes;
}

/** Première date lisible d'un texte (« July 17, 1998EUAugust 1998AU » → 17 juillet 1998), ou null. */
function premiereDate(t: string) {
  const m = t.match(
    /([A-Z][a-z]+ \d{1,2}, \d{4})|([A-Z][a-z]+ \d{4})|(?<!\d)(\d{4})(?!\d)/,
  );
  if (!m) return null;
  try {
    return lireDate(m[0]);
  } catch {
    return null;
  }
}

/**
 * Éditeur de chaque région : « Hudson Soft<sup>JP</sup><br>Nintendo<sup>WW</sup> » → JAP : Hudson Soft, US et PAL :
 * Nintendo (une étiquette précise l'emporte sur WW) ; sans étiquette, le même éditeur partout.
 */
function editeurs(
  $: CheerioAPI,
  cellule: Cheerio<AnyNode>,
): Record<Region, string | null> {
  const parRegion: Record<Region, string | null> = {
    JAP: null,
    US: null,
    PAL: null,
  };
  const morceaux = ($.html(cellule) ?? "")
    .replace(/^<t[dh][^>]*>|<\/t[dh]>$/g, "")
    // La page en direct écrit <br id="…"> : un attribut possible.
    .split(/<br\b[^>]*>/i)
    .map((m) => {
      const bout = cheerio.load(`<div>${m}</div>`);
      const etiquettes = bout("sup")
        .map((_, s) => bout(s).text().trim())
        .get()
        .flatMap((s) => s.split(/[,/\s]+/));
      bout("sup").remove();
      return { nom: texte(bout, bout("div")), etiquettes };
    })
    .filter((m) => m.nom);
  if (!morceaux.some((m) => m.etiquettes.length)) {
    const tous = morceaux.map((m) => m.nom).join(", ") || null;
    return { JAP: tous, US: tous, PAL: tous };
  }
  // Du plus général au plus précis : sans étiquette (toutes les régions), puis « WW », puis la région exacte.
  for (const m of morceaux)
    if (!m.etiquettes.length) for (const r of REGIONS) parRegion[r] = m.nom;
  for (const precis of [false, true])
    for (const m of morceaux)
      for (const e of m.etiquettes)
        if ((e === "WW") !== precis)
          for (const r of ETIQUETTES[e] ?? []) parRegion[r] = m.nom;
  return parRegion;
}

/** Dates GBA, toutes dans une cellule : « June 24, 2003 (NA) March 10, 2003 (EU) November 25, 2004 (JP) ». */
function datesEtiquetees(
  t: string,
): Partial<Record<Region, ReturnType<typeof lireDate>>> {
  const dates: Partial<Record<Region, ReturnType<typeof lireDate>>> = {};
  for (const m of t.matchAll(
    /([A-Z][a-z]+ \d{1,2}, \d{4}|[A-Z][a-z]+ \d{4}|\d{4})\s*\(([A-Z/, ]+)\)/g,
  )) {
    const date = premiereDate(m[1]!);
    for (const e of m[2]!.split(/[,/\s]+/))
      for (const r of ETIQUETTES[e] ?? []) dates[r] ??= date;
  }
  return dates;
}

export function lireListeCartouches(html: string): ListeCartouches {
  const $ = cheerio.load(html);
  // Clés de tri cachées (« 20030620030624June 24, 2003 ») et renvois aux références : jamais lus.
  $('[style*="display:none"], sup.reference').remove();
  const table = $("table.wikitable")
    .filter((_, t) => /Publisher/.test($(t).find("tr").first().text()))
    .first();
  if (!table.length)
    throw new Error("Tableau des jeux introuvable dans la page Wikipédia");

  const g = grille($, table);
  // En-tête sur 2 lignes (N64, GBA : « Release date » puis « Japan ») ou sur 1 (Game Boy Color : « JP », « NA »).
  const lignesEntete = g.findIndex((l) => l.some((c) => c.tagName === "td"));
  const nbEntete = Math.max(1, Math.min(2, lignesEntete));
  const entete = (x: number) => {
    const h = g[0]?.[x];
    const b = g[nbEntete - 1]?.[x];
    return [h ? texte($, $(h)) : "", b ? texte($, $(b)) : ""];
  };
  const largeur = Math.max(g[0]?.length ?? 0, g[nbEntete - 1]?.length ?? 0);
  const colonne = (haut: RegExp, bas?: RegExp) => {
    for (let x = 0; x < largeur; x++) {
      const [h, b] = entete(x);
      if (haut.test(h!) && (!bas || bas.test(b!))) return x;
    }
    return -1;
  };
  // Colonne de région « Oui / Non » : sous « Region(s) released » (GBA) ou seule (Game Boy Color).
  const colonneRegion = (bas: RegExp) =>
    nbEntete === 2 ? colonne(/^Region/, bas) : colonne(bas);
  const col = {
    titre: colonne(/^Title/),
    developpeur: colonne(/^Developer/),
    // Game Boy Color (étape 17, ADR-12) : cartouche noire jouable aussi sur Game Boy → code « DMG- ».
    dualMode: colonne(/^Dual Mode/),
    editeur: colonne(/^Publisher/),
    // N64 : une colonne de date par région ; GBA : une cellule de dates, et des colonnes « sorti » Oui / Non.
    dates: {
      JAP: colonne(/^Release date/, /^(Japan|JP)$/),
      US: colonne(/^Release date/, /^(North America|NA)$/),
      PAL: colonne(/^Release date/, /^(PAL|PAL region|Europe|EU\/PAL)$/),
    } as Record<Region, number>,
    dateUnique: colonne(
      /^(Release date|First released)/,
      /^(Release date|First released)/,
    ),
    sorties: {
      JAP: colonneRegion(/^JP$/),
      US: colonneRegion(/^NA$/),
      PAL: colonneRegion(/^(EU\/PAL|PAL|EU)$/),
    } as Record<Region, number>,
  };
  if (col.titre < 0 || col.editeur < 0 || col.developpeur < 0)
    throw new Error(
      "Tableau Wikipédia de forme inattendue : Title, Developer(s) ou Publisher(s) introuvable",
    );

  const liste: ListeCartouches = { jeux: [], autresEditeurs: 0, ecartes: [] };
  const slugs = new Set<string>();
  const vues = new Set<Element>();
  for (const ligne of g.slice(nbEntete)) {
    const cTitre = ligne[col.titre];
    // Une ligne dont le titre vient d'une cellule fusionnée au-dessus : même jeu, déjà lu.
    if (
      !cTitre ||
      vues.has(cTitre) ||
      cTitre.tagName !== ligne[col.titre]?.tagName
    )
      continue;
    vues.add(cTitre);
    const cell = (x: number) => (ligne[x] ? $(ligne[x]) : $("<td></td>"));
    const parRegion = editeurs($, cell(col.editeur));
    if (!REGIONS.some((r) => parRegion[r]?.includes("Nintendo"))) {
      liste.autresEditeurs++;
      continue;
    }
    const titre = texte($, $(cTitre).find("i").first()) || texte($, $(cTitre));
    const dates =
      col.dateUnique >= 0
        ? datesEtiquetees(texte($, cell(col.dateUnique)))
        : {};
    const sorties = Object.fromEntries(
      REGIONS.map((r) => {
        let date: ReturnType<typeof lireDate> = null;
        let sorti: boolean;
        if (col.dates[r] >= 0) {
          const t = texte($, cell(col.dates[r]));
          sorti = !!t && !/unreleased|^n\/a$|^—$/i.test(t);
          date = sorti ? premiereDate(t) : null;
        } else {
          const marque = ligne[col.sorties[r]]?.attribs["data-sort-value"];
          sorti = marque ? marque === "Yes" : !!dates[r];
          date = dates[r] ?? null;
        }
        const sortie: SortieWikipedia = sorti
          ? {
              ...(date ?? { date: null, precision: null }),
              editeur: parRegion[r],
            }
          : null;
        return [r, sortie];
      }),
    ) as Record<Region, SortieWikipedia>;
    if (!REGIONS.some((r) => sorties[r])) {
      liste.ecartes.push({
        titre,
        raison: "aucune sortie en Japon, Amérique du Nord ou Europe",
      });
      continue;
    }
    const slug = slugifier(titre);
    if (slugs.has(slug)) continue;
    slugs.add(slug);
    const lien = $(cTitre).find("a[href*='/wiki/']").first().attr("href");
    liste.jeux.push({
      slug,
      titres: { US: titre, PAL: titre },
      developpeur: texte($, cell(col.developpeur)) || null,
      wikipediaUrl: lien ? lien.replace(/#.*$/, "") : null,
      sorties,
      disques: {},
      japonais: null,
      genres: [],
      ...(col.dualMode >= 0 && {
        prefixeCode: /^Yes/i.test(texte($, cell(col.dualMode)))
          ? "DMG-"
          : "CGB-",
      }),
    });
  }
  return liste;
}
