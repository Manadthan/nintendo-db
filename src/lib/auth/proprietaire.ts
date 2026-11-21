import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * À appeler en tête de chaque action d'administration (US-09) : une action serveur peut être appelée
 * directement, sans passer par la page ; la RLS protège la base, ceci protège tout le reste (Wikipédia, relais GameTDB).
 * Depuis l'étape 27 (ADR-16), une session ne suffit plus : le compte doit avoir le rôle « proprietaire » en base
 * (un collectionneur invité est connecté aussi). Renvoie le client Supabase de la session du propriétaire.
 */
export async function exigerProprietaire() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connexion requise");
  const { data: proprietaire, error } = await supabase.rpc("est_proprietaire");
  if (error) throw new Error(`Rôle illisible : ${error.message}`);
  if (proprietaire !== true) throw new Error("Réservé au propriétaire");
  return supabase;
}
