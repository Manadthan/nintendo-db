import "server-only";
import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { versAmiiboFiche, type AmiiboFiche, type LigneAmiibo } from "./fiche";

const COLONNES =
  "slug, identifiant, nom, nom_jap, type, serie_amiibo, serie_jeux, personnage, editeur, image_path, boite_path, amiibo_sorties(region, date_sortie, precision_date), amiibo_jeux(titre_jeu, console, usage, games(slug, consoles(slug)))";

/** Un amiibo par son adresse /amiibo/{slug} (US-29) ; null s'il n'existe pas. Lu en visiteur (RLS : lecture publique). */
export async function chargerAmiibo(slug: string): Promise<AmiiboFiche | null> {
  const { data, error } = await createSupabasePublicClient()
    .from("amiibo")
    .select(COLONNES)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Amiibo ${slug} illisible : ${error.message}`);
  return data ? versAmiiboFiche(data as unknown as LigneAmiibo) : null;
}

/** Slugs de tous les amiibo, pour préparer leurs fiches au build et le plan du site (ADR-21 point 6). */
export async function listerAmiibo(): Promise<{ slug: string }[]> {
  const supabase = createSupabasePublicClient();
  const lignes = await toutesLesPages(
    (de, a) => supabase.from("amiibo").select("slug").order("id").range(de, a),
    "Liste des amiibo",
  );
  return (lignes as { slug: string }[]).map(({ slug }) => ({ slug }));
}
