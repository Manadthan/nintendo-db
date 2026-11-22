"use server";

import { revalidatePath } from "next/cache";
import { PSEUDO } from "@/lib/invitations/inscription";
import { cheminPublic } from "@/lib/profil/adresse";
import { estAvatar } from "@/lib/profil/avatars";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatProfil = { erreurs?: string[]; enregistre?: boolean };

/** Session du compte : chacun ne modifie que son profil (règle de la base, 0024 : pseudo, avatar et visibilité). */
async function compte() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connexion requise");
  return { supabase, userId: user.id };
}

/** Modifie le pseudo et l'avatar (US-22). */
export async function modifierProfil(
  _p: EtatProfil,
  formData: FormData,
): Promise<EtatProfil> {
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  const avatar = formData.get("avatar");
  const erreurs: string[] = [];
  if (!PSEUDO.test(pseudo))
    erreurs.push(
      "Le pseudo : 3 à 20 lettres (sans accent), chiffres ou tirets.",
    );
  if (!estAvatar(avatar)) erreurs.push("Choisissez un avatar.");
  if (erreurs.length) return { erreurs };
  try {
    const { supabase, userId } = await compte();
    const { data: avant } = await supabase
      .from("profils")
      .select("pseudo")
      .eq("user_id", userId)
      .maybeSingle();
    const { error } = await supabase
      .from("profils")
      .update({ pseudo, avatar: avatar as string })
      .eq("user_id", userId);
    if (error)
      return {
        erreurs: [
          error.code === "23505"
            ? "Ce pseudo est déjà pris."
            : `Profil non enregistré : ${error.message}`,
        ],
      };
    revalidatePath("/profil");
    // L'ancienne adresse publique cesse de marcher, la nouvelle montre le nouvel avatar.
    if (avant) revalidatePath(cheminPublic(avant.pseudo));
    revalidatePath(cheminPublic(pseudo));
    return { enregistre: true };
  } catch (e) {
    return { erreurs: [(e as Error).message] };
  }
}

/** Rend le profil public ou privé (US-22) : la page publique (US-23) apparaît ou disparaît aussitôt. */
export async function basculerPublic(formData: FormData): Promise<void> {
  const { supabase, userId } = await compte();
  const { data, error } = await supabase
    .from("profils")
    .update({ public: formData.get("public") === "on" })
    .eq("user_id", userId)
    .select("pseudo")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/profil");
  revalidatePath(cheminPublic(data.pseudo));
}
