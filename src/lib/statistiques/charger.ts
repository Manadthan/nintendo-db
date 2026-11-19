import "server-only";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { ensemble } from "@/lib/collection/collection";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { JeuStat } from "./statistiques";

/** Lignes lues par page : Supabase n'en renvoie pas plus de 1 000 à la fois. */
const PAGE = 1000;

async function toutesLesPages<T>(
  lire: (
    de: number,
    a: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const lignes: T[] = [];
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await lire(de, de + PAGE - 1);
    if (error) throw new Error(`Statistiques illisibles : ${error.message}`);
    lignes.push(...(data ?? []));
    if (!data || data.length < PAGE) return lignes;
  }
}

type LigneJeu = {
  id: string;
  metacritic_note: number | null;
  consoles: { slug: string; nom: string };
  releases: { region: Region; sortie: boolean; titre: string | null }[];
};

/** Titre affiché : celui de la première version sortie, dans l'ordre US, PAL, JAP. */
const titre = (l: LigneJeu) =>
  (["US", "PAL", "JAP"] as const)
    .map((r) => l.releases.find((s) => s.region === r && s.sortie)?.titre)
    .find(Boolean) ?? "Sans titre";

/** Jeux, consoles et possessions du compte connecté (US-18, ADR-11), lus à l'ouverture de la page. */
export async function chargerStatistiques() {
  const supabase = await exigerProprietaire();
  const [lignes, consoles, possessions] = await Promise.all([
    toutesLesPages<LigneJeu>((de, a) =>
      supabase
        .from("games")
        .select(
          "id, metacritic_note, consoles!inner(slug, nom), releases(region, sortie, titre)",
        )
        .order("id")
        .range(de, a)
        .overrideTypes<LigneJeu[], { merge: false }>(),
    ),
    supabase.from("consoles").select("slug, nom").order("ordre"),
    toutesLesPages<{ game_id: string; region: Region }>((de, a) =>
      supabase
        .from("possessions")
        .select("game_id, region")
        .order("game_id")
        .order("region")
        .range(de, a),
    ),
  ]);
  if (consoles.error)
    throw new Error(`Consoles illisibles : ${consoles.error.message}`);
  const jeux: JeuStat[] = lignes.map((l) => ({
    id: l.id,
    titre: titre(l),
    console: { slug: l.consoles.slug, nom: l.consoles.nom },
    metacritic: l.metacritic_note,
    sorties: REGIONS.filter(
      (r) => l.releases.find((s) => s.region === r)?.sortie,
    ),
  }));
  return {
    jeux,
    consoles: consoles.data ?? [],
    possessions: ensemble(possessions),
  };
}
