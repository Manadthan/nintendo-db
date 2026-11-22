import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readSecretKey, supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase à la clé secrète (ADR-16 point 2) : passe outre la RLS. Réservé aux comptes des collectionneurs
 * (créer, lister, supprimer) ; à n'appeler qu'après `exigerProprietaire()` ou la vérification d'un jeton d'invitation.
 */
export function createSupabaseAdminClient() {
  const { url } = supabaseEnv();
  return createClient<Database>(url, readSecretKey(process.env), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
