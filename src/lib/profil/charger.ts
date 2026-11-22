import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syntheseProfil, type LigneAjout } from "@/lib/profil/collection";
import { chargerCollection } from "@/lib/statistiques/charger";
import type { Database } from "@/types/database";

export const NOMBRE_AJOUTS = 6;

/** Collection du compte de la session pour Mon profil (US-22) : résumé, badges (US-24) et derniers ajouts. */
export async function chargerCollectionProfil(
  supabase: SupabaseClient<Database>,
) {
  const [{ jeux, consoles, possessions }, ajouts] = await Promise.all([
    chargerCollection(supabase),
    supabase
      .from("possessions")
      .select(
        "region, cree_le, games!inner(slug, consoles!inner(slug, nom), releases(region, titre, jaquette_path))",
      )
      .order("cree_le", { ascending: false })
      .limit(NOMBRE_AJOUTS)
      .overrideTypes<LigneAjout[], { merge: false }>(),
  ]);
  if (ajouts.error)
    throw new Error(`Derniers ajouts illisibles : ${ajouts.error.message}`);
  return syntheseProfil(jeux, consoles, possessions, ajouts.data ?? []);
}
