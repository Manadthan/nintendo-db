import {
  versAmiiboCatalogue,
  type LigneAmiiboCatalogue,
} from "@/lib/amiibo/catalogue";
import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";

// Amiibo du catalogue (US-29, ADR-21 point 5) : préparés à l'avance et régénérés au plus toutes les 5 minutes,
// comme /guides.json. Demandés par le navigateur seulement quand « Amiibo » est cochée : l'accueil reste léger.
export const revalidate = 300;
export const dynamic = "force-static";

export async function GET() {
  const supabase = createSupabasePublicClient();
  const lignes = await toutesLesPages(
    (de, a) =>
      supabase
        .from("amiibo")
        .select(
          "slug, nom, nom_jap, type, serie_amiibo, serie_jeux, image_path, amiibo_sorties(region, date_sortie, precision_date), amiibo_jeux(games(consoles(slug)))",
        )
        .order("id")
        .range(de, a),
    "Amiibo du catalogue",
  );
  return Response.json(
    versAmiiboCatalogue(lignes as unknown as LigneAmiiboCatalogue[]),
  );
}
