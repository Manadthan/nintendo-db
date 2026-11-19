import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { seDeconnecter } from "@/app/actions/auth";
import { PAGE_CONNEXION } from "@/lib/auth/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Accueil de l'administration (US-09). Les outils (import, corrections) arrivent aux étapes 4 et 5.
export default async function PageAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Double sécurité : le proxy a déjà redirigé, mais une page d'administration ne s'affiche jamais sans compte.
  if (!user) redirect(PAGE_CONNEXION);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-titre text-[19px] font-bold tracking-tight"
        >
          Nintendo DB
        </Link>
        <form action={seDeconnecter}>
          <button
            type="submit"
            className="h-11 rounded-[10px] border border-bordure bg-carte px-3 text-sm font-semibold"
          >
            Se déconnecter
          </button>
        </form>
      </header>
      <section className="flex flex-col gap-1.5">
        <h1 className="font-titre text-[26px] font-bold tracking-tight">
          Administration
        </h1>
        <p className="text-sm text-texte-doux">
          Connecté en tant que{" "}
          <span className="font-semibold text-texte">{user.email}</span>.
        </p>
      </section>
      <Link
        href="/admin/import"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import Wii U (Wikipédia + GameTDB)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=wii"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import Wii (GameTDB)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=n64"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import Nintendo 64 (Wikipédia)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=gba"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import Game Boy Advance (Wikipédia)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=gamecube"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import GameCube (GameTDB)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=ds"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import DS (GameTDB)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=3ds"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import 3DS (GameTDB)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=switch"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import Switch (GameTDB)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/import?console=switch-2"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Import Switch 2 (Wikipédia)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/jaquettes"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Jaquettes (repérer et remplacer)
        <span aria-hidden="true">›</span>
      </Link>
      <Link
        href="/admin/jeux"
        className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
      >
        Jeux (corriger une fiche)
        <span aria-hidden="true">›</span>
      </Link>
    </main>
  );
}
