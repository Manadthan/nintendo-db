import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireAjout } from "@/components/FormulaireAjout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jeux · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

/** Liste des jeux à corriger (US-11), triée par titre ; ajout d'un jeu manquant. Réservée au propriétaire. */
export default async function PageJeux({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string }>;
}) {
  const { supprime } = await searchParams;
  const { data, error } = await (
    await createSupabaseServerClient()
  )
    .from("games")
    .select("slug, consoles!inner(slug), releases(region, titre)")
    .eq("consoles.slug", "wii-u");
  if (error) throw new Error(`Jeux illisibles : ${error.message}`);
  const jeux = (data ?? [])
    .map((j) => ({
      slug: j.slug,
      titre:
        j.releases.find((r) => r.region === "PAL")?.titre ??
        j.releases.find((r) => r.region === "US")?.titre ??
        j.releases.find((r) => r.titre)?.titre ??
        j.slug,
    }))
    .sort((a, b) => a.titre.localeCompare(b.titre, "fr"));

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
          Jeux
        </h1>
        <p className="text-sm text-texte-doux">
          {jeux.length} jeux. Un champ corrigé ici n&apos;est plus remplacé par
          l&apos;import.
        </p>
      </section>
      {supprime && (
        <p
          role="status"
          className="rounded-xl border border-bordure bg-accent-doux p-3 text-sm"
        >
          « {supprime} » a été supprimé.
        </p>
      )}
      <FormulaireAjout />
      <ul
        aria-label="Jeux"
        className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte"
      >
        {jeux.map((j) => (
          <li
            key={j.slug}
            className="border-t border-separateur first:border-t-0"
          >
            <Link
              href={`/admin/jeux/${j.slug}`}
              className="flex min-h-11 items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold"
            >
              {j.titre}
              <span aria-hidden="true" className="text-texte-discret">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
