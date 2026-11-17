import Link from "next/link";

/**
 * Pied des pages publiques (US-09, SPEC v1.5) : lien discret vers l'administration. /admin mène à la connexion,
 * ou directement à l'administration si le propriétaire est déjà connecté (proxy, ADR-01). Inscriptions fermées :
 * le lien n'ouvre rien à un visiteur.
 */
export function PiedDePage() {
  return (
    <footer className="flex justify-center px-4 pt-2 pb-8">
      <Link
        href="/admin"
        prefetch={false}
        className="flex h-11 items-center px-3 text-xs text-texte-discret underline-offset-2 hover:underline"
      >
        Administration
      </Link>
    </footer>
  );
}
