import { createClient } from "@supabase/supabase-js";
import {
  BASE_LOCALE_DISPONIBLE,
  COLLECTIONNEUR_TEST,
  PROPRIETAIRE_TEST,
} from "./utilisateur";

/**
 * Crée les comptes de test sur la base Supabase locale (ADR-01 : inscriptions fermées, les comptes sont créés
 * par l'API d'administration) : le propriétaire, avec son profil de rôle « proprietaire » (ADR-16), et un
 * collectionneur invité.
 */
export default async function globalSetup() {
  if (!BASE_LOCALE_DISPONIBLE) {
    // En CI, la base locale est obligatoire : sans elle, les tests de connexion ne prouveraient rien.
    if (process.env.CI)
      throw new Error(
        "Tests e2e : base Supabase locale absente en CI (E2E_SUPABASE_SECRET_KEY).",
      );
    console.warn(
      "Pas de base Supabase locale : les tests de connexion sont ignorés (ils tournent en CI).",
    );
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Garde-fou : jamais de compte de test sur la base de production.
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error(
      `Tests e2e refusés : « ${url} » n'est pas une base Supabase locale.`,
    );
  }

  const admin = createClient(url, process.env.E2E_SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const comptes = [
    { ...PROPRIETAIRE_TEST, pseudo: "e2e-proprietaire", role: "proprietaire" },
    {
      ...COLLECTIONNEUR_TEST,
      pseudo: "e2e-collectionneur",
      role: "collectionneur",
    },
  ] as const;
  for (const { email, password, pseudo, role } of comptes) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error && error.code !== "email_exists") throw error;
    const { data, error: e } = await admin.auth.admin.listUsers();
    if (e) throw e;
    const compte = data.users.find((u) => u.email === email);
    if (!compte) throw new Error(`Compte de test introuvable : ${email}`);
    const { error: e2 } = await admin
      .from("profils")
      .upsert({ user_id: compte.id, pseudo, role }, { onConflict: "user_id" });
    if (e2) throw e2;
  }
}
