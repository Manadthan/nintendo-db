import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormulaireJaquette } from "@/components/FormulaireJaquette";
import { FormulairePhoto } from "@/components/FormulairePhoto";
import { Jaquette } from "@/components/Jaquette";
import { regionDepuisAdresse } from "@/lib/admin/jaquettes";
import { SOURCES_JAQUETTE } from "@/lib/fiche/fiche";
import { chargerJeu } from "@/lib/fiche/charger";

export const metadata: Metadata = {
  title: "Remplacer une jaquette · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Téléchargement et conversion de l'image : quelques secondes (Vercel).
export const maxDuration = 30;

/** Remplacer la jaquette d'une sortie (US-12) : par l'adresse d'une image, ou par une photo. */
export default async function PageRemplacerJaquette({
  params,
}: {
  params: Promise<{ jeu: string; region: string }>;
}) {
  const { jeu: slug, region: brut } = await params;
  const region = regionDepuisAdresse(brut);
  const jeu = region ? await chargerJeu("wii-u", slug) : null;
  if (!jeu || !region || !jeu.sorties[region].sortie) notFound();
  const sortie = jeu.sorties[region];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-6">
      <Link
        href="/admin/jaquettes"
        className="flex h-11 items-center gap-1 text-sm font-medium"
      >
        <span aria-hidden="true">‹</span> Jaquettes
      </Link>
      <section className="flex flex-col gap-1.5">
        <h1 className="font-titre text-[22px] leading-tight font-bold tracking-tight">
          {sortie.titre}
        </h1>
        <p className="text-sm text-texte-doux">
          Version {region} · jaquette actuelle :{" "}
          {sortie.sourceJaquette
            ? SOURCES_JAQUETTE[sortie.sourceJaquette]
            : "aucune"}
        </p>
      </section>
      <div className="mx-auto w-[180px]">
        <Jaquette
          sortie={sortie}
          titre={sortie.titre ?? slug}
          console={jeu.console.nom}
          sizes="180px"
        />
      </div>
      <FormulaireJaquette gameId={jeu.id} slug={slug} region={region} />
      <p className="text-center text-xs font-semibold tracking-wide text-texte-discret uppercase">
        ou
      </p>
      <FormulairePhoto gameId={jeu.id} slug={slug} region={region} />
    </main>
  );
}
