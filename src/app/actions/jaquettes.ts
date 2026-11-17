"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { SLUG_CONSOLE } from "@/lib/admin/consoles";
import { regionDepuisAdresse } from "@/lib/admin/jaquettes";
import { enregistrerJaquette } from "@/lib/jaquettes/enregistrer";
import { telechargerImageExterne } from "@/lib/jaquettes/telecharger";

export type EtatRemplacement = { erreur?: string; adresse?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Retour à la liste des jaquettes de la console du jeu (étape 8), avec le message de remplacement. */
function retourJaquettes(formData: FormData, remplacee: string): string {
  const console_ = String(formData.get("console") ?? "");
  const params = new URLSearchParams({ remplacee });
  if (SLUG_CONSOLE.test(console_)) params.set("console", console_);
  return `/admin/jaquettes?${params}`;
}

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
  redirect(retourJaquettes(formData, `${slug} ${region}`));
}

/** Poids maximal d'une photo reçue (elle arrive réduite par le navigateur, bien en dessous). */
const PHOTO_MAX = 4 * 1024 * 1024;

/**
 * Remplace la jaquette d'une sortie par une photo prise ou choisie sur l'iPhone (US-12) : réduite dans le
 * navigateur, ré-encodée en WebP ici, source « photo » (jamais remplacée par un import).
 */
export async function remplacerJaquetteParPhoto(
  _precedent: EtatRemplacement,
  formData: FormData,
): Promise<EtatRemplacement> {
  const photo = formData.get("photo");
  const gameId = String(formData.get("jeu") ?? "");
  const region = regionDepuisAdresse(String(formData.get("region") ?? ""));
  const slug = String(formData.get("slug") ?? "");
  if (!(photo instanceof Blob) || photo.size === 0)
    return { erreur: "Choisis ou prends une photo." };
  if (!photo.type.startsWith("image/"))
    return { erreur: "Ce fichier n'est pas une image." };
  if (photo.size > PHOTO_MAX)
    return { erreur: "Photo trop lourde (4 Mo au plus)." };
  if (!UUID.test(gameId) || !region) return { erreur: "Sortie inconnue." };

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
      return { erreur: "Ce jeu n'est pas sorti dans cette région." };
    await enregistrerJaquette(
      supabase,
      gameId,
      region,
      Buffer.from(await photo.arrayBuffer()),
      "photo",
      sortie.jaquette_path,
    );
  } catch (e) {
    return {
      erreur: e instanceof Error ? e.message : "Remplacement impossible.",
    };
  }
  revalidatePath("/", "layout");
  redirect(retourJaquettes(formData, `${slug} ${region}`));
}
