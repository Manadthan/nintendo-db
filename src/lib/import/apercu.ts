import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { JeuAImporter, JeuEcarte } from "./physique";
import type { ListeWikipedia } from "./wikipedia";

/** Une ligne de l'aperçu de l'import (US-10) : rien n'est écrit en base à ce stade. */
export type LigneApercu = {
  slug: string;
  titre: string;
  titres: { US: string; PAL: string };
  /** Jeu absent de la base → ajouter ; déjà présent (même adresse, ADR-06) → mettre à jour, jamais en double. */
  action: "ajouter" | "mettre-a-jour";
  regions: Record<Region, boolean>;
  /** Données lues (Wikipédia, règle du physique de GameTDB), renvoyées telles quelles à l'enregistrement. */
  wikipedia: JeuAImporter;
};

export type Apercu = {
  lignes: LigneApercu[];
  ignores: Omit<ListeWikipedia, "jeux">;
  /** Jeux de la liste Wikipédia sans boîte Nintendo (SPEC v1.4). */
  ecartes: JeuEcarte[];
  /** Jeux en base qui ne sont plus retenus : supprimés à l'enregistrement, après confirmation. */
  aSupprimer: string[];
};

/**
 * Aperçu (US-10) : jeux retenus par la règle du physique, à ajouter ou à mettre à jour ; jeux en base qui ne
 * sont plus retenus. N'écrit rien.
 */
export function preparerApercu(
  liste: Omit<ListeWikipedia, "jeux"> & {
    jeux: JeuAImporter[];
    ecartes: JeuEcarte[];
  },
  slugsEnBase: Set<string>,
): Apercu {
  const retenus = new Set(liste.jeux.map((j) => j.slug));
  return {
    lignes: liste.jeux.map((j) => ({
      slug: j.slug,
      titre: j.titres.PAL || j.titres.US,
      titres: j.titres,
      action: slugsEnBase.has(j.slug) ? "mettre-a-jour" : "ajouter",
      regions: Object.fromEntries(
        REGIONS.map((r) => [r, j.sorties[r] !== null]),
      ) as Record<Region, boolean>,
      wikipedia: j,
    })),
    ignores: {
      autresEditeurs: liste.autresEditeurs,
      telechargeables: liste.telechargeables,
    },
    ecartes: liste.ecartes,
    aSupprimer: [...slugsEnBase].filter((s) => !retenus.has(s)).sort(),
  };
}

export type Resume = {
  ajoutes: number;
  misAJour: number;
  ignores: number;
  aSupprimer: number;
};

/** Résumé affiché en tête de l'aperçu. */
export function resumer(apercu: Apercu): Resume {
  return {
    ajoutes: apercu.lignes.filter((l) => l.action === "ajouter").length,
    misAJour: apercu.lignes.filter((l) => l.action === "mettre-a-jour").length,
    ignores:
      apercu.ignores.autresEditeurs +
      apercu.ignores.telechargeables.length +
      apercu.ecartes.length,
    aSupprimer: apercu.aSupprimer.length,
  };
}

/** Lots pilotés par le navigateur (ADR-03) : chaque appel au serveur reste court (délais Vercel). */
export function decouperEnLots<T>(elements: T[], taille: number): T[][] {
  const lots: T[][] = [];
  for (let i = 0; i < elements.length; i += taille)
    lots.push(elements.slice(i, i + taille));
  return lots;
}

/** Résultat de l'enregistrement d'un jeu (#35). */
export type ResultatEnregistrement = {
  slug: string;
  titre: string;
  statut: "ajoute" | "mis-a-jour" | "erreur";
  jaquettes: number;
  /** Régions sorties sans scan de boîte GameTDB : ancienne image ou vignette neutre, à remplacer à la main (#42). */
  sansScan: Region[];
  ecarts: string[];
  erreur?: string;
};

export type ResumeEnregistrement = {
  ajoutes: number;
  misAJour: number;
  erreurs: { titre: string; erreur: string }[];
  jaquettes: number;
  sansScan: string[];
  ecarts: string[];
  /** Jeux en base supprimés car plus retenus (sans boîte Nintendo). */
  supprimes: string[];
};

/** Résumé de fin d'import, affiché et gardé dans import_runs (US-10). */
export function resumerEnregistrement(
  resultats: ResultatEnregistrement[],
  supprimes: string[] = [],
): ResumeEnregistrement {
  return {
    ajoutes: resultats.filter((r) => r.statut === "ajoute").length,
    misAJour: resultats.filter((r) => r.statut === "mis-a-jour").length,
    erreurs: resultats
      .filter((r) => r.statut === "erreur")
      .map((r) => ({ titre: r.titre, erreur: r.erreur ?? "" })),
    jaquettes: resultats.reduce((n, r) => n + r.jaquettes, 0),
    sansScan: resultats.flatMap((r) =>
      r.sansScan.map((region) => `${r.titre} (${region})`),
    ),
    ecarts: resultats.flatMap((r) => r.ecarts.map((e) => `${r.titre} — ${e}`)),
    supprimes,
  };
}
