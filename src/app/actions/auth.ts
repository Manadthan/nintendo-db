"use server";

import { redirect } from "next/navigation";
import { PAGE_ADMIN, PAGE_PROFIL } from "@/lib/auth/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatConnexion = { erreur?: string; email?: string };

/** Connexion par e-mail et mot de passe (US-09) : le propriétaire va à l'administration, un collectionneur à son profil. */
export async function seConnecter(
  _precedent: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("password") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Saisissez votre e-mail et votre mot de passe.", email };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    // Message volontairement vague : ne pas révéler lequel des deux champs est faux.
    const identifiantsRefuses = error.status === 400;
    return {
      erreur: identifiantsRefuses
        ? "E-mail ou mot de passe incorrect."
        : "Connexion impossible pour le moment. Réessayez dans un instant.",
      email,
    };
  }

  const { data: proprietaire } = await supabase.rpc("est_proprietaire");
  redirect(proprietaire === true ? PAGE_ADMIN : PAGE_PROFIL);
}

/**
 * Déconnexion (US-09) : retour au site public. Cet appareil seulement (choix du propriétaire, 26/11/2026) : par défaut,
 * Supabase ferme toutes les sessions du compte, les autres appareils compris.
 */
export async function seDeconnecter() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
