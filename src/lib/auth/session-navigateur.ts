"use client";

import { useSyncExternalStore } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Connecté ou non, vu depuis le navigateur (icône de compte de l'en-tête, US-09) : les pages publiques sont
 * préparées à l'avance (ADR-02), la session se lit donc ici, une fois par page. `null` tant qu'elle n'est pas connue.
 * Lecture locale du cookie de session : aucun appel réseau.
 */
let connecte: boolean | null = null;
let lue = false;
const abonnes = new Set<() => void>();

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  if (!lue) {
    lue = true;
    void createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => !!data.session)
      .catch(() => false)
      .then((valeur) => {
        connecte = valeur;
        for (const r of abonnes) r();
      });
  }
  return () => abonnes.delete(rappel);
}

export function useConnecte(): boolean | null {
  return useSyncExternalStore(
    abonner,
    () => connecte,
    () => null,
  );
}
