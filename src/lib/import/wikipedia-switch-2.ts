import * as cheerio from "cheerio";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { JeuAImporter, JeuEcarte } from "./physique";
import {
  joindreListe,
  lireDate,
  slugifier,
  texte,
  type SortieWikipedia,
} from "./wikipedia";

/**
 * Liste Switch 2 lue sur Wikipédia (étape 10, SPEC v1.11, DESIGN v1.4 §1 quater) : GameTDB n'a pas de base Switch 2.
 * Une seule date pour le monde entier, ni code produit ni jaquette (photos ajoutées à la main, US-12). La liste ne
 * distingue pas boîte et téléchargement : le propriétaire décoche « en boîte » dans l'aperçu (exclusions).
 */
export type ListeSwitch2 = {
  jeux: JeuAImporter[];
  /** Jeux d'autres éditeurs (nombre seulement). */
  autresEditeurs: number;
  /** Jeux Nintendo pas encore sortis au jour près (« 2027 », « Q2 2027 », « TBA ») : ignorés, avec la date annoncée. */
  ecartes: JeuEcarte[];
};

/** Repère les colonnes par leurs en-têtes (R6) : Title, Developer(s), Publisher(s), Release date. */
function colonnes(entetes: string[]) {
  const index = (nom: string) => {
    const i = entetes.indexOf(nom);
    if (i < 0)
      throw new Error(
        `Tableau Wikipédia Switch 2 de forme inattendue : colonne « ${nom} » introuvable`,
      );
    return i;
  };
  return {
    titre: index("Title"),
    developpeur: index("Developer(s)"),
    editeur: index("Publisher(s)"),
    date: index("Release date"),
  };
}

/** Date au jour près, ou null : seule une date précise dit qu'un jeu est sorti (ou le sortira à coup sûr). */
function dateAuJour(t: string) {
  try {
    const date = lireDate(t);
    return date?.precision === "jour" ? date : null;
  } catch {
    return null; // « Q2 2027 », « TBA »… : pas encore annoncé au jour près
  }
}

export function lireListeSwitch2(html: string): ListeSwitch2 {
  const $ = cheerio.load(html);
  const table = $("table.wikitable").first();
  if (!table.length)
    throw new Error("Tableau des jeux introuvable dans la page Wikipédia");
  const lignes = table.find("tr");
  const col = colonnes(
    lignes
      .eq(0)
      .children("th")
      .toArray()
      .map((th) => texte($, $(th))),
  );

  const liste: ListeSwitch2 = { jeux: [], autresEditeurs: 0, ecartes: [] };
  const slugs = new Set<string>();
  lignes.slice(1).each((_, tr) => {
    const cellules = $(tr).children("th, td");
    if (cellules.length < 4) return;
    const cellule = (i: number) => cellules.eq(i);
    const editeur = joindreListe($, cellule(col.editeur));
    if (!editeur || !/\bNintendo\b/.test(editeur)) {
      liste.autresEditeurs++;
      return;
    }
    const titre =
      texte($, cellule(col.titre).find("i").first()) ||
      texte($, cellule(col.titre));
    const annoncee = texte($, cellule(col.date));
    const date = dateAuJour(annoncee);
    if (!date) {
      liste.ecartes.push({
        titre,
        raison: `à venir (date annoncée : ${annoncee || "aucune"})`,
      });
      return;
    }
    const slug = slugifier(titre);
    if (slugs.has(slug)) return;
    slugs.add(slug);
    const lien = cellule(col.titre)
      .find("a[href*='/wiki/']")
      .first()
      .attr("href");
    const sortie: SortieWikipedia = { ...date, editeur };
    liste.jeux.push({
      slug,
      titres: { US: titre, PAL: titre },
      developpeur: joindreListe($, cellule(col.developpeur)),
      wikipediaUrl: lien ? lien.replace(/#.*$/, "") : null,
      // Sortie mondiale : même date dans les 3 régions (SPEC v1.11).
      sorties: Object.fromEntries(REGIONS.map((r) => [r, sortie])) as Record<
        Region,
        SortieWikipedia
      >,
      disques: {},
      japonais: null,
      genres: [],
    });
  });
  return liste;
}
