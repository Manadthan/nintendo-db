import { REGIONS, type Region } from "@/lib/catalogue/types";
import {
  indexerTitres,
  jeuxSansWikipedia,
  rapprocherGameTdb,
  type DisqueGameTdb,
  type JeuGameTdb,
} from "./gametdb";
import {
  slugifier,
  type JeuWikipedia,
  type SortieWikipedia,
} from "./wikipedia";

/** Un jeu à importer : données au format Wikipédia, et l'identifiant GameTDB du disque de chaque région sortie. */
export type JeuAImporter = JeuWikipedia & {
  disques: Partial<Record<Region, string>>;
};

/** Jeu de la liste Wikipédia écarté par la règle du physique (SPEC v1.4), avec la raison affichée. */
export type JeuEcarte = { titre: string; raison: string };

const sortieDuDisque = (d: DisqueGameTdb): SortieWikipedia => ({
  ...(d.date ?? { date: null, precision: null }),
  editeur: d.editeur,
});

const identifiants = (g: JeuGameTdb) =>
  Object.fromEntries(
    Object.entries(g.disques).map(([r, d]) => [r, d!.id]),
  ) as Partial<Record<Region, string>>;

/**
 * Règle du physique (SPEC v1.4, ADR-03 2 bis) : GameTDB tranche, car Wikipédia mélange boîte et téléchargement.
 * - un jeu Wikipédia est gardé s'il a au moins une boîte éditée par Nintendo ; ses régions sans boîte deviennent
 *   « non sorties » (dates de Wikipédia gardées pour les autres, celles de GameTDB à défaut) ;
 * - les boîtes Nintendo absentes de Wikipédia (compilations…) deviennent des jeux à part entière.
 */
export function appliquerGameTdb(
  wikipedia: JeuWikipedia[],
  gametdb: Map<string, JeuGameTdb>,
): { jeux: JeuAImporter[]; ecartes: JeuEcarte[] } {
  const index = indexerTitres(gametdb);
  const jeux: JeuAImporter[] = [];
  const ecartes: JeuEcarte[] = [];
  const bases = new Set<string>();

  for (const wiki of wikipedia) {
    const titre = wiki.titres.PAL || wiki.titres.US;
    const g = rapprocherGameTdb([wiki.titres.US, wiki.titres.PAL], index);
    if (!g) {
      ecartes.push({ titre, raison: "aucune boîte trouvée sur GameTDB" });
      continue;
    }
    bases.add(g.base);
    if (!g.nintendo) {
      ecartes.push({
        titre,
        raison: "boîtes éditées par un autre que Nintendo",
      });
      continue;
    }
    const sorties = Object.fromEntries(
      REGIONS.map((r) => {
        const d = g.disques[r];
        return [r, d ? (wiki.sorties[r] ?? sortieDuDisque(d)) : null];
      }),
    ) as Record<Region, SortieWikipedia>;
    jeux.push({ ...wiki, sorties, disques: identifiants(g) });
  }

  for (const g of jeuxSansWikipedia(gametdb, bases)) {
    const premier = (g.disques.PAL ?? g.disques.US ?? g.disques.JAP)!;
    const titres = {
      US: g.disques.US?.titre ?? premier.titre,
      PAL: g.disques.PAL?.titre ?? premier.titre,
    };
    jeux.push({
      slug: slugifier(titres.PAL),
      titres,
      developpeur: premier.developpeur,
      wikipediaUrl: null,
      sorties: Object.fromEntries(
        REGIONS.map((r) => {
          const d = g.disques[r];
          return [r, d ? sortieDuDisque(d) : null];
        }),
      ) as Record<Region, SortieWikipedia>,
      disques: identifiants(g),
    });
  }
  return { jeux, ecartes };
}
