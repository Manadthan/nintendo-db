import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase des pages publiques : sans cookies ni session, il lit en visiteur (rôle anon, RLS).
 * Ne dépendant pas du visiteur, les pages qui l'utilisent peuvent être préparées à l'avance (ADR-02).
 */
export function createSupabasePublicClient() {
  const { url, publishableKey } = supabaseEnv();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
