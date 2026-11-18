"use server";

import { revalidatePath } from "next/cache";
import { capturer, type Resultat } from "@/lib/import/resultat";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { VERROU_MANUEL } from "@/lib/admin/nouveau";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import {
  appliquerComparaisons,
  preparerApercu,
  type Apercu,
  type ResultatEnregistrement,
  type ResumeEnregistrement,
} from "@/lib/import/apercu";
import {
  choisirJaquettes,
  comparer,
  construireJeu,
  fusionner,
  type JeuEnBase,
  type SourceJaquette,
} from "@/lib/import/donnees";
import { sourceConsole } from "@/lib/import/consoles";
import {
  BUCKET_GAMETDB,
  lireGameTdb,
  regrouperGameTdb,
} from "@/lib/import/gametdb";
import { enregistrerJaquette } from "@/lib/jaquettes/enregistrer";
import { appliquerGameTdb, type JeuAImporter } from "@/lib/import/physique";
import { lireListeWikipediaDetaillee, urlRendu } from "@/lib/import/wikipedia";
import { supprimerJeuEtJaquettes } from "@/lib/jaquettes/supprimer";

// Identification demandée par Wikimedia aux programmes qui lisent ses pages (aucune donnée personnelle).
const USER_AGENT = "nintendo-db/1.0 (https://nintendo-db.vercel.app)";

async function chargerConsole(consoleSlug: string) {
  const source = sourceConsole(consoleSlug);
  const supabase = await exigerProprietaire();
  const { data, error } = await supabase
    .from("consoles")
    .select("id, wikipedia_liste, games(slug, verrous)")
    .eq("slug", consoleSlug)
    .single();
  if (error || !data) throw new Error(`Console « ${consoleSlug} » introuvable`);
  if (source.wikipedia && !data.wikipedia_liste)
    throw new Error(
      `Console « ${consoleSlug} » : liste Wikipédia non renseignée`,
    );
  return { ...data, source };
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

const COLONNES_EXISTANT =
  "id, slug, developpeur, genre, wikipedia_url, physique, verrous, releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, code_produit, verrous, jaquette_path, jaquette_source)";

/** Jeux de la console déjà en base (tous, ou ceux des slugs donnés), avec sorties et verrous, par slug. */
async function lireExistants(
  consoleId: string,
  slugs?: string[],
): Promise<Map<string, JeuEnBase>> {
  const supabase = await exigerProprietaire();
  let requete = supabase
    .from("games")
    .select(COLONNES_EXISTANT)
    .eq("console_id", consoleId);
  if (slugs) requete = requete.in("slug", slugs);
  const { data, error } = await requete;
  if (error)
    throw new Error(`Lecture des jeux existants impossible : ${error.message}`);
  return new Map(
    (data ?? []).map((l) => [
      l.slug,
      {
        ...l,
        releases: Object.fromEntries(l.releases.map((r) => [r.region, r])),
      } as JeuEnBase,
    ]),
  );
}

/**
 * Étape 1 de l'aperçu (US-10) : liste Wikipédia du jour (Wii U ; la Wii n'en a pas, SPEC v1.9) et base GameTDB
 * déposée par le relais (#53), puis règle du physique (SPEC v1.4) : régions et jeux réduits aux boîtes,
 * compilations ajoutées. Sans Wikipédia, tous les jeux viennent de GameTDB. N'écrit rien.
 */
async function analyserListeInterne(consoleSlug: string): Promise<Apercu> {
  const fiche = await chargerConsole(consoleSlug);
  const { source } = fiche;
  const [liste, gametdb] = await Promise.all([
    source.wikipedia
      ? telecharger(urlRendu(fiche.wikipedia_liste!), "Wikipédia").then(
          async (r) => lireListeWikipediaDetaillee(await r.text()),
        )
      : { jeux: [], autresEditeurs: 0, telechargeables: [] },
    lireRelais(source.base).then((b) => b.text()),
  ]);
  const physique = appliquerGameTdb(
    liste.jeux,
    regrouperGameTdb(
      lireGameTdb(gametdb, source.estDisque),
      source.longueurBase,
    ),
  );
  const apercu = preparerApercu(
    { ...liste, ...physique },
    new Set(fiche.games.map((g) => g.slug)),
    new Set(
      fiche.games
        .filter((g) => g.verrous.includes(VERROU_MANUEL))
        .map((g) => g.slug),
    ),
  );
  // Import des nouveautés (ADR-03 point 6) : nouveau, modifié ou inchangé par rapport à la base.
  const existants = await lireExistants(fiche.id);
  return appliquerComparaisons(apercu, (l) =>
    comparer(
      existants.get(l.slug) ?? null,
      construireJeu(l.wikipedia, source.prefixeCode),
      l.wikipedia.disques,
    ),
  );
}

/** Un jeu à enregistrer : ses données, telles que l'aperçu les a préparées. */
export type JeuAEnregistrer = { wikipedia: JeuAImporter };

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
  const existants = await lireExistants(
    fiche.id,
    jeux.map((j) => j.wikipedia.slug),
  );

  const resultats: ResultatEnregistrement[] = [];
  for (const { wikipedia } of jeux) {
    const titre = wikipedia.titres.PAL || wikipedia.titres.US;
    const existant = existants.get(wikipedia.slug) ?? null;
    try {
      const jeu = construireJeu(wikipedia, fiche.source.prefixeCode);
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
        fiche.source.scans,
      );
      const copiees = await copierJaquettes(
        supabase,
        gameId!,
        choix,
        existantes,
      );

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
 * « jaquettes », sous un chemin versionné (#60) : nouvelle adresse à chaque copie, donc jamais d'ancienne image
 * servie par un cache ; fichiers gardés en cache un an, puis l'ancienne jaquette est supprimée. Rend les régions
 * copiées ; un scan absent du relais laisse la jaquette actuelle (ou la vignette neutre), signalée « sans scan ».
 */
async function copierJaquettes(
  supabase: Awaited<ReturnType<typeof exigerProprietaire>>,
  gameId: string,
  choix: Record<Region, string | null>,
  anciennes: Partial<Record<Region, { path: string | null }>> | null,
): Promise<Partial<Record<Region, SourceJaquette>>> {
  const copiees: Partial<Record<Region, SourceJaquette>> = {};
  const version = Date.now().toString(36);
  for (const region of REGIONS) {
    const chemin = choix[region];
    if (!chemin) continue;
    let scan: Buffer;
    try {
      scan = Buffer.from(await (await lireRelais(chemin)).arrayBuffer());
    } catch {
      continue; // Scan absent du relais (GameTDB n'en a pas).
    }
    await enregistrerJaquette(
      supabase,
      gameId,
      region,
      scan,
      "gametdb",
      anciennes?.[region]?.path ?? null,
      version,
    );
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
    await supprimerJeuEtJaquettes(supabase, jeu.id, jeu.slug);
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
