import type { Database } from "@/types/database";
import { supabaseEnv } from "@/lib/supabase/env";

export type Region = Database["public"]["Enums"]["region"];

/** Bucket des jaquettes (migration 0003_jaquettes.sql). */
export const BUCKET_JAQUETTES = "jaquettes";

/**
 * Trois largeurs par jaquette (ADR-04) : 300 et 600 px pour la grille (écran Retina), 768 px (largeur d'un scan
 * GameTDB) pour la grande jaquette de la fiche sur écran ×3.
 */
export const TAILLES_JAQUETTE = [300, 600, 768] as const;
export type TailleJaquette = (typeof TAILLES_JAQUETTE)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Chemin d'une jaquette dans le bucket : `{game_id}/{région}-{taille}.webp` (ADR-04), ex. `…/pal-600.webp`.
 * L'identifiant est vérifié : un chemin ne peut pas sortir du dossier d'un jeu.
 */
export function cheminJaquette(
  gameId: string,
  region: Region,
  taille: TailleJaquette,
): string {
  if (!UUID.test(gameId))
    throw new Error(`Identifiant de jeu invalide : « ${gameId} ».`);
  return `${gameId}/${region.toLowerCase()}-${taille}.webp`;
}

/** Adresse publique d'une jaquette, affichable directement dans une balise <img>. */
export function urlJaquette(
  chemin: string,
  baseUrl: string = supabaseEnv().url,
): string {
  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET_JAQUETTES}/${chemin}`;
}

/** Attribut `srcset` : le navigateur choisit la taille adaptée à l'écran. */
export function srcsetJaquette(
  gameId: string,
  region: Region,
  baseUrl?: string,
): string {
  return TAILLES_JAQUETTE.map(
    (taille) =>
      `${urlJaquette(cheminJaquette(gameId, region, taille), baseUrl)} ${taille}w`,
  ).join(", ");
}
