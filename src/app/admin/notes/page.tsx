import type { Metadata } from "next";
import Link from "next/link";
import { AnalyseNotes } from "@/components/AnalyseNotes";
import { consoleChoisie } from "@/lib/admin/consoles";
import { exigerProprietaire } from "@/lib/auth/proprietaire";

export const metadata: Metadata = {
  title: "Notes Metacritic · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Un lot de 20 articles Wikipédia : quelques secondes ; marge sur la durée des actions (Vercel).
export const maxDuration = 60;

/** Notes Metacritic d'une console depuis Wikipédia (US-17, ADR-08). Page réservée au propriétaire (proxy /admin). */
export default async function PageNotes({
  searchParams,
}: {
  searchParams: Promise<{ console?: string }>;
}) {
  const supabase = await exigerProprietaire();
  const { data: consoles } = await supabase
    .from("consoles")
    .select("slug, nom")
    .order("ordre");
  const choisie = consoleChoisie(consoles ?? [], (await searchParams).console);

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
          Notes Metacritic
        </h1>
        <p className="text-sm text-texte-doux">
          Lit la note Metacritic citée par les articles Wikipédia anglais. Une
          note n&apos;est retenue que si elle est celle de la console du jeu ;
          sinon le jeu est signalé, à saisir à la main dans sa fiche. Les notes
          saisies à la main ne sont jamais remplacées.
        </p>
      </section>
      <nav aria-label="Console" className="flex flex-wrap gap-1.5">
        {(consoles ?? []).map((c) => (
          <Link
            key={c.slug}
            href={`/admin/notes?console=${c.slug}`}
            aria-current={c.slug === choisie?.slug ? "page" : undefined}
            className={`flex h-9 items-center rounded-full border px-3.5 text-[13px] ${
              c.slug === choisie?.slug
                ? "border-texte bg-texte font-semibold text-inverse"
                : "border-champ bg-carte font-medium"
            }`}
          >
            {c.nom}
          </Link>
        ))}
      </nav>
      {choisie && (
        <AnalyseNotes
          key={choisie.slug}
          consoleSlug={choisie.slug}
          consoleNom={choisie.nom}
        />
      )}
    </main>
  );
}
