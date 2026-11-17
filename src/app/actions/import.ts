"use server";

import { revalidatePath } from "next/cache";
import { capturer, type Resultat } from "@/lib/import/resultat";
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
  type JeuEnBase,
  type SourceJaquette,
} from "@/lib/import/donnees";
import {
  BUCKET_GAMETDB,
  CHEMIN_BASE_GAMETDB,
  lireGameTdb,
  regrouperGameTdb,
} from "@/lib/import/gametdb";
import { convertirEnWebp } from "@/lib/import/jaquettes";
import { appliquerGameTdb, type JeuAImporter } from "@/lib/import/physique";
import { lireListeWikipediaDetaillee, urlRendu } from "@/lib/import/wikipedia";
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
    .select("id, wikipedia_liste, games(slug)")
    .eq("slug", consoleSlug)
    .single();
  if (error || !data) throw new Error(`Console « ${consoleSlug} » introuvable`);
  if (!data.wikipedia_liste)
    throw new Error(
      `Console « ${consoleSlug} » : liste Wikipédia non renseignée`,
    );
  return data;
}

async function telecharger(url: string, source: string): Promise<Response> {
  const reponse = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
    // Message clair plutôt qu'un dépassement de la limite de 60 s de Vercel (#53).
    signal: AbortSignal.timeout(20_000),
  }).catch((e: unknown) => {
    throw new Error(`${source} injoignable`, { cause: e });
  });
  if (!reponse.ok)
    throw new Error(`${source} indisponible (HTTP ${reponse.status})`);
  return reponse;
}

/** Fichier déposé par le relais GameTDB (#53) dans le bucket privé, lu avec la session du propriétaire. */
async function lireRelais(chemin: string): Promise<Blob> {
  const supabase = await exigerProprietaire();
  const { data, error } = await supabase.storage
    .from(BUCKET_GAMETDB)
    .download(chemin);
  if (error || !data)
    throw new Error(
      `Relais GameTDB : « ${chemin} » absent (lancer la tâche GitHub « Relais GameTDB »)`,
      { cause: error ?? undefined },
    );
  return data;
}

/**
 * Étape 1 de l'aperçu (US-10) : liste Wikipédia du jour et base GameTDB déposée par le relais (#53), puis règle
 * du physique (SPEC v1.4) : régions et jeux réduits aux boîtes, compilations ajoutées. N'écrit rien.
 */
async function analyserListeInterne(consoleSlug: string): Promise<Apercu> {
  const fiche = await chargerConsole(consoleSlug);
  const [wikipedia, gametdb] = await Promise.all([
    telecharger(urlRendu(fiche.wikipedia_liste!), "Wikipédia").then((r) =>
      r.text(),
    ),
    lireRelais(CHEMIN_BASE_GAMETDB).then((b) => b.text()),
  ]);
  const liste = lireListeWikipediaDetaillee(wikipedia);
  const physique = appliquerGameTdb(
    liste.jeux,
    regrouperGameTdb(lireGameTdb(gametdb)),
  );
  return preparerApercu(
    { ...liste, ...physique },
    new Set(fiche.games.map((g) => g.slug)),
  );
}

/** Un jeu à enregistrer : ses données, telles que l'aperçu les a préparées. */
export type JeuAEnregistrer = { wikipedia: JeuAImporter };

const COLONNES_EXISTANT =
  "id, slug, developpeur, wikipedia_url, physique, verrous, releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, code_produit, verrous, jaquette_path, jaquette_source)";

/**
 * Enregistre un lot de 10 jeux au plus (US-10, ADR-03), piloté par le navigateur : jeux et sorties (corrections
 * manuelles gardées), puis scans de boîtes GameTDB copiés en WebP (ADR-04). Une erreur sur un jeu n'arrête pas
 * le lot.
 */
async function enregistrerLotInterne(
  consoleSlug: string,
  jeux: JeuAEnregistrer[],
  recopierJaquettes = false,
): Promise<ResultatEnregistrement[]> {
  if (jeux.length > 10) throw new Error("Lot trop grand (10 jeux au plus)");
  const fiche = await chargerConsole(consoleSlug);
  const supabase = await exigerProprietaire();

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
  for (const { wikipedia } of jeux) {
    const titre = wikipedia.titres.PAL || wikipedia.titres.US;
    const existant = existants.get(wikipedia.slug) ?? null;
    try {
      const jeu = construireJeu(wikipedia);
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
        ? Object.fromEntries(
            REGIONS.map((r) => [
              r,
              {
                path: existant.releases[r]?.jaquette_path ?? null,
                source: existant.releases[r]?.jaquette_source ?? null,
              },
            ]),
          )
        : null;
      const choix = choisirJaquettes(
        jeu,
        wikipedia.disques,
        existantes,
        recopierJaquettes,
      );
      const copiees = await copierJaquettes(supabase, gameId!, choix);

      // Régions sorties dont la jaquette finale n'est pas un scan ni un ajout manuel : à remplacer (R6).
      const sansScan = REGIONS.filter((r) => {
        if (!jeu.releases[r].sortie) return false;
        const source = copiees[r] ?? existantes?.[r]?.source ?? null;
        return source === null || source === "igdb";
      });
      resultats.push({
        slug: wikipedia.slug,
        titre,
        statut: existant ? "mis-a-jour" : "ajoute",
        jaquettes: Object.keys(copiees).length,
        sansScan,
        ecarts: fusion.ecarts,
      });
    } catch (e) {
      resultats.push({
        slug: wikipedia.slug,
        titre,
        statut: "erreur",
        jaquettes: 0,
        sansScan: [],
        ecarts: [],
        erreur: e instanceof Error ? e.message : "erreur inconnue",
      });
    }
  }
  return resultats;
}

/**
 * Copie les scans choisis (ADR-04) : scan déposé par le relais GameTDB (#53) → WebP 300, 600 et 768 px → bucket
 * « jaquettes ». Rend les régions copiées ; un scan absent du relais laisse la jaquette actuelle (ou la vignette
 * neutre), signalée « sans scan » dans le résumé.
 */
async function copierJaquettes(
  supabase: Awaited<ReturnType<typeof exigerProprietaire>>,
  gameId: string,
  choix: Record<Region, string | null>,
): Promise<Partial<Record<Region, SourceJaquette>>> {
  const copiees: Partial<Record<Region, SourceJaquette>> = {};
  for (const region of REGIONS) {
    const chemin = choix[region];
    if (!chemin) continue;
    let tailles: Awaited<ReturnType<typeof convertirEnWebp>>;
    try {
      const scan = Buffer.from(await (await lireRelais(chemin)).arrayBuffer());
      tailles = await convertirEnWebp(scan);
    } catch {
      continue; // Scan absent du relais (GameTDB n'en a pas) ou illisible.
    }
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
        jaquette_source: "gametdb",
      })
      .eq("game_id", gameId)
      .eq("region", region);
    if (error) throw new Error(`Jaquette ${region} : ${error.message}`);
    copiees[region] = "gametdb";
  }
  return copiees;
}

/**
 * Supprime les jeux qui ne sont plus retenus (sans boîte Nintendo, SPEC v1.4), sur confirmation dans l'aperçu :
 * leurs jaquettes, puis le jeu (ses sorties suivent). Rend les titres supprimés.
 */
async function supprimerJeuxInterne(
  consoleSlug: string,
  slugs: string[],
): Promise<string[]> {
  const fiche = await chargerConsole(consoleSlug);
  const supabase = await exigerProprietaire();
  const { data, error } = await supabase
    .from("games")
    .select("id, slug, releases(region, titre)")
    .eq("console_id", fiche.id)
    .in("slug", slugs);
  if (error) throw new Error(`Lecture des jeux à supprimer : ${error.message}`);

  const supprimes: string[] = [];
  for (const jeu of data ?? []) {
    const chemins = REGIONS.flatMap((r) =>
      TAILLES_JAQUETTE.map((t) => cheminJaquette(jeu.id, r, t)),
    );
    const { error: e1 } = await supabase.storage
      .from(BUCKET_JAQUETTES)
      .remove(chemins);
    if (e1) throw new Error(`Jaquettes de « ${jeu.slug} » : ${e1.message}`);
    const { error: e2 } = await supabase
      .from("games")
      .delete()
      .eq("id", jeu.id);
    if (e2) throw new Error(`Suppression de « ${jeu.slug} » : ${e2.message}`);
    supprimes.push(
      jeu.releases.find((r) => r.region === "PAL")?.titre ??
        jeu.releases.find((r) => r.titre)?.titre ??
        jeu.slug,
    );
  }
  return supprimes;
}

/** Fin de l'import : résumé gardé dans import_runs, catalogue et fiches régénérés (ADR-02). */
async function terminerImportInterne(
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

// Actions appelées par le navigateur : erreurs rendues, pas lancées (#53, voir resultat.ts).
export async function analyserListe(
  consoleSlug: string,
): Promise<Resultat<Apercu>> {
  return capturer(() => analyserListeInterne(consoleSlug));
}
export async function enregistrerLot(
  consoleSlug: string,
  jeux: JeuAEnregistrer[],
  recopierJaquettes = false,
): Promise<Resultat<ResultatEnregistrement[]>> {
  return capturer(() =>
    enregistrerLotInterne(consoleSlug, jeux, recopierJaquettes),
  );
}
export async function supprimerJeux(
  consoleSlug: string,
  slugs: string[],
): Promise<Resultat<string[]>> {
  return capturer(() => supprimerJeuxInterne(consoleSlug, slugs));
}
export async function terminerImport(
  consoleSlug: string,
  resume: ResumeEnregistrement,
): Promise<Resultat<void>> {
  return capturer(() => terminerImportInterne(consoleSlug, resume));
}
