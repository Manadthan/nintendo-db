import "server-only";
import { supabaseEnv } from "@/lib/supabase/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { versJeuFiche, type JeuFiche, type LigneFiche } from "./fiche";

const COLONNES =
  "id, slug, developpeur, franchise, genre, wikipedia_url, consoles!inner(slug, nom), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, code_produit, jaquette_path)";

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
  return data
    ? versJeuFiche(data as unknown as LigneFiche, supabaseEnv().url)
    : null;
}

/** Adresses de toutes les fiches, pour les préparer à l'avance au build (ADR-02). */
export async function listerFiches(): Promise<
  { console: string; jeu: string }[]
> {
  const { data, error } = await createSupabasePublicClient()
    .from("games")
    .select("slug, consoles!inner(slug)");
  if (error) throw new Error(`Liste des jeux illisible : ${error.message}`);
  return (
    data as unknown as { slug: string; consoles: { slug: string } }[]
  ).map((j) => ({
    console: j.consoles.slug,
    jeu: j.slug,
  }));
}
