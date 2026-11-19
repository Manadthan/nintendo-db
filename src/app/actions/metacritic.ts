"use server";

import { revalidatePath } from "next/cache";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import {
  articlesParTitre,
  lireNoteMetacritic,
  titreArticle,
  type NoteLue,
} from "@/lib/import/metacritic";
import { capturer, type Resultat } from "@/lib/import/resultat";

/**
 * Notes Metacritic d'une console depuis Wikipédia (US-17, ADR-08) : liste des jeux, lecture par lots de 20 articles
 * (une requête à l'API de Wikipédia par lot), puis enregistrement des notes trouvées. Une note ou une adresse saisie à
 * la main (verrouillée) n'est jamais remplacée.
 */
const USER_AGENT = "nintendo-db/1.0 (https://nintendo-db.vercel.app)";

export type JeuNote = {
  id: string;
  titre: string;
  article: string | null;
  note: number | null;
  verrouillee: boolean;
};

async function listerJeuxInterne(consoleSlug: string): Promise<JeuNote[]> {
  const supabase = await exigerProprietaire();
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, wikipedia_url, metacritic_note, verrous, consoles!inner(slug), releases(region, titre, titre_romanise)",
    )
    .eq("consoles.slug", consoleSlug);
  if (error) throw new Error(`Lecture des jeux impossible : ${error.message}`);
  return (data ?? [])
    .map((j) => {
      const titre = (r: string) =>
        j.releases.find((x) => x.region === r)?.titre ?? null;
      const article = titreArticle({
        wikipediaUrl: j.wikipedia_url,
        titres: {
          US: titre("US"),
          PAL: titre("PAL"),
          romanise:
            j.releases.find((x) => x.region === "JAP")?.titre_romanise ?? null,
        },
      });
      return {
        id: j.id,
        titre: titre("PAL") ?? titre("US") ?? titre("JAP") ?? j.id,
        article,
        note: j.metacritic_note,
        verrouillee: j.verrous.includes("metacritic_note"),
      };
    })
    .sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
}

async function analyserLotInterne(
  consoleSlug: string,
  articles: string[],
): Promise<Record<string, NoteLue>> {
  await exigerProprietaire();
  if (articles.length > 20)
    throw new Error("Lot trop grand (20 articles au plus)");
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    redirects: "1",
    format: "json",
    formatversion: "2",
    titles: articles.join("|"),
  });
  const reponse = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  }).catch((e: unknown) => {
    throw new Error("Wikipédia injoignable", { cause: e });
  });
  if (reponse.status === 429)
    throw new Error("Wikipédia limite le débit : réessaie dans une minute");
  if (!reponse.ok)
    throw new Error(`Wikipédia indisponible (HTTP ${reponse.status})`);
  const lire = articlesParTitre(await reponse.json());
  return Object.fromEntries(
    articles.map((a) => {
      const texte = lire(a);
      return [
        a,
        texte === null
          ? ({ statut: "sans-note", raison: "article introuvable" } as const)
          : lireNoteMetacritic(texte, consoleSlug),
      ];
    }),
  );
}

async function enregistrerNotesInterne(
  notes: { id: string; note: number; url: string | null }[],
): Promise<number> {
  const supabase = await exigerProprietaire();
  const { data, error } = await supabase
    .from("games")
    .select("id, verrous")
    .in(
      "id",
      notes.map((n) => n.id),
    );
  if (error)
    throw new Error(`Lecture des verrous impossible : ${error.message}`);
  const verrous = new Map((data ?? []).map((j) => [j.id, j.verrous]));
  let ecrites = 0;
  for (const n of notes) {
    const v = verrous.get(n.id);
    if (!v || v.includes("metacritic_note")) continue;
    if (!Number.isInteger(n.note) || n.note < 0 || n.note > 100) continue;
    const patch: { metacritic_note: number; metacritic_url?: string | null } = {
      metacritic_note: n.note,
    };
    if (!v.includes("metacritic_url")) patch.metacritic_url = n.url;
    const { error: e } = await supabase
      .from("games")
      .update(patch)
      .eq("id", n.id);
    if (e) throw new Error(e.message);
    ecrites++;
  }
  revalidatePath("/", "layout");
  return ecrites;
}

export async function listerJeuxANoter(
  consoleSlug: string,
): Promise<Resultat<JeuNote[]>> {
  return capturer(() => listerJeuxInterne(consoleSlug));
}
export async function analyserLotNotes(
  consoleSlug: string,
  articles: string[],
): Promise<Resultat<Record<string, NoteLue>>> {
  return capturer(() => analyserLotInterne(consoleSlug, articles));
}
export async function enregistrerNotes(
  notes: { id: string; note: number; url: string | null }[],
): Promise<Resultat<number>> {
  return capturer(() => enregistrerNotesInterne(notes));
}
