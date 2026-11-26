import type { Metadata } from "next";
import Link from "next/link";
import { ImportAnnonces } from "@/components/ImportAnnonces";

export const metadata: Metadata = {
  title: "Import des annonces · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Copie des boîtes US (quelques secondes chacune) : marge sur la durée des actions de cette page (Vercel).
export const maxDuration = 60;

// Import des annonces de Nintendo (US-33). Page réservée au propriétaire (proxy /admin, US-09).
export default function PageImportAnnonces() {
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
          Import des annonces
        </h1>
        <p className="text-sm text-texte-doux">
          Jeux Switch et Switch 2 édités par Nintendo et pas encore sortis, lus
          chez Nintendo Japon, Europe et US par le relais des annonces. Ils
          entrent au catalogue avec l&apos;étiquette « À venir ». Décoche « En
          boîte » un jeu vendu seulement en téléchargement : il ne sera plus
          proposé. L&apos;analyse <strong>n&apos;enregistre rien</strong>.
        </p>
      </section>
      <ImportAnnonces />
    </main>
  );
}
