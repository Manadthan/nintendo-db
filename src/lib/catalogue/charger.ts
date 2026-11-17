import "server-only";
import { supabaseEnv } from "@/lib/supabase/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { versJeuCatalogue, type LigneJeu } from "./lignes";
import type { JeuCatalogue } from "./types";

/** Tous les jeux d'une console avec leurs 3 sorties, lus en visiteur (RLS : lecture publique). */
export async function chargerCatalogue(
  consoleSlug: string,
): Promise<JeuCatalogue[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, slug, developpeur, genre, consoles!inner(slug), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, jaquette_path)",
    )
    .eq("consoles.slug", consoleSlug);
  if (error)
    throw new Error(`Catalogue ${consoleSlug} illisible : ${error.message}`);

  const { url } = supabaseEnv();
  return (data as unknown as LigneJeu[]).map((ligne) =>
    versJeuCatalogue(ligne, url),
  );
}
