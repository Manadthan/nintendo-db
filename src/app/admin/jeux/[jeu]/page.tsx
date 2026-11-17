import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonSupprimerJeu } from "@/components/BoutonSupprimerJeu";
import { FormulaireCorrection } from "@/components/FormulaireCorrection";
import { REGIONS } from "@/lib/catalogue/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Corriger un jeu · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

/** Corriger la fiche d'un jeu (US-11) : champs du jeu et de ses 3 sorties. */
export default async function PageCorrection({
  params,
  searchParams,
}: {
  params: Promise<{ jeu: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { jeu: slug } = await params;
  const { nouveau } = await searchParams;
  const { data } = await (
    await createSupabaseServerClient()
  )
    .from("games")
    .select(
      "id, slug, developpeur, verrous, consoles!inner(slug), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, code_produit, editeur, verrous)",
    )
    .eq("consoles.slug", "wii-u")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  const parRegion = Object.fromEntries(data.releases.map((r) => [r.region, r]));
  const sorties = REGIONS.map((r) => ({
    region: r,
    sortie: parRegion[r]?.sortie ?? false,
    titre: parRegion[r]?.titre ?? "",
    titre_romanise: parRegion[r]?.titre_romanise ?? "",
    date_sortie: parRegion[r]?.date_sortie ?? "",
    precision_date: parRegion[r]?.precision_date ?? "jour",
    code_produit: parRegion[r]?.code_produit ?? "",
    editeur: parRegion[r]?.editeur ?? "",
    verrous: parRegion[r]?.verrous ?? [],
  }));
  const titre =
    sorties.find((s) => s.region === "PAL")?.titre ||
    sorties.find((s) => s.titre)?.titre ||
    slug;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-6">
      <Link
        href="/admin/jeux"
        className="flex h-11 items-center gap-1 text-sm font-medium"
      >
        <span aria-hidden="true">‹</span> Jeux
      </Link>
      <section className="flex flex-col gap-1.5">
        <h1 className="font-titre text-[22px] leading-tight font-bold tracking-tight">
          {titre}
        </h1>
        <Link
          href={`/jeux/wii-u/${slug}`}
          className="text-sm text-accent underline-offset-2 hover:underline"
        >
          Voir la fiche publique
        </Link>
      </section>
      {nouveau && (
        <p
          role="status"
          className="rounded-xl border border-bordure bg-accent-doux p-3 text-sm"
        >
          Jeu ajouté. Complète sa fiche, puis ajoute ses jaquettes depuis la
          page « Jaquettes ».
        </p>
      )}
      <FormulaireCorrection
        gameId={data.id}
        developpeur={data.developpeur ?? ""}
        verrousJeu={data.verrous}
        sorties={sorties}
      />
      <BoutonSupprimerJeu gameId={data.id} nom={titre} />
    </main>
  );
}
