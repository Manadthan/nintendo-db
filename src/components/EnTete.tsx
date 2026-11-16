import Link from "next/link";

/** En-tête des pages publiques (maquettes 1 et 2) : nom du site, Catalogue, À propos. */
export function EnTete({ surCatalogue = false }: { surCatalogue?: boolean }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-bordure bg-carte px-4">
      <Link
        href="/"
        className="font-titre text-[19px] font-bold tracking-tight"
      >
        Nintendo DB
      </Link>
      <nav aria-label="Navigation principale" className="flex gap-1 text-sm">
        <Link
          href="/"
          aria-current={surCatalogue ? "page" : undefined}
          className="flex h-11 items-center px-2.5 font-semibold"
        >
          Catalogue
        </Link>
        {/* La page À propos arrive avec US-07 (étape 7). */}
        <span className="flex h-11 items-center px-2.5 text-texte-doux">
          À propos
        </span>
      </nav>
    </header>
  );
}
