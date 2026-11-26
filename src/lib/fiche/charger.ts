import "server-only";
import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { versJeuFiche, type JeuFiche, type LigneFiche } from "./fiche";

const COLONNES =
  "id, slug, developpeur, series, genre, wikipedia_url, metacritic_note, metacritic_url, rawg_slug, captures(position, url, largeur, hauteur), guides_jeux(guides(isbn, titre, editeur, date_parution, google_books_id)), amiibo_jeux(amiibo(slug, nom, image_path, amiibo_sorties(date_sortie))), consoles!inner(slug, nom), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, code_produit, jaquette_path, jaquette_source)";

/** Un jeu par son adresse stable /jeux/{console}/{jeu} (ADR-06) ; null s'il n'existe pas. Lu en visiteur. */
export async function chargerJeu(
  consoleSlug: string,
  jeuSlug: string,
): Promise<JeuFiche | null> {
  const { data, error } = await createSupabasePublicClient()
    .from("games")
    .select(COLONNES)
    .eq("consoles.slug", consoleSlug)
    .eq("slug", jeuSlug)
    .maybeSingle();
  if (error)
    throw new Error(
      `Jeu ${consoleSlug}/${jeuSlug} illisible : ${error.message}`,
    );
  return data ? versJeuFiche(data as unknown as LigneFiche) : null;
}

/** Adresses de toutes les fiches, pour les préparer à l'avance au build (ADR-02). */
export async function listerFiches(): Promise<
  { console: string; jeu: string }[]
> {
  const supabase = createSupabasePublicClient();
  const lignes = await toutesLesPages(
    (de, a) =>
      supabase
        .from("games")
        .select("slug, consoles!inner(slug)")
        .order("id")
        .range(de, a),
    "Liste des jeux",
  );
  return (
    lignes as unknown as { slug: string; consoles: { slug: string } }[]
  ).map((j) => ({
    console: j.consoles.slug,
    jeu: j.slug,
  }));
}
