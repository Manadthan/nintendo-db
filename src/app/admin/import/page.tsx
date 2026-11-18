import type { Metadata } from "next";
import Link from "next/link";
import { AnalyseImport } from "@/components/AnalyseImport";

export const metadata: Metadata = {
  title: "Import · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Un lot de 10 jeux (scans à convertir) prend quelques secondes : marge sur la durée des actions de cette page (Vercel).
export const maxDuration = 60;

/** Consoles importables (étape 8) : leurs sources, telles que la page les présente. */
const CONSOLES = {
  "wii-u": {
    nom: "Wii U",
    sources: "la liste Wikipédia et la base GameTDB",
    description:
      "Lit la liste Wikipédia, garde les jeux sortis en boîte d'après GameTDB (titres japonais, scans de boîtes, codes produit).",
  },
  wii: {
    nom: "Wii",
    sources: "la base GameTDB",
    description:
      "Lit la base GameTDB seule (SPEC v1.9) : jeux du commerce dont au moins une boîte est éditée par Nintendo, titres par région, dates, genres, faces avant des boîtes.",
  },
  ds: {
    nom: "DS",
    sources: "la base GameTDB",
    description:
      "Lit la base GameTDB seule (SPEC v1.10) : cartes du commerce dont au moins une est éditée par Nintendo, sans démos ni rééditions, titres par région, dates, genres, scans des boîtes.",
  },
  "3ds": {
    nom: "3DS",
    sources: "la base GameTDB",
    description:
      "Lit la base GameTDB seule (SPEC v1.10) : cartes du commerce dont au moins une est éditée par Nintendo, sans jeux Super Nintendo ni eShop, titres par région, dates, genres, scans des boîtes.",
  },
  switch: {
    nom: "Switch",
    sources: "la base GameTDB",
    description:
      "Lit la base GameTDB seule (SPEC v1.11) : cartouches du commerce dont au moins une est éditée par Nintendo ; une cartouche mondiale vaut pour les 3 régions (même date, même code), avec la boîte de chaque région.",
  },
  "switch-2": {
    nom: "Switch 2",
    sources: "la liste Wikipédia",
    description:
      "Lit la liste Wikipédia seule (SPEC v1.11, GameTDB n'a pas de base Switch 2) : jeux édités par Nintendo, datés au jour près, une date pour les 3 régions. Décoche « en boîte » les jeux vendus seulement en téléchargement ; ajoute les jaquettes à la main (page Jaquettes).",
    caseEnBoite: true,
  },
} as const;

type Slug = keyof typeof CONSOLES;

// Aperçu de l'import d'une console (US-10, #34 ; Wii : étape 8). Page réservée au propriétaire (proxy /admin, US-09).
export default async function PageImport({
  searchParams,
}: {
  searchParams: Promise<{ console?: string }>;
}) {
  const demandee = (await searchParams).console;
  const slug: Slug =
    demandee && demandee in CONSOLES ? (demandee as Slug) : "wii-u";
  const laConsole = CONSOLES[slug];

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
          Import {laConsole.nom}
        </h1>
        <p className="text-sm text-texte-doux">
          {laConsole.description} L&apos;analyse{" "}
          <strong>n&apos;enregistre rien</strong> : elle montre ce que
          l&apos;import ferait.
        </p>
      </section>
      {/* key : changer de console repart d'un aperçu vide. */}
      <AnalyseImport
        key={slug}
        consoleSlug={slug}
        consoleNom={laConsole.nom}
        sources={laConsole.sources}
        caseEnBoite={"caseEnBoite" in laConsole && laConsole.caseEnBoite}
      />
    </main>
  );
}
