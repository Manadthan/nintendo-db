import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { Rapprochement } from "./igdb";
import type { JeuWikipedia, ListeWikipedia } from "./wikipedia";

/** Une ligne de l'aperçu de l'import (US-10) : rien n'est écrit en base à ce stade. */
export type LigneApercu = {
  slug: string;
  titre: string;
  titres: { US: string; PAL: string };
  /** Jeu absent de la base → ajouter ; déjà présent (même adresse, ADR-06) → mettre à jour, jamais en double. */
  action: "ajouter" | "mettre-a-jour";
  regions: Record<Region, boolean>;
  /** Données lues sur Wikipédia, renvoyées telles quelles à l'enregistrement (#35). */
  wikipedia: JeuWikipedia;
};

export type Apercu = {
  lignes: LigneApercu[];
  ignores: Omit<ListeWikipedia, "jeux">;
};

export function preparerApercu(
  liste: ListeWikipedia,
  slugsEnBase: Set<string>,
): Apercu {
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
  };
}

export type Resume = {
  ajoutes: number;
  misAJour: number;
  ignores: number;
  aVerifier: number;
};

/** Résumé affiché en tête de l'aperçu ; « à vérifier » : rapprochement IGDB incertain ou introuvable (R1). */
export function resumer(
  apercu: Apercu,
  statuts: Partial<Record<string, Rapprochement["statut"]>>,
): Resume {
  return {
    ajoutes: apercu.lignes.filter((l) => l.action === "ajouter").length,
    misAJour: apercu.lignes.filter((l) => l.action === "mettre-a-jour").length,
    ignores:
      apercu.ignores.autresEditeurs + apercu.ignores.telechargeables.length,
    aVerifier: Object.values(statuts).filter((s) => s && s !== "sur").length,
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
  /** Régions sorties sans jaquette propre sur IGDB : jaquette principale en secours (R2). */
  secours: Region[];
  ecarts: string[];
  erreur?: string;
};

export type ResumeEnregistrement = {
  ajoutes: number;
  misAJour: number;
  erreurs: { titre: string; erreur: string }[];
  jaquettes: number;
  secours: string[];
  ecarts: string[];
};

/** Résumé de fin d'import, affiché et gardé dans import_runs (US-10). */
export function resumerEnregistrement(
  resultats: ResultatEnregistrement[],
): ResumeEnregistrement {
  return {
    ajoutes: resultats.filter((r) => r.statut === "ajoute").length,
    misAJour: resultats.filter((r) => r.statut === "mis-a-jour").length,
    erreurs: resultats
      .filter((r) => r.statut === "erreur")
      .map((r) => ({ titre: r.titre, erreur: r.erreur ?? "" })),
    jaquettes: resultats.reduce((n, r) => n + r.jaquettes, 0),
    secours: resultats.flatMap((r) =>
      r.secours.map((region) => `${r.titre} (${region})`),
    ),
    ecarts: resultats.flatMap((r) => r.ecarts.map((e) => `${r.titre} — ${e}`)),
  };
}
