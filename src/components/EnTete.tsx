import Link from "next/link";
import { BoutonTheme } from "./BoutonTheme";
import { Logo } from "./Logo";

/** En-tête des pages publiques (maquettes 1 et 2) : logo et nom du site, Catalogue, À propos, thème (US-08). */
export function EnTete({ page }: { page?: "catalogue" | "a-propos" }) {
  return (
    <header className="flex h-14 items-center justify-between gap-1 border-b border-bordure bg-carte pr-1 pl-4">
      <Link
        href="/"
        className="flex items-center gap-2 font-titre text-[19px] font-bold tracking-tight"
      >
        <Logo />
        Nintendo DB
      </Link>
      <nav
        aria-label="Navigation principale"
        className="flex items-center text-sm"
      >
        <Link
          href="/"
          aria-current={page === "catalogue" ? "page" : undefined}
          className={`flex h-11 items-center px-2 ${
            // Fiches et 404 : « Catalogue » reste en gras, comme dans la maquette de la fiche.
            page === "a-propos" ? "text-texte-doux" : "font-semibold"
          }`}
        >
          Catalogue
        </Link>
        <Link
          href="/a-propos"
          aria-current={page === "a-propos" ? "page" : undefined}
          className={`flex h-11 items-center px-2 ${
            page === "a-propos" ? "font-semibold" : "text-texte-doux"
          }`}
        >
          À propos
        </Link>
        <BoutonTheme />
      </nav>
    </header>
  );
}
