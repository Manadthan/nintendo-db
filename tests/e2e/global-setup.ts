import { createClient } from "@supabase/supabase-js";
import { BASE_LOCALE_DISPONIBLE, PROPRIETAIRE_TEST } from "./utilisateur";

/**
 * Crée le compte de test sur la base Supabase locale (ADR-01 : inscriptions fermées, le compte est créé
 * par l'API d'administration, comme le propriétaire l'a fait à la main en production).
 */
export default async function globalSetup() {
  if (!BASE_LOCALE_DISPONIBLE) {
    // En CI, la base locale est obligatoire : sans elle, les tests de connexion ne prouveraient rien.
    if (process.env.CI) throw new Error("Tests e2e : base Supabase locale absente en CI (E2E_SUPABASE_SECRET_KEY).");
    console.warn("Pas de base Supabase locale : les tests de connexion sont ignorés (ils tournent en CI).");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Garde-fou : jamais de compte de test sur la base de production.
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error(`Tests e2e refusés : « ${url} » n'est pas une base Supabase locale.`);
  }

  const admin = createClient(url, process.env.E2E_SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.auth.admin.createUser({ ...PROPRIETAIRE_TEST, email_confirm: true });
  if (error && error.code !== "email_exists") throw error;
}
