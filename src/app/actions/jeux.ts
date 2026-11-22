"use server";

import { revalidatePath, updateTag } from "next/cache";
import { TAG_CATALOGUE } from "@/lib/statistiques/charger";
import { redirect } from "next/navigation";
import { SLUG_CONSOLE } from "@/lib/admin/consoles";
import { lireNouveauJeu, VERROU_MANUEL } from "@/lib/admin/nouveau";
import { supprimerJeuEtJaquettes } from "@/lib/jaquettes/supprimer";
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
      .select(
        `developpeur, series, metacritic_note, metacritic_url, verrous, releases(${COLONNES_SORTIE})`,
      )
      .eq("id", gameId)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Jeu introuvable.");

    const parRegion = Object.fromEntries(
      data.releases.map((r) => [r.region, r]),
    );
    const avant: JeuCorrigeable = {
      developpeur: data.developpeur,
      series: [...data.series].sort((a, b) => a.localeCompare(b, "fr")),
      metacritic_note: data.metacritic_note,
      metacritic_url: data.metacritic_url,
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
    if (Object.keys(game).some((c) => c !== "verrous")) {
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
  updateTag(TAG_CATALOGUE); // Statistiques et profils (cache du catalogue, ADR-11)
  return { enregistre: true };
}

export type EtatAjout = { erreur?: string; titre?: string };

/**
 * Ajoute un jeu manquant à la main (US-11) : adresse tirée du titre, sans doublon ; ses 3 versions créées (sorties
 * cochées avec ce titre). Marqué « manuel » : l'import ne le supprime jamais. Ouvre ensuite sa correction.
 */
export async function ajouterJeu(
  _precedent: EtatAjout,
  formData: FormData,
): Promise<EtatAjout> {
  const titre = String(formData.get("titre") ?? "");
  const consoleSlug = String(formData.get("console") ?? "");
  if (!SLUG_CONSOLE.test(consoleSlug))
    return { erreur: "Console inconnue.", titre };
  let slug: string;
  try {
    const supabase = await exigerProprietaire();
    const { data: laConsole, error } = await supabase
      .from("consoles")
      .select("id, games(slug)")
      .eq("slug", consoleSlug)
      .single();
    if (error || !laConsole)
      throw new Error(error?.message ?? "Console introuvable.");
    const lu = lireNouveauJeu(
      formData,
      new Set(laConsole.games.map((g) => g.slug)),
    );
    if (!lu.ok) return { erreur: lu.erreur, titre };
    slug = lu.jeu.slug;

    const { data: jeu, error: e1 } = await supabase
      .from("games")
      .insert({
        console_id: laConsole.id,
        slug,
        physique: true,
        verrous: [VERROU_MANUEL],
      })
      .select("id")
      .single();
    if (e1 || !jeu) throw new Error(e1?.message ?? "Jeu non créé.");
    const { error: e2 } = await supabase.from("releases").insert(
      REGIONS.map((r) => {
        const sorti = lu.jeu.regions.includes(r);
        return {
          game_id: jeu.id,
          region: r,
          sortie: sorti,
          titre: sorti ? lu.jeu.titre : null,
        };
      }),
    );
    if (e2) throw new Error(e2.message);
  } catch (e) {
    return {
      erreur: e instanceof Error ? e.message : "Ajout impossible.",
      titre,
    };
  }
  revalidatePath("/", "layout");
  updateTag(TAG_CATALOGUE); // Statistiques et profils (cache du catalogue, ADR-11)
  redirect(`/admin/jeux/${consoleSlug}/${slug}?nouveau=1`);
}

/** Supprime un jeu (US-11), après confirmation dans la page : ses jaquettes, puis le jeu et ses versions. */
export async function supprimerJeu(formData: FormData): Promise<void> {
  const gameId = String(formData.get("jeu") ?? "");
  const nom = String(formData.get("nom") ?? "");
  if (!UUID.test(gameId)) throw new Error("Jeu inconnu.");
  const supabase = await exigerProprietaire();
  await supprimerJeuEtJaquettes(supabase, gameId, nom);
  revalidatePath("/", "layout");
  updateTag(TAG_CATALOGUE); // Statistiques et profils (cache du catalogue, ADR-11)
  const consoleSlug = String(formData.get("console") ?? "");
  const params = new URLSearchParams({ supprime: nom });
  if (SLUG_CONSOLE.test(consoleSlug)) params.set("console", consoleSlug);
  redirect(`/admin/jeux?${params}`);
}
