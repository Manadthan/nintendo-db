import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NOMBRE_AJOUTS,
  syntheseProfil,
  type LigneAjout,
  type LigneAjoutAmiibo,
} from "@/lib/profil/collection";
import { chargerCollection } from "@/lib/statistiques/charger";
import type { Database } from "@/types/database";

/** Nombre d'amiibo du catalogue (lecture publique) : le « total » de la ligne « Amiibo : N / total » (US-30). */
export async function compterAmiibo(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await supabase
    .from("amiibo")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Amiibo illisibles : ${error.message}`);
  return count ?? 0;
}

/**
 * Collection du compte de la session pour Mon profil (US-22) : résumé, badges (US-24), derniers ajouts, et ses
 * amiibo (US-30 : nombre, total, derniers ajoutés).
 */
export async function chargerCollectionProfil(
  supabase: SupabaseClient<Database>,
) {
  const [{ jeux, consoles, possessions }, ajouts, amiibo, ajoutsAmiibo, total] =
    await Promise.all([
      chargerCollection(supabase),
      supabase
        .from("possessions")
        .select(
          "region, cree_le, games!inner(slug, consoles!inner(slug, nom), releases(region, titre, jaquette_path))",
        )
        .order("cree_le", { ascending: false })
        .limit(NOMBRE_AJOUTS)
        .overrideTypes<LigneAjout[], { merge: false }>(),
      // La RLS ne rend que les lignes du compte connecté.
      supabase
        .from("possessions_amiibo")
        .select("amiibo_id", { count: "exact", head: true }),
      supabase
        .from("possessions_amiibo")
        .select("cree_le, amiibo!inner(slug, nom, image_path)")
        .order("cree_le", { ascending: false })
        .limit(NOMBRE_AJOUTS)
        .overrideTypes<LigneAjoutAmiibo[], { merge: false }>(),
      compterAmiibo(supabase),
    ]);
  if (ajouts.error)
    throw new Error(`Derniers ajouts illisibles : ${ajouts.error.message}`);
  if (amiibo.error || ajoutsAmiibo.error)
    throw new Error(
      `Amiibo possédés illisibles : ${(amiibo.error ?? ajoutsAmiibo.error)?.message}`,
    );
  return syntheseProfil(
    jeux,
    consoles,
    possessions,
    ajouts.data ?? [],
    undefined,
    {
      possedes: amiibo.count ?? 0,
      total,
      ajouts: ajoutsAmiibo.data ?? [],
    },
  );
}
