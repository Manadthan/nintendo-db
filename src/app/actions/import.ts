"use server";

import { revalidatePath } from "next/cache";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import {
  preparerApercu,
  type Apercu,
  type ResultatEnregistrement,
  type ResumeEnregistrement,
} from "@/lib/import/apercu";
import {
  choisirJaquettes,
  construireJeu,
  fusionner,
  type JaquetteChoisie,
  type JeuEnBase,
} from "@/lib/import/donnees";
import { lireIgdbEnv } from "@/lib/import/env";
import {
  creerClientIgdb,
  rapprocher,
  urlImageIgdb,
  versInfosIgdb,
  type Rapprochement,
} from "@/lib/import/igdb";
import { convertirEnWebp, telechargerImageIgdb } from "@/lib/import/jaquettes";
import {
  lireListeWikipediaDetaillee,
  urlRendu,
  type JeuWikipedia,
} from "@/lib/import/wikipedia";
import {
  BUCKET_JAQUETTES,
  TAILLES_JAQUETTE,
  cheminJaquette,
} from "@/lib/jaquettes/stockage";

// Identification demandée par Wikimedia aux programmes qui lisent ses pages (aucune donnée personnelle).
const USER_AGENT = "nintendo-db/1.0 (https://nintendo-db.vercel.app)";

async function chargerConsole(consoleSlug: string) {
  const supabase = await exigerProprietaire();
  const { data, error } = await supabase
    .from("consoles")
    .select("id, wikipedia_liste, igdb_platform_id, games(slug)")
    .eq("slug", consoleSlug)
    .single();
  if (error || !data) throw new Error(`Console « ${consoleSlug} » introuvable`);
  if (!data.wikipedia_liste || !data.igdb_platform_id) {
    throw new Error(
      `Console « ${consoleSlug} » : liste Wikipédia ou plateforme IGDB non renseignée`,
    );
  }
  return data;
}

/** Étape 1 de l'aperçu (US-10) : lit la liste Wikipédia du jour. N'écrit rien. */
export async function analyserListe(consoleSlug: string): Promise<Apercu> {
  const fiche = await chargerConsole(consoleSlug);
  const reponse = await fetch(urlRendu(fiche.wikipedia_liste!), {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!reponse.ok)
    throw new Error(`Wikipédia indisponible (HTTP ${reponse.status})`);
  const liste = lireListeWikipediaDetaillee(await reponse.text());
  return preparerApercu(liste, new Set(fiche.games.map((g) => g.slug)));
}

export type RapprochementLeger = { slug: string } & Pick<
  Rapprochement,
  "statut" | "candidats"
> & {
    jeu: { id: number; name: string } | null;
  };

/** Étape 2 (lot de 10 au plus, piloté par le navigateur) : rapproche chaque jeu d'IGDB. N'écrit rien. */
export async function rapprocherLot(
  consoleSlug: string,
  jeux: { slug: string; titres: { US: string; PAL: string } }[],
): Promise<RapprochementLeger[]> {
  if (jeux.length > 10) throw new Error("Lot trop grand (10 jeux au plus)");
  const fiche = await chargerConsole(consoleSlug);
  const client = creerClientIgdb(lireIgdbEnv(process.env));

  const resultats: RapprochementLeger[] = [];
  for (const jeu of jeux) {
    const titres = [...new Set([jeu.titres.US, jeu.titres.PAL])];
    const trouves = await client.chercher(
      jeu.titres.US,
      fiche.igdb_platform_id!,
    );
    const r = rapprocher(titres, trouves);
    resultats.push({
      slug: jeu.slug,
      statut: r.statut,
      jeu: r.jeu ? { id: r.jeu.id, name: r.jeu.name } : null,
      candidats: r.candidats,
    });
  }
  return resultats;
}

/** Un jeu à enregistrer : ses données Wikipédia (aperçu) et le jeu IGDB retenu (sûr ou choisi à la main). */
export type JeuAEnregistrer = {
  wikipedia: JeuWikipedia;
  igdbId: number | null;
};

const COLONNES_EXISTANT =
  "id, slug, developpeur, wikipedia_url, igdb_id, physique, verrous, releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, verrous, jaquette_path)";

/**
 * Enregistre un lot de 10 jeux au plus (US-10, ADR-03), piloté par le navigateur : jeux et sorties (corrections
 * manuelles gardées), puis jaquettes IGDB copiées en WebP (ADR-04). Une erreur sur un jeu n'arrête pas le lot.
 */
export async function enregistrerLot(
  consoleSlug: string,
  jeux: JeuAEnregistrer[],
): Promise<ResultatEnregistrement[]> {
  if (jeux.length > 10) throw new Error("Lot trop grand (10 jeux au plus)");
  const fiche = await chargerConsole(consoleSlug);
  const supabase = await exigerProprietaire();

  const ids = jeux
    .map((j) => j.igdbId)
    .filter((id): id is number => id !== null);
  const trouves = await creerClientIgdb(lireIgdbEnv(process.env)).parIds(ids);
  const infosIgdb = new Map(trouves.map((r) => [r.id, versInfosIgdb(r)]));

  const { data: lignes, error } = await supabase
    .from("games")
    .select(COLONNES_EXISTANT)
    .eq("console_id", fiche.id)
    .in(
      "slug",
      jeux.map((j) => j.wikipedia.slug),
    );
  if (error)
    throw new Error(`Lecture des jeux existants impossible : ${error.message}`);
  const existants = new Map(
    (lignes ?? []).map((l) => [
      l.slug,
      {
        ...l,
        releases: Object.fromEntries(l.releases.map((r) => [r.region, r])),
      } as JeuEnBase,
    ]),
  );

  const resultats: ResultatEnregistrement[] = [];
  for (const { wikipedia, igdbId } of jeux) {
    const titre = wikipedia.titres.PAL || wikipedia.titres.US;
    const existant = existants.get(wikipedia.slug) ?? null;
    try {
      const infos = igdbId !== null ? (infosIgdb.get(igdbId) ?? null) : null;
      const jeu = construireJeu(wikipedia, infos);
      const fusion = fusionner(existant, jeu);

      let gameId = existant?.id;
      if (existant) {
        const { error: e } = await supabase
          .from("games")
          .update(fusion.game)
          .eq("id", existant.id);
        if (e) throw new Error(e.message);
      } else {
        const { data, error: e } = await supabase
          .from("games")
          .insert({
            ...fusion.game,
            console_id: fiche.id,
            slug: wikipedia.slug,
          })
          .select("id")
          .single();
        if (e || !data) throw new Error(e?.message ?? "jeu non créé");
        gameId = data.id;
      }

      const { error: e } = await supabase.from("releases").upsert(
        REGIONS.map((region) => ({
          game_id: gameId!,
          region,
          ...fusion.releases[region],
        })),
        { onConflict: "game_id,region" },
      );
      if (e) throw new Error(e.message);

      const existantes = existant
        ? (Object.fromEntries(
            REGIONS.map((r) => [
              r,
              existant.releases[r]?.jaquette_path ?? null,
            ]),
          ) as Record<Region, string | null>)
        : null;
      const choix = choisirJaquettes(jeu, infos, existantes);
      const copiees = await copierJaquettes(supabase, gameId!, choix);

      resultats.push({
        slug: wikipedia.slug,
        titre,
        statut: existant ? "mis-a-jour" : "ajoute",
        jaquettes: copiees,
        secours: REGIONS.filter((r) => choix[r]?.secours),
        ecarts: fusion.ecarts,
      });
    } catch (e) {
      resultats.push({
        slug: wikipedia.slug,
        titre,
        statut: "erreur",
        jaquettes: 0,
        secours: [],
        ecarts: [],
        erreur: e instanceof Error ? e.message : "erreur inconnue",
      });
    }
  }
  return resultats;
}

/** Copie les jaquettes choisies : une image IGDB → WebP 300 et 600 px → bucket « jaquettes » (ADR-04). */
async function copierJaquettes(
  supabase: Awaited<ReturnType<typeof exigerProprietaire>>,
  gameId: string,
  choix: Record<Region, JaquetteChoisie>,
): Promise<number> {
  const converties = new Map<
    string,
    Awaited<ReturnType<typeof convertirEnWebp>>
  >();
  let copiees = 0;
  for (const region of REGIONS) {
    const c = choix[region];
    if (!c) continue;
    if (!converties.has(c.imageId)) {
      converties.set(
        c.imageId,
        await convertirEnWebp(
          await telechargerImageIgdb(urlImageIgdb(c.imageId, "t_1080p")),
        ),
      );
    }
    const tailles = converties.get(c.imageId)!;
    for (const taille of TAILLES_JAQUETTE) {
      const { error } = await supabase.storage
        .from(BUCKET_JAQUETTES)
        .upload(cheminJaquette(gameId, region, taille), tailles[taille], {
          contentType: "image/webp",
          upsert: true,
        });
      if (error) throw new Error(`Jaquette ${region} : ${error.message}`);
    }
    const { error } = await supabase
      .from("releases")
      .update({
        jaquette_path: `${gameId}/${region.toLowerCase()}`,
        jaquette_source: "igdb",
      })
      .eq("game_id", gameId)
      .eq("region", region);
    if (error) throw new Error(`Jaquette ${region} : ${error.message}`);
    copiees++;
  }
  return copiees;
}

/** Fin de l'import : résumé gardé dans import_runs, catalogue et fiches régénérés (ADR-02). */
export async function terminerImport(
  consoleSlug: string,
  resume: ResumeEnregistrement,
): Promise<void> {
  const fiche = await chargerConsole(consoleSlug);
  const supabase = await exigerProprietaire();
  const { error } = await supabase
    .from("import_runs")
    .insert({ console_id: fiche.id, resume });
  if (error)
    throw new Error(`Résumé de l'import non enregistré : ${error.message}`);
  revalidatePath("/", "layout");
}
