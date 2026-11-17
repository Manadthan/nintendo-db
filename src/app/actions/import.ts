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
  type CandidatJaquette,
  type JeuEnBase,
  type SourceJaquette,
} from "@/lib/import/donnees";
import {
  URL_BASE_GAMETDB,
  lireArchiveGameTdb,
  lireGameTdb,
  regrouperGameTdb,
} from "@/lib/import/gametdb";
import { lireIgdbEnv } from "@/lib/import/env";
import {
  creerClientIgdb,
  rapprocher,
  urlImageIgdb,
  versInfosIgdb,
  type Rapprochement,
} from "@/lib/import/igdb";
import { convertirEnWebp, telechargerImage } from "@/lib/import/jaquettes";
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

async function telecharger(url: string, source: string): Promise<Response> {
  const reponse = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!reponse.ok)
    throw new Error(`${source} indisponible (HTTP ${reponse.status})`);
  return reponse;
}

/**
 * Étape 1 de l'aperçu (US-10) : liste Wikipédia et base GameTDB du jour, puis règle du physique (SPEC v1.4) :
 * régions et jeux réduits aux boîtes, compilations ajoutées. N'écrit rien.
 */
export async function analyserListe(consoleSlug: string): Promise<Apercu> {
  const fiche = await chargerConsole(consoleSlug);
  const [wikipedia, gametdb] = await Promise.all([
    telecharger(urlRendu(fiche.wikipedia_liste!), "Wikipédia").then((r) =>
      r.text(),
    ),
    telecharger(URL_BASE_GAMETDB, "GameTDB").then((r) => r.arrayBuffer()),
  ]);
  const liste = lireListeWikipediaDetaillee(wikipedia);
  const physique = appliquerGameTdb(
    liste.jeux,
    regrouperGameTdb(lireGameTdb(lireArchiveGameTdb(new Uint8Array(gametdb)))),
  );
  return preparerApercu(
    { ...liste, ...physique },
    new Set(fiche.games.map((g) => g.slug)),
  );
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

/** Un jeu à enregistrer : ses données (aperçu) et le jeu IGDB retenu (sûr ou choisi à la main). */
export type JeuAEnregistrer = {
  wikipedia: JeuAImporter;
  igdbId: number | null;
};

const COLONNES_EXISTANT =
  "id, slug, developpeur, wikipedia_url, igdb_id, physique, verrous, releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur, code_produit, verrous, jaquette_path, jaquette_source)";

/**
 * Enregistre un lot de 10 jeux au plus (US-10, ADR-03), piloté par le navigateur : jeux et sorties (corrections
 * manuelles gardées), puis jaquettes copiées en WebP (ADR-04) : scan GameTDB, sinon image IGDB. Une erreur sur
 * un jeu n'arrête pas le lot.
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
      const choix = choisirJaquettes(jeu, wikipedia.disques, infos, existantes);
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
 * Copie les jaquettes choisies (ADR-04) : pour chaque région, la première image disponible parmi les candidats
 * (scan GameTDB dans l'ordre des langues, puis IGDB) → WebP 300 et 600 px → bucket « jaquettes ». Rend la source
 * copiée de chaque région ; une région sans aucune image disponible garde sa jaquette actuelle.
 */
async function copierJaquettes(
  supabase: Awaited<ReturnType<typeof exigerProprietaire>>,
  gameId: string,
  choix: Record<Region, CandidatJaquette[] | null>,
): Promise<Partial<Record<Region, SourceJaquette>>> {
  const converties = new Map<
    string,
    Awaited<ReturnType<typeof convertirEnWebp>>
  >();
  const copiees: Partial<Record<Region, SourceJaquette>> = {};
  for (const region of REGIONS) {
    let trouvee: {
      source: SourceJaquette;
      tailles: Awaited<ReturnType<typeof convertirEnWebp>>;
    } | null = null;
    for (const c of choix[region] ?? []) {
      const url =
        c.source === "gametdb" ? c.url : urlImageIgdb(c.imageId, "t_1080p");
      try {
        if (!converties.has(url))
          converties.set(
            url,
            await convertirEnWebp(await telechargerImage(url)),
          );
        trouvee = { source: c.source, tailles: converties.get(url)! };
        break;
      } catch {
        // Scan absent dans cette langue (404) ou image illisible : candidat suivant.
      }
    }
    if (!trouvee) continue;
    for (const taille of TAILLES_JAQUETTE) {
      const { error } = await supabase.storage
        .from(BUCKET_JAQUETTES)
        .upload(
          cheminJaquette(gameId, region, taille),
          trouvee.tailles[taille],
          {
            contentType: "image/webp",
            upsert: true,
          },
        );
      if (error) throw new Error(`Jaquette ${region} : ${error.message}`);
    }
    const { error } = await supabase
      .from("releases")
      .update({
        jaquette_path: `${gameId}/${region.toLowerCase()}`,
        jaquette_source: trouvee.source,
      })
      .eq("game_id", gameId)
      .eq("region", region);
    if (error) throw new Error(`Jaquette ${region} : ${error.message}`);
    copiees[region] = trouvee.source;
  }
  return copiees;
}

/**
 * Supprime les jeux qui ne sont plus retenus (sans boîte Nintendo, SPEC v1.4), sur confirmation dans l'aperçu :
 * leurs jaquettes, puis le jeu (ses sorties suivent). Rend les titres supprimés.
 */
export async function supprimerJeux(
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
