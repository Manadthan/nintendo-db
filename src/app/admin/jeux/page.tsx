import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireAjout } from "@/components/FormulaireAjout";
import { SelecteurConsole } from "@/components/SelecteurConsole";
import { lireFiltreJeux, sansCodeProduit } from "@/lib/admin/codes";
import { consoleChoisie } from "@/lib/admin/consoles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jeux · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

/** Jeux d'une console à corriger (US-11 ; console au choix, étape 8), triés par titre ; ajout d'un jeu manquant. */
export default async function PageJeux({
  searchParams,
}: {
  searchParams: Promise<{
    supprime?: string;
    console?: string;
    filtre?: string;
  }>;
}) {
  const { supprime, console: demandee, filtre: brut } = await searchParams;
  const filtre = lireFiltreJeux(brut);
  const supabase = await createSupabaseServerClient();
  const { data: consoles } = await supabase
    .from("consoles")
    .select("slug, nom")
    .order("ordre");
  const laConsole = consoleChoisie(consoles ?? [], demandee);
  if (!laConsole) throw new Error("Aucune console en base");
  const { data, error } = await supabase
    .from("games")
    .select(
      "slug, consoles!inner(slug), releases(region, titre, sortie, code_produit)",
    )
    .eq("consoles.slug", laConsole.slug);
  if (error) throw new Error(`Jeux illisibles : ${error.message}`);
  const jeux = (data ?? [])
    .filter((j) => filtre === "tous" || sansCodeProduit(j.releases))
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
          {jeux.length} jeux {laConsole.nom}
          {filtre === "sans-code" && " sans code produit"}. Un champ corrigé ici
          n&apos;est plus remplacé par l&apos;import.
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
      <SelecteurConsole
        consoles={consoles ?? []}
        active={laConsole.slug}
        adresse={(slug) => `/admin/jeux?console=${slug}&filtre=${filtre}`}
      />
      <nav
        aria-label="Filtre"
        className="grid grid-cols-2 gap-1 rounded-xl bg-segment p-1 text-sm"
      >
        {(
          [
            ["tous", "Tous"],
            ["sans-code", "Sans code produit"],
          ] as const
        ).map(([valeur, libelle]) => (
          <Link
            key={valeur}
            href={`/admin/jeux?console=${laConsole.slug}&filtre=${valeur}`}
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
      <FormulaireAjout console={laConsole} />
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
              href={`/admin/jeux/${laConsole.slug}/${j.slug}`}
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
