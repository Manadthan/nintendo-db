"use client";

import { useSyncExternalStore } from "react";
import { clientSiSession } from "@/lib/supabase/navigateur";

/**
 * Connecté ou non, vu depuis le navigateur (icône de compte de l'en-tête, US-09) : les pages publiques sont
 * préparées à l'avance (ADR-02), la session se lit donc ici, une fois par page. `null` tant qu'elle n'est pas connue.
 * Lecture locale du cookie de session : aucun appel réseau ; sans cookie, la bibliothèque Supabase n'est même pas
 * téléchargée (audit de performance).
 */
let connecte: boolean | null = null;
let lue = false;
const abonnes = new Set<() => void>();

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  if (!lue) {
    lue = true;
    void clientSiSession()
      .then(async (client) =>
        client ? !!(await client.auth.getSession()).data.session : false,
      )
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
