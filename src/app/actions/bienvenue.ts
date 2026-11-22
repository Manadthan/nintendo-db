"use server";

import { redirect } from "next/navigation";
import { PAGE_PROFIL } from "@/lib/auth/routes";
import { lireInscription } from "@/lib/invitations/inscription";
import { hacherJeton, jetonValide } from "@/lib/invitations/invitations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatBienvenue = {
  erreurs?: string[];
  /** Lien expiré, déjà utilisé ou annulé pendant la saisie. */
  perime?: boolean;
  email?: string;
  pseudo?: string;
  avatar?: string;
};

/**
 * Accepte une invitation (US-20, ADR-16 point 2) : les inscriptions restant fermées, le compte est créé par le
 * serveur avec la clé secrète, seulement pour un jeton valide. L'invitation est réservée d'abord (une seule mise à
 * jour conditionnelle : deux envois simultanés ne créent pas deux comptes), puis rendue si la création échoue.
 */
export async function accepterInvitation(
  _p: EtatBienvenue,
  formData: FormData,
): Promise<EtatBienvenue> {
  const jeton = String(formData.get("jeton") ?? "");
  if (!jetonValide(jeton)) return { perime: true };
  const saisie = lireInscription(formData);
  const rappel = {
    email: String(formData.get("email") ?? ""),
    pseudo: String(formData.get("pseudo") ?? ""),
    avatar: String(formData.get("avatar") ?? ""),
  };
  if (!saisie.ok) return { erreurs: saisie.erreurs, ...rappel };
  const { email, motDePasse, pseudo, avatar } = saisie.valeur;

  const admin = createSupabaseAdminClient();
  const { data: pris } = await admin
    .from("profils")
    .select("user_id")
    .eq("pseudo", pseudo)
    .maybeSingle();
  if (pris) return { erreurs: ["Ce pseudo est déjà pris."], ...rappel };

  const { data: invitation, error: erreurReserve } = await admin
    .from("invitations")
    .update({ utilisee_le: new Date().toISOString() })
    .eq("jeton_hache", hacherJeton(jeton))
    .is("utilisee_le", null)
    .gt("expire_le", new Date().toISOString())
    .select("id")
    .maybeSingle();
  if (erreurReserve)
    return {
      erreurs: [`Invitation illisible : ${erreurReserve.message}`],
      ...rappel,
    };
  if (!invitation) return { perime: true };
  const rendre = () =>
    admin
      .from("invitations")
      .update({ utilisee_le: null })
      .eq("id", invitation.id);

  const { data: cree, error: erreurCompte } = await admin.auth.admin.createUser(
    {
      email,
      password: motDePasse,
      email_confirm: true,
    },
  );
  if (erreurCompte || !cree.user) {
    await rendre();
    const existe =
      erreurCompte?.code === "email_exists" || erreurCompte?.status === 422;
    return {
      erreurs: [
        existe
          ? "Un compte existe déjà avec cette adresse e-mail."
          : `Compte non créé : ${erreurCompte?.message ?? "erreur inconnue"}`,
      ],
      ...rappel,
    };
  }

  const { error: erreurProfil } = await admin
    .from("profils")
    .insert({ user_id: cree.user.id, pseudo, avatar });
  if (erreurProfil) {
    await admin.auth.admin.deleteUser(cree.user.id);
    await rendre();
    return {
      erreurs: [
        erreurProfil.code === "23505"
          ? "Ce pseudo est déjà pris."
          : `Profil non créé : ${erreurProfil.message}`,
      ],
      ...rappel,
    };
  }
  await admin
    .from("invitations")
    .update({ user_id: cree.user.id })
    .eq("id", invitation.id);

  // Connexion de l'invité : la session est posée dans les cookies de sa réponse.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password: motDePasse });
  redirect(PAGE_PROFIL);
}
