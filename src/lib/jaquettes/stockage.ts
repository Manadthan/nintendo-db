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
 * Base du chemin d'une jaquette (enregistrée dans `jaquette_path`) : `{game_id}/{région}-{version}` (#60). La
 * version change à chaque copie : une jaquette remplacée a une nouvelle adresse, jamais servie depuis un cache.
 * Les jaquettes copiées avant #60 ont une base sans version (`{game_id}/{région}`).
 */
export function baseJaquette(
  gameId: string,
  region: Region,
  version: string,
): string {
  if (!UUID.test(gameId))
    throw new Error(`Identifiant de jeu invalide : « ${gameId} ».`);
  if (!/^[a-z0-9]{1,16}$/.test(version))
    throw new Error(`Version de jaquette invalide : « ${version} ».`);
  return `${gameId}/${region.toLowerCase()}-${version}`;
}

const BASE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(jap|us|pal)(-[a-z0-9]{1,16})?$/i;

/**
 * Chemin d'une taille de jaquette dans le bucket : `{base}-{taille}.webp` (ADR-04), ex. `…/pal-mi3x9k-600.webp`.
 * La base est vérifiée : un chemin ne peut pas sortir du dossier d'un jeu.
 */
export function cheminJaquette(base: string, taille: TailleJaquette): string {
  if (!BASE.test(base))
    throw new Error(`Chemin de jaquette invalide : « ${base} ».`);
  return `${base}-${taille}.webp`;
}

/** Adresse publique d'une jaquette, affichable directement dans une balise <img>. */
export function urlJaquette(
  chemin: string,
  baseUrl: string = supabaseEnv().url,
): string {
  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET_JAQUETTES}/${chemin}`;
}

/** Attribut `srcset` : le navigateur choisit la taille adaptée à l'écran. */
export function srcsetJaquette(base: string, baseUrl?: string): string {
  return TAILLES_JAQUETTE.map(
    (taille) =>
      `${urlJaquette(cheminJaquette(base, taille), baseUrl)} ${taille}w`,
  ).join(", ");
}
