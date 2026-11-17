import type { Metadata } from "next";
import Link from "next/link";
import {
  vignettesJaquettes,
  type Filtre,
  type LigneJeuJaquettes,
} from "@/lib/admin/jaquettes";
import { SOURCES_JAQUETTE } from "@/lib/fiche/fiche";
import { supabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jaquettes · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

const CONSOLE = "wii-u";

/**
 * Page « Jaquettes » (US-12) : toutes les jaquettes côte à côte, pour repérer d'un coup d'œil celles qui ne sont
 * pas des scans de boîte, et un lien « Remplacer » sur chacune. Réservée au propriétaire (proxy /admin).
 */
export default async function PageJaquettes({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; remplacee?: string }>;
}) {
  const { filtre: brut, remplacee } = await searchParams;
  const filtre: Filtre = brut === "toutes" ? "toutes" : "a-remplacer";
  const { data, error } = await (
    await createSupabaseServerClient()
  )
    .from("games")
    .select(
      "slug, consoles!inner(slug), releases(region, sortie, titre, jaquette_path, jaquette_source)",
    )
    .eq("consoles.slug", CONSOLE);
  if (error) throw new Error(`Jaquettes illisibles : ${error.message}`);
  const vignettes = vignettesJaquettes(
    data as unknown as LigneJeuJaquettes[],
    filtre,
    supabaseEnv().url,
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-6">
      <Link
        href="/admin"
        className="flex h-11 items-center gap-1 text-sm font-medium"
      >
        <span aria-hidden="true">‹</span> Administration
      </Link>
      <section className="flex flex-col gap-1.5">
        <h1 className="font-titre text-[26px] font-bold tracking-tight">
          Jaquettes
        </h1>
        <p className="text-sm text-texte-doux">
          Repère les jaquettes qui ne sont pas des scans de boîte et
          remplace-les par l&apos;adresse d&apos;une image.
        </p>
      </section>

      {remplacee && (
        <p
          role="status"
          className="rounded-xl border border-bordure bg-accent-doux p-3 text-sm"
        >
          Jaquette remplacée : {remplacee}. Le site se met à jour dans quelques
          instants.
        </p>
      )}

      <nav
        aria-label="Filtre"
        className="grid grid-cols-2 gap-1 rounded-xl bg-segment p-1 text-sm"
      >
        {(
          [
            ["a-remplacer", "À remplacer"],
            ["toutes", "Toutes"],
          ] as const
        ).map(([valeur, libelle]) => (
          <Link
            key={valeur}
            href={`/admin/jaquettes?filtre=${valeur}`}
            aria-current={filtre === valeur ? "page" : undefined}
            className={`flex h-10 items-center justify-center rounded-lg ${
              filtre === valeur
                ? "bg-carte font-semibold shadow-sm"
                : "text-texte-doux"
            }`}
          >
            {libelle}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-texte-discret">
        {vignettes.length} jaquette(s)
      </p>

      <ul aria-label="Jaquettes" className="grid grid-cols-3 gap-3">
        {vignettes.map((v) => (
          <li key={`${v.slug}-${v.region}`} className="flex flex-col gap-1">
            <div className="aspect-[27/38] w-full overflow-hidden rounded-md border border-vignette-bordure bg-vignette">
              {v.srcset ? (
                // eslint-disable-next-line @next/next/no-img-element -- WebP déjà prêts (ADR-04)
                <img
                  srcSet={v.srcset}
                  sizes="110px"
                  alt={`Jaquette de ${v.titre} (${v.region})`}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-1 text-center text-[11px] text-texte-doux">
                  Aucune jaquette
                </div>
              )}
            </div>
            <span className="line-clamp-2 text-xs leading-tight font-semibold">
              {v.titre}
            </span>
            <span className="text-[11px] text-texte-discret">
              {v.region} · {v.source ? SOURCES_JAQUETTE[v.source] : "aucune"}
            </span>
            <Link
              href={`/admin/jaquettes/${v.slug}/${v.region.toLowerCase()}`}
              className="flex h-11 items-center justify-center rounded-lg border border-champ bg-carte text-xs font-semibold"
            >
              Remplacer
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
