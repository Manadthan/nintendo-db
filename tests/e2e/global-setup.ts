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

  // Dépose des WebP valides dans les buckets locaux pour les images de tests/e2e/images.sql (SPEC v1.55), afin que
  // toutes les balises <img> aient une vraie image 200 OK en Chromium et WebKit.
  const sharp = (await import("sharp")).default;
  const imageBoite = await sharp({
    create: { width: 27, height: 38, channels: 3, background: "#e5e7eb" },
  })
    .webp()
    .toBuffer();
  const [{ data: sorties }, { data: amiibos }] = await Promise.all([
    admin
      .from("releases")
      .select("jaquette_path")
      .not("jaquette_path", "is", null),
    admin.from("amiibo").select("image_path").not("image_path", "is", null),
  ]);
  const envois: Promise<unknown>[] = [];
  for (const s of sorties ?? []) {
    if (!s.jaquette_path) continue;
    for (const taille of [300, 600, 768]) {
      envois.push(
        admin.storage
          .from("jaquettes")
          .upload(`${s.jaquette_path}-${taille}.webp`, imageBoite, {
            contentType: "image/webp",
            upsert: true,
          }),
      );
    }
  }
  for (const a of amiibos ?? []) {
    if (!a.image_path) continue;
    for (const taille of [300, 600]) {
      envois.push(
        admin.storage
          .from("amiibo")
          .upload(`${a.image_path}-${taille}.webp`, imageBoite, {
            contentType: "image/webp",
            upsert: true,
          }),
      );
    }
  }
  await Promise.all(envois);
}
