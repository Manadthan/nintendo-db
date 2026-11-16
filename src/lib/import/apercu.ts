import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { Rapprochement } from "./igdb";
import type { ListeWikipedia } from "./wikipedia";

/** Une ligne de l'aperçu de l'import (US-10) : rien n'est écrit en base à ce stade. */
export type LigneApercu = {
  slug: string;
  titre: string;
  titres: { US: string; PAL: string };
  /** Jeu absent de la base → ajouter ; déjà présent (même adresse, ADR-06) → mettre à jour, jamais en double. */
  action: "ajouter" | "mettre-a-jour";
  regions: Record<Region, boolean>;
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
