"use client";

import { useSyncExternalStore } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { avecVersion, ensemble, type Version } from "./collection";

/**
 * Collection du propriétaire connecté, chargée dans le navigateur (DESIGN ADR-07) : les pages publiques restent
 * statiques ; sans session, aucun appel n'est fait et rien ne s'affiche. Un seul état partagé par toute la page.
 */
export type EtatCollection = {
  /** `null` tant que la session n'est pas connue (rien n'est affiché) ; `false` pour un visiteur. */
  connecte: boolean | null;
  possessions: ReadonlySet<string>;
  /** Message d'une écriture refusée ou impossible (réseau), affiché sur la page. */
  erreur: string | null;
};

const INITIAL: EtatCollection = {
  connecte: null,
  possessions: new Set(),
  erreur: null,
};
let etat = INITIAL;
let charge = false;
const abonnes = new Set<() => void>();

function changer(patch: Partial<EtatCollection>) {
  etat = { ...etat, ...patch };
  for (const rappel of abonnes) rappel();
}

async function charger() {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return changer({ connecte: false });
  const { data: lignes, error } = await supabase
    .from("possessions")
    .select("game_id, region");
  if (error) return changer({ connecte: true, erreur: "Collection illisible" });
  changer({ connecte: true, possessions: ensemble(lignes ?? []) });
}

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  if (!charge) {
    charge = true;
    void charger().catch(() => changer({ connecte: false }));
  }
  return () => abonnes.delete(rappel);
}

/** État de la collection pour un composant ; le premier abonné déclenche la lecture de la session. */
export function useCollection(): EtatCollection {
  return useSyncExternalStore(
    abonner,
    () => etat,
    () => INITIAL,
  );
}

/**
 * Coche ou décoche une version : affichée aussitôt, puis écrite dans la base (la RLS vérifie que la ligne est bien
 * celle du compte connecté). En cas d'échec, la case revient à son état précédent et un message s'affiche.
 */
export async function basculerVersion(version: Version, avoir: boolean) {
  const avant = etat.possessions;
  changer({ possessions: avecVersion(avant, version, avoir), erreur: null });
  const table = createSupabaseBrowserClient().from("possessions");
  const { error } = avoir
    ? await table.insert({ game_id: version.gameId, region: version.region })
    : await table
        .delete()
        .eq("game_id", version.gameId)
        .eq("region", version.region);
  // Une version déjà cochée (autre onglet) n'est pas une erreur.
  if (error && error.code !== "23505")
    changer({
      possessions: avant,
      erreur: "Collection non enregistrée, réessaie dans un instant",
    });
}
