import type { Metadata } from "next";
import Link from "next/link";
import { AnalyseImport } from "@/components/AnalyseImport";

export const metadata: Metadata = {
  title: "Import · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Un lot de 10 jeux (scans à convertir) prend quelques secondes : marge sur la durée des actions de cette page (Vercel).
export const maxDuration = 60;

// Aperçu de l'import Wii U (US-10, #34). Page réservée au propriétaire (proxy /admin, US-09).
export default function PageImport() {
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
          Import Wii U
        </h1>
        <p className="text-sm text-texte-doux">
          Lit la liste Wikipédia, garde les jeux sortis en boîte d&apos;après
          GameTDB (titres japonais, scans de boîtes, codes produit).
          L&apos;analyse <strong>n&apos;enregistre rien</strong> : elle montre
          ce que l&apos;import ferait.
        </p>
      </section>
      <AnalyseImport consoleSlug="wii-u" consoleNom="Wii U" />
    </main>
  );
}
