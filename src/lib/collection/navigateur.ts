"use client";

import { useSyncExternalStore } from "react";
import { clientNavigateur, clientSiSession } from "@/lib/supabase/navigateur";
import {
  avecAmiibo,
  avecGuide,
  avecVersion,
  ensemble,
  type Version,
} from "./collection";

/**
 * Collection du propriétaire connecté, chargée dans le navigateur (DESIGN ADR-07) : les pages publiques restent
 * statiques ; sans session, aucun appel n'est fait et rien ne s'affiche. Un seul état partagé par toute la page.
 */
export type EtatCollection = {
  /** `null` tant que la session n'est pas connue (rien n'est affiché) ; `false` pour un visiteur. */
  connecte: boolean | null;
  possessions: ReadonlySet<string>;
  souhaits: ReadonlySet<string>;
  /** Message d'une écriture refusée ou impossible (réseau), affiché sur la page. */
  erreur: string | null;
};

const INITIAL: EtatCollection = {
  connecte: null,
  possessions: new Set(),
  souhaits: new Set(),
  erreur: null,
};
let etat = INITIAL;
let charge = false;
const abonnes = new Set<() => void>();

function changer(patch: Partial<EtatCollection>) {
  etat = { ...etat, ...patch };
  for (const rappel of abonnes) rappel();
}

function tableAbsente(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

async function charger() {
  // Sans cookie de session : visiteur, et la bibliothèque Supabase n'est pas téléchargée.
  const supabase = await clientSiSession();
  if (!supabase) return changer({ connecte: false });
  const { data } = await supabase.auth.getSession();
  if (!data.session) return changer({ connecte: false });
  // Possessions et souhaits (jeux, amiibo, guides), lus ensemble ; la RLS ne rend que les lignes du compte connecté.
  const [jeux, amiibo, guides, souhaitsJeux, souhaitsAmiibo, souhaitsGuides] =
    await Promise.all([
      supabase.from("possessions").select("game_id, region"),
      supabase.from("possessions_amiibo").select("amiibo_id"),
      supabase.from("possessions_guides").select("guide_id"),
      supabase.from("souhaits").select("game_id, region"),
      supabase.from("souhaits_amiibo").select("amiibo_id"),
      supabase.from("souhaits_guides").select("guide_id"),
    ]);
  const erreurSouhaits =
    (souhaitsJeux.error && !tableAbsente(souhaitsJeux.error)) ||
    (souhaitsAmiibo.error && !tableAbsente(souhaitsAmiibo.error)) ||
    (souhaitsGuides.error && !tableAbsente(souhaitsGuides.error));
  if (jeux.error || amiibo.error || guides.error || erreurSouhaits)
    return changer({ connecte: true, erreur: "Collection illisible" });
  changer({
    connecte: true,
    possessions: ensemble(
      jeux.data ?? [],
      amiibo.data ?? [],
      guides.data ?? [],
    ),
    souhaits: ensemble(
      souhaitsJeux.data ?? [],
      souhaitsAmiibo.data ?? [],
      souhaitsGuides.data ?? [],
    ),
  });
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
 * celle du compte connecté). Cocher retire automatiquement de la liste de souhaits. En cas d'échec, la case revient
 * à son état précédent et un message s'affiche.
 */
export async function basculerVersion(version: Version, avoir: boolean) {
  const avantPossessions = etat.possessions;
  const avantSouhaits = etat.souhaits;
  changer({
    possessions: avecVersion(avantPossessions, version, avoir),
    souhaits: avoir
      ? avecVersion(avantSouhaits, version, false)
      : avantSouhaits,
    erreur: null,
  });
  const table = (await clientNavigateur()).from("possessions");
  const { error } = avoir
    ? await table.insert({ game_id: version.gameId, region: version.region })
    : await table
        .delete()
        .eq("game_id", version.gameId)
        .eq("region", version.region);
  // Une version déjà cochée (autre onglet) n'est pas une erreur.
  if (error && error.code !== "23505")
    changer({
      possessions: avantPossessions,
      souhaits: avantSouhaits,
      erreur: "Collection non enregistrée, réessaie dans un instant",
    });
}

/** Coche ou décoche une version en liste de souhaits ; cocher retire automatiquement de « Je l'ai ». */
export async function basculerSouhaitVersion(
  version: Version,
  souhaiter: boolean,
) {
  const avantPossessions = etat.possessions;
  const avantSouhaits = etat.souhaits;
  changer({
    souhaits: avecVersion(avantSouhaits, version, souhaiter),
    possessions: souhaiter
      ? avecVersion(avantPossessions, version, false)
      : avantPossessions,
    erreur: null,
  });
  const table = (await clientNavigateur()).from("souhaits");
  const { error } = souhaiter
    ? await table.insert({ game_id: version.gameId, region: version.region })
    : await table
        .delete()
        .eq("game_id", version.gameId)
        .eq("region", version.region);
  if (error && error.code !== "23505")
    changer({
      possessions: avantPossessions,
      souhaits: avantSouhaits,
      erreur: "Liste de souhaits non enregistrée, réessaie dans un instant",
    });
}

/** Coche ou décoche un amiibo (US-30), comme une version : affiché aussitôt, rétabli si l'écriture échoue. */
export async function basculerAmiibo(amiiboId: string, avoir: boolean) {
  const avantPossessions = etat.possessions;
  const avantSouhaits = etat.souhaits;
  changer({
    possessions: avecAmiibo(avantPossessions, amiiboId, avoir),
    souhaits: avoir
      ? avecAmiibo(avantSouhaits, amiiboId, false)
      : avantSouhaits,
    erreur: null,
  });
  const table = (await clientNavigateur()).from("possessions_amiibo");
  const { error } = avoir
    ? await table.insert({ amiibo_id: amiiboId })
    : await table.delete().eq("amiibo_id", amiiboId);
  if (error && error.code !== "23505")
    changer({
      possessions: avantPossessions,
      souhaits: avantSouhaits,
      erreur: "Collection non enregistrée, réessaie dans un instant",
    });
}

/** Coche ou décoche un amiibo en liste de souhaits ; cocher retire automatiquement de « Je l'ai ». */
export async function basculerSouhaitAmiibo(
  amiiboId: string,
  souhaiter: boolean,
) {
  const avantPossessions = etat.possessions;
  const avantSouhaits = etat.souhaits;
  changer({
    souhaits: avecAmiibo(avantSouhaits, amiiboId, souhaiter),
    possessions: souhaiter
      ? avecAmiibo(avantPossessions, amiiboId, false)
      : avantPossessions,
    erreur: null,
  });
  const table = (await clientNavigateur()).from("souhaits_amiibo");
  const { error } = souhaiter
    ? await table.insert({ amiibo_id: amiiboId })
    : await table.delete().eq("amiibo_id", amiiboId);
  if (error && error.code !== "23505")
    changer({
      possessions: avantPossessions,
      souhaits: avantSouhaits,
      erreur: "Liste de souhaits non enregistrée, réessaie dans un instant",
    });
}

/** Coche ou décoche un guide, comme un amiibo : affiché aussitôt, rétabli si l'écriture échoue. */
export async function basculerGuide(guideId: string, avoir: boolean) {
  const avantPossessions = etat.possessions;
  const avantSouhaits = etat.souhaits;
  changer({
    possessions: avecGuide(avantPossessions, guideId, avoir),
    souhaits: avoir ? avecGuide(avantSouhaits, guideId, false) : avantSouhaits,
    erreur: null,
  });
  const table = (await clientNavigateur()).from("possessions_guides");
  const { error } = avoir
    ? await table.insert({ guide_id: guideId })
    : await table.delete().eq("guide_id", guideId);
  if (error && error.code !== "23505")
    changer({
      possessions: avantPossessions,
      souhaits: avantSouhaits,
      erreur: "Collection non enregistrée, réessaie dans un instant",
    });
}

/** Coche ou décoche un guide en liste de souhaits ; cocher retire automatiquement de « Je l'ai ». */
export async function basculerSouhaitGuide(
  guideId: string,
  souhaiter: boolean,
) {
  const avantPossessions = etat.possessions;
  const avantSouhaits = etat.souhaits;
  changer({
    souhaits: avecGuide(avantSouhaits, guideId, souhaiter),
    possessions: souhaiter
      ? avecGuide(avantPossessions, guideId, false)
      : avantPossessions,
    erreur: null,
  });
  const table = (await clientNavigateur()).from("souhaits_guides");
  const { error } = souhaiter
    ? await table.insert({ guide_id: guideId })
    : await table.delete().eq("guide_id", guideId);
  if (error && error.code !== "23505")
    changer({
      possessions: avantPossessions,
      souhaits: avantSouhaits,
      erreur: "Liste de souhaits non enregistrée, réessaie dans un instant",
    });
}
