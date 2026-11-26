import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import {
  versGuidesCatalogue,
  type LigneGuideCatalogue,
} from "@/lib/guides/catalogue";

// Guides du catalogue (US-27, ADR-19 point 4) : préparés à l'avance et régénérés au plus toutes les 5 minutes,
// comme les fiches. Demandés par le navigateur seulement quand « Guides » est cochée : l'accueil reste léger.
export const revalidate = 300;
export const dynamic = "force-static";

export async function GET() {
  const supabase = createSupabasePublicClient();
  const lignes = await toutesLesPages(
    (de, a) =>
      supabase
        .from("guides")
        .select(
          "isbn, titre, editeur, date_parution, precision_date, couverture, google_books_id, guides_jeux(game_id)",
        )
        .order("id")
        .range(de, a),
    "Guides du catalogue",
  );
  return Response.json(
    versGuidesCatalogue(lignes as unknown as LigneGuideCatalogue[]),
  );
}
