import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * À appeler en tête de chaque action d'administration (US-09) : une action serveur peut être appelée
 * directement, sans passer par la page ; la RLS protège la base, ceci protège tout le reste (Wikipédia, relais GameTDB).
 * Renvoie le client Supabase de la session du propriétaire.
 */
export async function exigerProprietaire() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connexion requise");
  return supabase;
}
