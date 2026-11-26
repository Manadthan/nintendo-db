import "server-only";
import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { versGuidePage, type GuidePage, type LigneGuide } from "./page";

const COLONNES =
  "isbn, titre, editeur, date_parution, precision_date, pages, couverture, google_books_id, ndl_url, guides_jeux(games(id, slug, developpeur, genre, series, metacritic_note, consoles!inner(slug, nom), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, jaquette_path)))";

/** Un guide par son ISBN (page /guides/{isbn}, US-27) ; null s'il n'existe pas. Lu en visiteur (RLS : lecture publique). */
export async function chargerGuide(isbn: string): Promise<GuidePage | null> {
  const { data, error } = await createSupabasePublicClient()
    .from("guides")
    .select(COLONNES)
    .eq("isbn", isbn)
    .maybeSingle();
  if (error) throw new Error(`Guide ${isbn} illisible : ${error.message}`);
  return data ? versGuidePage(data as unknown as LigneGuide) : null;
}

/** ISBN de tous les guides, pour préparer leurs pages au build et le plan du site (ADR-19 point 5). */
export async function listerGuides(): Promise<{ isbn: string }[]> {
  const supabase = createSupabasePublicClient();
  const lignes = await toutesLesPages(
    (de, a) => supabase.from("guides").select("isbn").order("id").range(de, a),
    "Liste des guides",
  );
  return (lignes as { isbn: string }[]).map(({ isbn }) => ({ isbn }));
}
