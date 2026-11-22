import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aRemplacer, type Source } from "@/lib/admin/jaquettes";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { ensemble } from "@/lib/collection/collection";
import { estFirstParty, studios } from "@/lib/catalogue/developpeurs";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import { toutesLesPages } from "@/lib/supabase/pages";
import type { Database } from "@/types/database";
import type { JeuStat } from "./statistiques";

type LigneJeu = {
  id: string;
  metacritic_note: number | null;
  developpeur: string | null;
  consoles: { slug: string; nom: string };
  releases: {
    region: Region;
    sortie: boolean;
    titre: string | null;
    code_produit: string | null;
    jaquette_path: string | null;
    jaquette_source: Source | null;
  }[];
};

/** Versions sorties, dans l'ordre JAP, US, PAL. */
const sorties = (l: LigneJeu) =>
  REGIONS.flatMap((r) => l.releases.filter((s) => s.region === r && s.sortie));

/** Titre affiché : celui de la première version sortie, dans l'ordre US, PAL, JAP. */
const titre = (l: LigneJeu) =>
  (["US", "PAL", "JAP"] as const)
    .map((r) => l.releases.find((s) => s.region === r && s.sortie)?.titre)
    .find(Boolean) ?? "Sans titre";

/** Jeux, consoles et possessions du compte connecté (US-18, ADR-11), lus à l'ouverture de la page. */
export async function chargerStatistiques() {
  return chargerCollection(await exigerProprietaire());
}

/**
 * Catalogue (lisible par tous) et possessions du compte de la session (chacun ne lit que les siennes, RLS 0012) :
 * page Statistiques du propriétaire (US-18) et Mon profil de tout compte (US-22).
 */
export async function chargerCollection(supabase: SupabaseClient<Database>) {
  const [lignes, consoles, possessions] = await Promise.all([
    toutesLesPages<LigneJeu>(
      (de, a) =>
        supabase
          .from("games")
          .select(
            "id, metacritic_note, developpeur, consoles!inner(slug, nom), releases(region, sortie, titre, code_produit, jaquette_path, jaquette_source)",
          )
          .order("id")
          .range(de, a)
          .overrideTypes<LigneJeu[], { merge: false }>(),
      "Statistiques",
    ),
    supabase.from("consoles").select("slug, nom").order("ordre"),
    toutesLesPages<{ game_id: string; region: Region }>(
      (de, a) =>
        supabase
          .from("possessions")
          .select("game_id, region")
          .order("game_id")
          .order("region")
          .range(de, a),
      "Statistiques",
    ),
  ]);
  if (consoles.error)
    throw new Error(`Consoles illisibles : ${consoles.error.message}`);
  const jeux: JeuStat[] = lignes.map((l) => ({
    id: l.id,
    titre: titre(l),
    console: { slug: l.consoles.slug, nom: l.consoles.nom },
    metacritic: l.metacritic_note,
    sorties: sorties(l).map((s) => s.region),
    sansJaquette: sorties(l)
      .filter((s) => aRemplacer(s.jaquette_path, s.jaquette_source))
      .map((s) => s.region),
    sansCode: sorties(l)
      .filter((s) => !s.code_produit)
      .map((s) => s.region),
    firstParty: studios(l.developpeur).some(estFirstParty),
  }));
  return {
    jeux,
    consoles: consoles.data ?? [],
    possessions: ensemble(possessions),
  };
}
