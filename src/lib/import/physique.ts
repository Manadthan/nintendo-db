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
  /** Titre du disque japonais (GameTDB, #58) : en japonais, et sa forme romanisée ou anglaise. */
  japonais: { titre: string; romanise: string } | null;
  /** Genres du jeu (US-06) : réunion des genres de ses disques, déjà traduits. */
  genres: string[];
  /** N64, GBA (étape 14) : boîte libretro-thumbnails de chaque région, par son nom No-Intro. */
  boites?: Partial<Record<Region, string>>;
  /** N64, GBA (étape 15) : numéro de série No-Intro de chaque région, d'où le code produit (pas de scan GameTDB). */
  codes?: Partial<Record<Region, string>>;
  /** Game Boy Color (étape 17) : préfixe du code propre au jeu (« DMG- » Dual Mode, « CGB- »), avant celui de la console. */
  prefixeCode?: string;
  /** Super Nintendo (étape 20) : autres titres de la cellule Wikipédia (titres japonais), pour la boîte japonaise. */
  autresTitres?: string[];
};

/** Les disques d'une région peuvent donner des genres différents (Kirby : « plates-formes » en PAL seulement). */
const genresDuJeu = (g: JeuGameTdb): string[] => [
  ...new Set(REGIONS.flatMap((r) => g.disques[r]?.genres ?? [])),
];

const titreJaponais = (g: JeuGameTdb): JeuAImporter["japonais"] => {
  const d = g.disques.JAP;
  return d?.titreJaponais
    ? { titre: d.titreJaponais, romanise: d.titre }
    : null;
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
    jeux.push({
      ...wiki,
      sorties,
      disques: identifiants(g),
      japonais: titreJaponais(g),
      genres: genresDuJeu(g),
    });
  }

  // Le jeu sorti dans le plus de régions d'abord : une réédition au même titre (ressortie japonaise de New Super
  // Mario Bros., A85J) est écartée au profit du jeu d'origine (rééditions hors v1, intention décision 6 ; #95).
  const slugs = new Set(jeux.map((j) => j.slug));
  const parRegions = [...jeuxSansWikipedia(gametdb, bases)].sort(
    (a, b) => Object.keys(b.disques).length - Object.keys(a.disques).length,
  );
  for (const g of parRegions) {
    const premier = (g.disques.PAL ?? g.disques.US ?? g.disques.JAP)!;
    const titres = {
      US: g.disques.US?.titre ?? premier.titre,
      PAL: g.disques.PAL?.titre ?? premier.titre,
    };
    const slug = slugifier(titres.PAL);
    if (slugs.has(slug)) {
      ecartes.push({
        titre: titres.PAL,
        raison: `réédition ou variante d'un jeu déjà retenu (${premier.id})`,
      });
      continue;
    }
    slugs.add(slug);
    jeux.push({
      slug,
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
      japonais: titreJaponais(g),
      genres: genresDuJeu(g),
    });
  }
  return { jeux, ecartes };
}
