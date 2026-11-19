import "server-only";
import { supabaseEnv } from "@/lib/supabase/env";
import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { versJeuCatalogue, type LigneJeu } from "./lignes";
import type { JeuCatalogue } from "./types";

/** Tous les jeux de toutes les consoles (étape 8) avec leurs 3 sorties, lus en visiteur (RLS : lecture publique). */
export async function chargerCatalogue(): Promise<JeuCatalogue[]> {
  const supabase = createSupabasePublicClient();
  // Plus de 1 000 jeux depuis la NES : lus page par page.
  const lignes = await toutesLesPages(
    (de, a) =>
      supabase
        .from("games")
        .select(
          "id, slug, developpeur, genre, metacritic_note, consoles!inner(slug, nom), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, jaquette_path)",
        )
        .order("id")
        .range(de, a),
    "Catalogue",
  );

  const { url } = supabaseEnv();
  return (lignes as unknown as LigneJeu[]).map((ligne) =>
    versJeuCatalogue(ligne, url),
  );
}

/** Consoles du site, par ordre chronologique (filtre « Console », étape 8). */
export async function chargerConsoles(): Promise<
  { slug: string; nom: string }[]
> {
  const { data, error } = await createSupabasePublicClient()
    .from("consoles")
    .select("slug, nom")
    .order("ordre");
  if (error) throw new Error(`Consoles illisibles : ${error.message}`);
  return data ?? [];
}
