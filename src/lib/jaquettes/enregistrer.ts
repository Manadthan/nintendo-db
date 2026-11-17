import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { convertirEnWebp } from "@/lib/import/jaquettes";
import type { Database } from "@/types/database";
import {
  BUCKET_JAQUETTES,
  TAILLES_JAQUETTE,
  baseJaquette,
  cheminJaquette,
  type Region,
} from "./stockage";

type Source = Database["public"]["Enums"]["jaquette_source"];

/**
 * Enregistre une jaquette (ADR-04) : image ré-encodée en WebP 300, 600 et 768 px, déposée sous un chemin versionné
 * (#60 : nouvelle adresse, jamais servie depuis un cache), liée à la sortie avec sa source, puis l'ancienne
 * jaquette supprimée. Utilisé par l'import (scans GameTDB) et le remplacement à la main (US-12 : adresse, photo).
 * Échoue si le fichier n'est pas une image. Rend la nouvelle base de chemin.
 */
export async function enregistrerJaquette(
  supabase: SupabaseClient<Database>,
  gameId: string,
  region: Region,
  image: Buffer,
  source: Source,
  ancienne: string | null,
  version = Date.now().toString(36),
): Promise<string> {
  const tailles = await convertirEnWebp(image);
  const base = baseJaquette(gameId, region, version);
  for (const taille of TAILLES_JAQUETTE) {
    const { error } = await supabase.storage
      .from(BUCKET_JAQUETTES)
      .upload(cheminJaquette(base, taille), tailles[taille], {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`Jaquette ${region} : ${error.message}`);
  }
  const { error } = await supabase
    .from("releases")
    .update({ jaquette_path: base, jaquette_source: source })
    .eq("game_id", gameId)
    .eq("region", region);
  if (error) throw new Error(`Jaquette ${region} : ${error.message}`);

  // L'ancienne jaquette n'est plus référencée : ses fichiers sont supprimés (sans bloquer en cas d'échec).
  if (ancienne && ancienne !== base)
    await supabase.storage
      .from(BUCKET_JAQUETTES)
      .remove(TAILLES_JAQUETTE.map((t) => cheminJaquette(ancienne, t)));
  return base;
}
