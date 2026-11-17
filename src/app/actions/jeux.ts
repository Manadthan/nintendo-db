"use server";

import { revalidatePath } from "next/cache";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import {
  lireSaisie,
  preparerCorrection,
  type JeuCorrigeable,
} from "@/lib/admin/correction";
import { REGIONS, type Region } from "@/lib/catalogue/types";

export type EtatCorrection = { erreurs?: string[]; enregistre?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLONNES_SORTIE =
  "region, sortie, titre, titre_romanise, date_sortie, precision_date, code_produit, editeur, verrous";

/**
 * Corrige la fiche d'un jeu (US-11) : seuls les champs modifiés sont écrits, et chacun est verrouillé pour que
 * l'import ne le remplace plus (ADR-03 point 4). Les erreurs sont rendues au formulaire.
 */
export async function corrigerJeu(
  _precedent: EtatCorrection,
  formData: FormData,
): Promise<EtatCorrection> {
  const gameId = String(formData.get("jeu") ?? "");
  if (!UUID.test(gameId)) return { erreurs: ["Jeu inconnu."] };
  try {
    const supabase = await exigerProprietaire();
    const { data, error } = await supabase
      .from("games")
      .select(`developpeur, verrous, releases(${COLONNES_SORTIE})`)
      .eq("id", gameId)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Jeu introuvable.");

    const parRegion = Object.fromEntries(
      data.releases.map((r) => [r.region, r]),
    );
    const avant: JeuCorrigeable = {
      developpeur: data.developpeur,
      releases: Object.fromEntries(
        REGIONS.map((r) => {
          const s = parRegion[r];
          return [
            r,
            {
              sortie: s?.sortie ?? false,
              titre: s?.titre ?? null,
              titre_romanise: s?.titre_romanise ?? null,
              date_sortie: s?.date_sortie ?? null,
              precision_date: s?.precision_date ?? null,
              code_produit: s?.code_produit ?? null,
              editeur: s?.editeur ?? null,
            },
          ];
        }),
      ) as JeuCorrigeable["releases"],
    };
    const resultat = preparerCorrection(avant, lireSaisie(formData), {
      game: data.verrous,
      releases: Object.fromEntries(
        REGIONS.map((r) => [r, parRegion[r]?.verrous ?? []]),
      ) as Record<Region, string[]>,
    });
    if (!resultat.ok) return { erreurs: resultat.erreurs };

    const { game, releases } = resultat.correction;
    if ("developpeur" in game) {
      const { error: e } = await supabase
        .from("games")
        .update(game)
        .eq("id", gameId);
      if (e) throw new Error(e.message);
    }
    for (const [region, patch] of Object.entries(releases)) {
      const { error: e } = await supabase
        .from("releases")
        .upsert(
          { game_id: gameId, region: region as Region, ...patch },
          { onConflict: "game_id,region" },
        );
      if (e) throw new Error(`${region} : ${e.message}`);
    }
  } catch (e) {
    return {
      erreurs: [e instanceof Error ? e.message : "Enregistrement impossible."],
    };
  }
  revalidatePath("/", "layout");
  return { enregistre: true };
}
