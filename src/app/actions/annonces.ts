"use server";

import { revalidatePath, updateTag } from "next/cache";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { Annonce } from "@/lib/import/annonces";
import { BUCKET_GAMETDB } from "@/lib/import/gametdb";
import {
  apercuAnnonces,
  regrouperAnnonces,
  type JeuCatalogue,
  type LigneAnnonce,
} from "@/lib/import/import-annonces";
import { capturer, type Resultat } from "@/lib/import/resultat";
import { preparerBoiteNintendo } from "@/lib/jaquettes/boite-nintendo";
import { enregistrerJaquette } from "@/lib/jaquettes/enregistrer";
import { telechargerImageExterne } from "@/lib/jaquettes/telecharger";
import { seriesDuTitre } from "@/lib/series/series";
import { TAG_CATALOGUE } from "@/lib/statistiques/charger";

// Import des annonces de Nintendo (US-33, ADR-20 point 6), réservé au propriétaire : annonces déposées par le relais
// (gametdb/annonces.json), regroupées et comparées au catalogue Switch et Switch 2.

export type ApercuAnnonces = {
  luLe: string;
  sources: Record<string, number>;
  lignes: LigneAnnonce[];
};

type Supabase = Awaited<ReturnType<typeof exigerProprietaire>>;

async function lireTout(supabase: Supabase, liaisons: Record<string, string>) {
  const { data: fichier, error: e1 } = await supabase.storage
    .from(BUCKET_GAMETDB)
    .download("annonces.json");
  if (e1 || !fichier)
    throw new Error(
      "Annonces absentes : lancer le relais des annonces (scripts/relais-annonces.mjs)",
    );
  const json = JSON.parse(await fichier.text()) as {
    lu_le: string;
    sources: Record<string, number>;
    annonces: Annonce[];
  };

  const { data: consoles, error: e2 } = await supabase
    .from("consoles")
    .select(
      "id, slug, games(id, slug, releases(region, sortie, titre, date_sortie, precision_date, verrous, jaquette_path, jaquette_source))",
    )
    .in("slug", ["switch", "switch-2"]);
  if (e2) throw new Error(`Lecture du catalogue : ${e2.message}`);
  const { data: exclus, error: e3 } = await supabase
    .from("exclusions")
    .select("console_id, slug");
  if (e3) throw new Error(`Lecture des exclusions : ${e3.message}`);

  const idConsole = new Map((consoles ?? []).map((c) => [c.slug, c.id]));
  const slugConsole = new Map((consoles ?? []).map((c) => [c.id, c.slug]));
  const catalogue: JeuCatalogue[] = (consoles ?? []).flatMap((c) =>
    c.games.map((g) => ({
      id: g.id,
      slug: g.slug,
      console: c.slug,
      sorties: Object.fromEntries(g.releases.map((r) => [r.region, r])),
    })),
  );
  const jaquettes = new Map(
    (consoles ?? []).flatMap((c) =>
      c.games.map((g) => [
        g.id,
        Object.fromEntries(g.releases.map((r) => [r.region, r])),
      ]),
    ),
  );
  const lignes = apercuAnnonces(
    regrouperAnnonces(json.annonces, liaisons),
    catalogue,
    new Set(
      (exclus ?? [])
        .filter((x) => slugConsole.has(x.console_id))
        .map((x) => `${slugConsole.get(x.console_id)}|${x.slug}`),
    ),
  );
  return { json, lignes, idConsole, jaquettes };
}

async function analyserInterne(
  liaisons: Record<string, string>,
): Promise<ApercuAnnonces> {
  const supabase = await exigerProprietaire();
  const { json, lignes } = await lireTout(supabase, liaisons);
  return { luLe: json.lu_le, sources: json.sources, lignes };
}

export type ResumeAnnonces = {
  ajoutes: string[];
  misAJour: string[];
  ecartes: string[];
  jaquettes: number;
  erreurs: string[];
};

/**
 * Enregistre les jeux cochés (`garder`, clés des lignes) et écarte les décochés (`ecarter` → table `exclusions`).
 * L'aperçu est recalculé ici depuis le fichier et la base : rien de ce que le navigateur envoie n'est écrit tel quel.
 */
async function enregistrerInterne(
  liaisons: Record<string, string>,
  garder: string[],
  ecarter: string[],
): Promise<ResumeAnnonces> {
  const supabase = await exigerProprietaire();
  const { lignes, idConsole, jaquettes } = await lireTout(supabase, liaisons);
  const resume: ResumeAnnonces = {
    ajoutes: [],
    misAJour: [],
    ecartes: [],
    jaquettes: 0,
    erreurs: [],
  };

  for (const l of lignes.filter((x) => ecarter.includes(x.cle))) {
    const { error } = await supabase.from("exclusions").upsert(
      {
        console_id: idConsole.get(l.console)!,
        slug: l.slug,
        titre: l.titre,
        raison: "pas en boîte (annonce)",
      },
      { onConflict: "console_id,slug" },
    );
    if (error) resume.erreurs.push(`${l.titre} : ${error.message}`);
    else resume.ecartes.push(l.titre);
  }

  const aEcrire = lignes.filter(
    (x) =>
      garder.includes(x.cle) && (x.etat === "nouveau" || x.etat === "modifie"),
  );
  for (const l of aEcrire) {
    try {
      let gameId = l.gameId;
      if (!gameId) {
        const { data, error } = await supabase
          .from("games")
          .insert({
            console_id: idConsole.get(l.console)!,
            slug: l.slug,
            physique: true,
            series: seriesDuTitre(
              Object.values(l.annonces).map((a) => a.titre),
            ),
          })
          .select("id")
          .single();
        if (error || !data) throw new Error(error?.message ?? "jeu non créé");
        gameId = data.id;
      }
      const regions = REGIONS.filter((r) => l.sorties[r] || !l.gameId);
      const { error } = await supabase.from("releases").upsert(
        regions.map((region) => ({
          game_id: gameId!,
          region,
          ...(l.sorties[region] ?? { sortie: false }),
        })),
        { onConflict: "game_id,region" },
      );
      if (error) throw new Error(error.message);
      resume.jaquettes += await copierBoites(
        supabase,
        gameId,
        l.jaquettes,
        jaquettes.get(gameId) ?? {},
      );
      (l.gameId ? resume.misAJour : resume.ajoutes).push(l.titre);
    } catch (e) {
      resume.erreurs.push(
        `${l.titre} : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  }

  revalidatePath("/", "layout");
  updateTag(TAG_CATALOGUE);
  return resume;
}

/** Boîte du My Nintendo Store copiée en WebP (source « nintendo »), seulement là où il n'y a pas encore de jaquette. */
async function copierBoites(
  supabase: Supabase,
  gameId: string,
  adresses: Partial<Record<Region, string>>,
  enBase: Partial<Record<Region, { jaquette_path: string | null }>>,
): Promise<number> {
  let n = 0;
  for (const region of REGIONS) {
    const adresse = adresses[region];
    const deja = enBase[region];
    if (!adresse || deja?.jaquette_path) continue;
    // Image injoignable ou visuel en largeur (pas une boîte) : vignette neutre, le jeu est enregistré quand même.
    const boite = await telechargerImageExterne(adresse)
      .then(preparerBoiteNintendo)
      .catch(() => null);
    if (!boite) continue;
    await enregistrerJaquette(
      supabase,
      gameId,
      region,
      boite,
      "nintendo",
      null,
    );
    n++;
  }
  return n;
}

// Actions appelées par le navigateur : erreurs rendues, pas lancées (#53, voir resultat.ts).
export async function analyserAnnonces(
  liaisons: Record<string, string>,
): Promise<Resultat<ApercuAnnonces>> {
  return capturer(() => analyserInterne(liaisons));
}
export async function enregistrerAnnonces(
  liaisons: Record<string, string>,
  garder: string[],
  ecarter: string[],
): Promise<Resultat<ResumeAnnonces>> {
  return capturer(() => enregistrerInterne(liaisons, garder, ecarter));
}
