import Link from "next/link";
import { BoutonCompte } from "./BoutonCompte";
import { BoutonTheme } from "./BoutonTheme";
import { Logo } from "./Logo";

/** Lien icône de la navigation : nom pour les lecteurs d'écran et en infobulle, page courante en couleur. */
function LienIcone({
  href,
  libelle,
  courant,
  children,
}: {
  href: string;
  libelle: string;
  courant: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={libelle}
      title={libelle}
      aria-current={courant ? "page" : undefined}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
        courant ? "bg-accent-doux text-accent-fonce" : "text-texte-doux"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </Link>
  );
}

/**
 * En-tête des pages publiques (maquettes 1 et 2) : logo et nom du site, puis des icônes (SPEC v1.15, demande du
 * propriétaire : place pour l'icône de compte sur 375 px) : Catalogue, À propos, thème (US-08), compte (US-09).
 */
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
      <nav aria-label="Navigation principale" className="flex items-center">
        {/* Fiches et 404 : « Catalogue » reste la page courante, comme dans la maquette de la fiche. */}
        <LienIcone href="/" libelle="Catalogue" courant={page !== "a-propos"}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </LienIcone>
        <LienIcone
          href="/a-propos"
          libelle="À propos"
          courant={page === "a-propos"}
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5" />
          <path d="M12 7.6v.1" strokeWidth="2.6" />
        </LienIcone>
        <BoutonTheme />
        <BoutonCompte />
      </nav>
    </header>
  );
}
