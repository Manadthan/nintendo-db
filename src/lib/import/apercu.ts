import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { Comparaison } from "./donnees";
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
  /** Nouveau, modifié (avec les champs) ou inchangé par rapport à la base (import des nouveautés, SPEC v1.11). */
  etat: Comparaison["etat"];
  changements: string[];
  /** Données lues (Wikipédia, règle du physique de GameTDB), renvoyées telles quelles à l'enregistrement. */
  wikipedia: JeuAImporter;
};

export type Apercu = {
  lignes: LigneApercu[];
  ignores: Omit<ListeWikipedia, "jeux">;
  /** Jeux de la liste Wikipédia sans boîte Nintendo (SPEC v1.4). */
  ecartes: JeuEcarte[];
  /** Jeux pas encore sortis (toutes leurs dates connues sont futures) : ignorés, importés quand ils sortiront. */
  aVenir: string[];
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
  /** Jeux ajoutés à la main (US-11) : absents des sources, jamais supprimés par l'import. */
  manuels: Set<string> = new Set(),
  /** Date du jour (AAAA-MM-JJ), pour écarter les jeux à venir. */
  aujourdhui: string = new Date().toISOString().slice(0, 10),
): Apercu {
  const retenus = new Set(liste.jeux.map((j) => j.slug));
  const sortis = liste.jeux.filter((j) => !estAVenir(j, aujourdhui));
  return {
    lignes: sortis.map((j) => ({
      slug: j.slug,
      titre: j.titres.PAL || j.titres.US,
      titres: j.titres,
      action: slugsEnBase.has(j.slug) ? "mettre-a-jour" : "ajouter",
      // Sans comparaison détaillée (appliquerComparaisons), un jeu en base est supposé modifié.
      etat: slugsEnBase.has(j.slug) ? "modifie" : "nouveau",
      changements: [],
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
    aVenir: liste.jeux
      .filter((j) => estAVenir(j, aujourdhui))
      .map((j) => j.titres.PAL || j.titres.US),
    aSupprimer: [...slugsEnBase]
      .filter((s) => !retenus.has(s) && !manuels.has(s))
      .sort(),
  };
}

/**
 * Jeu pas encore sorti (SPEC v1.11) : au moins une date connue, et toutes postérieures à aujourd'hui. Une date
 * incomplète vaut son premier jour (« 2027 » = 01/01/2027). Un jeu sans aucune date (GameTDB incomplet) est gardé.
 */
export function estAVenir(jeu: JeuAImporter, aujourdhui: string): boolean {
  const dates = REGIONS.map((r) => jeu.sorties[r]?.date).filter(
    (d): d is string => !!d,
  );
  return dates.length > 0 && dates.every((d) => d > aujourdhui);
}

/** Précise l'état de chaque ligne par la comparaison avec la base (ADR-03 point 6). */
export function appliquerComparaisons(
  apercu: Apercu,
  comparer: (ligne: LigneApercu) => Comparaison,
): Apercu {
  return {
    ...apercu,
    lignes: apercu.lignes.map((l) => ({ ...l, ...comparer(l) })),
  };
}

/** Lignes à enregistrer : nouvelles et modifiées, ou toutes (« Tout réenregistrer », recopie des jaquettes). */
export function lignesAEnregistrer(
  apercu: Apercu,
  tout: boolean,
): LigneApercu[] {
  return tout
    ? apercu.lignes
    : apercu.lignes.filter((l) => l.etat !== "inchange");
}

export type Resume = {
  ajoutes: number;
  misAJour: number;
  inchanges: number;
  ignores: number;
  aSupprimer: number;
};

/** Résumé affiché en tête de l'aperçu. */
export function resumer(apercu: Apercu): Resume {
  return {
    ajoutes: apercu.lignes.filter((l) => l.etat === "nouveau").length,
    misAJour: apercu.lignes.filter((l) => l.etat === "modifie").length,
    inchanges: apercu.lignes.filter((l) => l.etat === "inchange").length,
    ignores:
      apercu.ignores.autresEditeurs +
      apercu.ignores.telechargeables.length +
      apercu.ecartes.length +
      apercu.aVenir.length,
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
