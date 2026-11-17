import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { BUCKET_JAQUETTES } from "./stockage";

/**
 * Supprime un jeu et toutes ses jaquettes, quelle que soit leur version (#60) : le contenu de son dossier dans le
 * stockage, puis le jeu (ses sorties suivent, « on delete cascade »). Utilisé par l'import et l'administration.
 */
export async function supprimerJeuEtJaquettes(
  supabase: SupabaseClient<Database>,
  gameId: string,
  nom: string,
): Promise<void> {
  const { data: fichiers, error: e0 } = await supabase.storage
    .from(BUCKET_JAQUETTES)
    .list(gameId, { limit: 1000 });
  if (e0) throw new Error(`Jaquettes de « ${nom} » : ${e0.message}`);
  if (fichiers?.length) {
    const { error: e1 } = await supabase.storage
      .from(BUCKET_JAQUETTES)
      .remove(fichiers.map((f) => `${gameId}/${f.name}`));
    if (e1) throw new Error(`Jaquettes de « ${nom} » : ${e1.message}`);
  }
  const { error: e2 } = await supabase.from("games").delete().eq("id", gameId);
  if (e2) throw new Error(`Suppression de « ${nom} » : ${e2.message}`);
}
