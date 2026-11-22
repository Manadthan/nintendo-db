"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import {
  DUREE_INVITATION_JOURS,
  genererJeton,
  hacherJeton,
  lienInvitation,
  lireNom,
} from "@/lib/invitations/invitations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type EtatLien = { erreur?: string; lien?: string; nom?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = "/admin/collectionneurs";

/** Adresse du site qui reçoit la demande : un lien créé sur une prévisualisation y mène. */
async function origine(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const protocole =
    h.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}

const expireLe = () =>
  new Date(Date.now() + DUREE_INVITATION_JOURS * 86_400_000).toISOString();

/** Crée une invitation (US-19) : le lien, valable 7 jours, n'est montré qu'ici ; la base garde son empreinte. */
export async function creerInvitation(
  _p: EtatLien,
  formData: FormData,
): Promise<EtatLien> {
  const nom = lireNom(formData.get("nom"));
  if (!nom.ok) return { erreur: nom.erreur };
  try {
    const supabase = await exigerProprietaire();
    const jeton = genererJeton();
    const { error } = await supabase
      .from("invitations")
      .insert({
        nom: nom.nom,
        jeton_hache: hacherJeton(jeton),
        expire_le: expireLe(),
      });
    if (error) throw new Error(error.message);
    revalidatePath(PAGE);
    return { lien: lienInvitation(await origine(), jeton), nom: nom.nom };
  } catch (e) {
    return { erreur: `Invitation non créée : ${(e as Error).message}` };
  }
}

/**
 * Nouveau lien pour une invitation pas encore utilisée : la base ne garde que l'empreinte de l'ancien, qui ne peut
 * donc pas être réaffiché ; il est remplacé (l'ancien lien ne marche plus) et le délai repart pour 7 jours.
 */
export async function renouvelerInvitation(
  _p: EtatLien,
  formData: FormData,
): Promise<EtatLien> {
  const id = String(formData.get("invitation") ?? "");
  if (!UUID.test(id)) return { erreur: "Invitation inconnue." };
  try {
    const supabase = await exigerProprietaire();
    const jeton = genererJeton();
    const { data, error } = await supabase
      .from("invitations")
      .update({ jeton_hache: hacherJeton(jeton), expire_le: expireLe() })
      .eq("id", id)
      .is("utilisee_le", null)
      .select("nom")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { erreur: "Invitation introuvable ou déjà utilisée." };
    revalidatePath(PAGE);
    return { lien: lienInvitation(await origine(), jeton), nom: data.nom };
  } catch (e) {
    return { erreur: `Lien non créé : ${(e as Error).message}` };
  }
}

/** Annule une invitation pas encore utilisée : son lien ne marche plus. */
export async function annulerInvitation(formData: FormData): Promise<void> {
  const id = String(formData.get("invitation") ?? "");
  if (!UUID.test(id)) throw new Error("Invitation inconnue.");
  const supabase = await exigerProprietaire();
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .is("utilisee_le", null);
  if (error) throw new Error(error.message);
  revalidatePath(PAGE);
}

/**
 * Supprime le compte d'un collectionneur (US-19), après confirmation dans la page : son profil et sa collection
 * partent avec lui (`on delete cascade`). Jamais un compte propriétaire.
 */
export async function supprimerCollectionneur(
  formData: FormData,
): Promise<void> {
  const userId = String(formData.get("compte") ?? "");
  if (!UUID.test(userId)) throw new Error("Compte inconnu.");
  await exigerProprietaire();
  const admin = createSupabaseAdminClient();
  const { data: profil, error } = await admin
    .from("profils")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (profil?.role !== "collectionneur")
    throw new Error("Seul un compte de collectionneur se supprime ici.");
  const { error: erreurSuppression } =
    await admin.auth.admin.deleteUser(userId);
  if (erreurSuppression) throw new Error(erreurSuppression.message);
  revalidatePath(PAGE);
}
