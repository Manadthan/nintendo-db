"use server";

import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { preparerApercu, type Apercu } from "@/lib/import/apercu";
import { lireIgdbEnv } from "@/lib/import/env";
import {
  creerClientIgdb,
  rapprocher,
  type Rapprochement,
} from "@/lib/import/igdb";
import { lireListeWikipediaDetaillee, urlRendu } from "@/lib/import/wikipedia";

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
