import { unstable_cache } from "next/cache";
import {
  versAmiiboCatalogue,
  type LigneAmiiboCatalogue,
} from "@/lib/amiibo/catalogue";
import { chargerCatalogue, chargerConsoles } from "@/lib/catalogue/charger";
import { marcheDepuisTexte } from "@/lib/catalogue/marche";
import type { Region } from "@/lib/catalogue/types";
import { voirDepuisParametres, voirEffectif } from "@/lib/catalogue/voir";
import { ensemble } from "@/lib/collection/collection";
import {
  versGuidesCatalogue,
  type LigneGuideCatalogue,
} from "@/lib/guides/catalogue";
import { TAG_CATALOGUE } from "@/lib/statistiques/charger";
import { calculerSuivi, verifierJetonSuivi } from "@/lib/suivi/suivi";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/env";
import { toutesLesPages } from "@/lib/supabase/pages";
import { createSupabasePublicClient } from "@/lib/supabase/public";

// Endpoint protégé par jeton secret partagé (contrat /api/suivi) : lu côté serveur par mon-site-sdlc pour suivre
// l'avancement d'une vue filtrée du catalogue sans rendre le profil public.
export const dynamic = "force-dynamic";

const ENTETES = { "Cache-Control": "no-store" } as const;

// Le catalogue public est gardé 5 min en cache (vidé dès qu'un jeu change dans l'admin, ADR-11) pour répondre en
// ~150 ms à mon-site-sdlc ; les possessions du propriétaire, elles, sont toujours lues en direct à chaque appel.
const chargerBaseSuivi = unstable_cache(
  async () => {
    const [jeux, consoles] = await Promise.all([
      chargerCatalogue(),
      chargerConsoles(),
    ]);
    return { jeux, consoles };
  },
  ["suivi-catalogue-base"],
  { revalidate: 300, tags: [TAG_CATALOGUE] },
);

const chargerGuidesCatalogue = unstable_cache(
  async () => {
    const supabase = createSupabasePublicClient();
    const lignes = await toutesLesPages(
      (de, a) =>
        supabase
          .from("guides")
          .select(
            "id, isbn, titre, editeur, date_parution, precision_date, couverture, google_books_id, guides_jeux(game_id)",
          )
          .order("id")
          .range(de, a),
      "Guides du catalogue",
    );
    return versGuidesCatalogue(lignes as unknown as LigneGuideCatalogue[]);
  },
  ["suivi-catalogue-guides"],
  { revalidate: 300, tags: [TAG_CATALOGUE] },
);

const chargerAmiiboCatalogue = unstable_cache(
  async () => {
    const supabase = createSupabasePublicClient();
    const lignes = await toutesLesPages(
      (de, a) =>
        supabase
          .from("amiibo")
          .select(
            "id, slug, nom, nom_jap, type, serie_amiibo, serie_jeux, image_path, amiibo_sorties(region, date_sortie, precision_date), amiibo_jeux(games(consoles(slug)))",
          )
          .order("id")
          .range(de, a),
      "Amiibo du catalogue",
    );
    return versAmiiboCatalogue(lignes as unknown as LigneAmiiboCatalogue[]);
  },
  ["suivi-catalogue-amiibo"],
  { revalidate: 300, tags: [TAG_CATALOGUE] },
);

async function chargerPossessionsProprietaire(voir: {
  jeux: boolean;
  guides: boolean;
  amiibo: boolean;
}): Promise<ReadonlySet<string>> {
  const admin = createSupabaseAdminClient();
  const { data: proprietaire, error } = await admin
    .from("profils")
    .select("user_id")
    .eq("role", "proprietaire")
    .order("cree_le")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Propriétaire illisible : ${error.message}`);
  if (!proprietaire) return new Set();
  const userId = proprietaire.user_id;

  const [jeux, amiibo, guides] = await Promise.all([
    voir.jeux
      ? toutesLesPages<{ game_id: string; region: Region }>(
          (de, a) =>
            admin
              .from("possessions")
              .select("game_id, region")
              .eq("user_id", userId)
              .order("game_id")
              .order("region")
              .range(de, a),
          "Possessions",
        )
      : Promise.resolve([]),
    voir.amiibo
      ? toutesLesPages<{ amiibo_id: string }>(
          (de, a) =>
            admin
              .from("possessions_amiibo")
              .select("amiibo_id")
              .eq("user_id", userId)
              .order("amiibo_id")
              .range(de, a),
          "Possessions amiibo",
        )
      : Promise.resolve([]),
    voir.guides
      ? toutesLesPages<{ guide_id: string }>(
          (de, a) =>
            admin
              .from("possessions_guides")
              .select("guide_id")
              .eq("user_id", userId)
              .order("guide_id")
              .range(de, a),
          "Possessions guides",
        )
      : Promise.resolve([]),
  ]);

  return ensemble(jeux, amiibo, guides);
}

export async function GET(request: Request) {
  const jeton = process.env.SUIVI_API_TOKEN?.trim();
  if (!jeton) {
    return Response.json(
      { error: "Suivi non configuré" },
      { status: 503, headers: ENTETES },
    );
  }
  if (!verifierJetonSuivi(request.headers.get("authorization"), jeton)) {
    return Response.json(
      { error: "Non autorisé" },
      { status: 401, headers: ENTETES },
    );
  }

  const search = new URL(request.url).search;
  const marche =
    marcheDepuisTexte(new URLSearchParams(search).get("marche")) ?? "TOUS";
  const voir = voirEffectif(voirDepuisParametres(search), marche);

  const [{ jeux, consoles }, guides, amiibo, possessions] = await Promise.all([
    chargerBaseSuivi(),
    voir.guides ? chargerGuidesCatalogue() : Promise.resolve([]),
    voir.amiibo ? chargerAmiiboCatalogue() : Promise.resolve([]),
    chargerPossessionsProprietaire(voir),
  ]);

  const reponse = calculerSuivi({
    search,
    jeux,
    consoles,
    guides,
    amiibo,
    possessions,
    baseUrlSupabase: supabaseEnv().url,
  });

  return Response.json(reponse, { headers: ENTETES });
}
