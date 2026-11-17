import Link from "next/link";
import type { ConsoleAdmin } from "@/lib/admin/consoles";

/** Choix de la console dans l'administration (étape 8) : un lien par console, la courante marquée. */
export function SelecteurConsole({
  consoles,
  active,
  adresse,
}: {
  consoles: ConsoleAdmin[];
  active: string;
  /** Adresse d'une console, ex. (slug) => `/admin/jeux?console=${slug}`. */
  adresse: (slug: string) => string;
}) {
  if (consoles.length < 2) return null;
  return (
    <nav
      aria-label="Console"
      className="flex gap-1 rounded-xl bg-segment p-1 text-sm"
    >
      {consoles.map((c) => (
        <Link
          key={c.slug}
          href={adresse(c.slug)}
          aria-current={c.slug === active ? "page" : undefined}
          className={`flex h-10 flex-1 items-center justify-center rounded-lg ${
            c.slug === active
              ? "bg-carte font-semibold shadow-sm"
              : "text-texte-doux"
          }`}
        >
          {c.nom}
        </Link>
      ))}
    </nav>
  );
}
