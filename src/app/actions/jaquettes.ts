"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { regionDepuisAdresse } from "@/lib/admin/jaquettes";
import { enregistrerJaquette } from "@/lib/jaquettes/enregistrer";
import { telechargerImageExterne } from "@/lib/jaquettes/telecharger";

export type EtatRemplacement = { erreur?: string; adresse?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Remplace la jaquette d'une sortie par l'image d'une adresse (US-12) : téléchargée côté serveur avec protection
 * SSRF, ré-encodée en WebP, source « url » (jamais remplacée par un import). Les erreurs sont rendues au
 * formulaire (Next.js masquerait le message d'une erreur lancée).
 */
export async function remplacerJaquetteParAdresse(
  _precedent: EtatRemplacement,
  formData: FormData,
): Promise<EtatRemplacement> {
  const adresse = String(formData.get("adresse") ?? "").trim();
  const gameId = String(formData.get("jeu") ?? "");
  const region = regionDepuisAdresse(String(formData.get("region") ?? ""));
  const slug = String(formData.get("slug") ?? "");
  if (!adresse) return { erreur: "Saisis l'adresse d'une image.", adresse };
  if (!UUID.test(gameId) || !region)
    return { erreur: "Sortie inconnue.", adresse };

  try {
    const supabase = await exigerProprietaire();
    const { data: sortie, error } = await supabase
      .from("releases")
      .select("sortie, jaquette_path")
      .eq("game_id", gameId)
      .eq("region", region)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sortie?.sortie)
      return { erreur: "Ce jeu n'est pas sorti dans cette région.", adresse };

    const image = await telechargerImageExterne(adresse);
    await enregistrerJaquette(
      supabase,
      gameId,
      region,
      image,
      "url",
      sortie.jaquette_path,
    );
  } catch (e) {
    return {
      erreur: e instanceof Error ? e.message : "Remplacement impossible.",
      adresse,
    };
  }
  revalidatePath("/", "layout");
  redirect(
    `/admin/jaquettes?remplacee=${encodeURIComponent(`${slug} ${region}`)}`,
  );
}
