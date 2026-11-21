/** Page de connexion (US-09), commune au propriétaire et aux collectionneurs invités (US-20). */
export const PAGE_CONNEXION = "/admin/connexion";
/** Accueil de l'administration. */
export const PAGE_ADMIN = "/admin";
/** Accueil du site, où va un collectionneur connecté (son profil arrivera avec US-22). */
export const PAGE_ACCUEIL = "/";

/** Qui fait la requête (ADR-16) : personne, un collectionneur invité, ou le propriétaire. */
export type EtatCompte = "anonyme" | "collectionneur" | "proprietaire";

function estDans(pathname: string, prefixe: string): boolean {
  return pathname === prefixe || pathname.startsWith(`${prefixe}/`);
}

/**
 * Où envoyer une requête selon la page demandée et le compte (US-09, ADR-16).
 * Le site est public (ADR-01) : seules les pages /admin sont concernées.
 * - non connecté sur une page d'administration → connexion
 * - collectionneur sur une page d'administration, connexion comprise → accueil (l'administration lui est fermée)
 * - propriétaire déjà connecté sur la connexion → administration
 * - sinon : on laisse passer (null)
 */
export function redirectionAdmin(
  pathname: string,
  compte: EtatCompte,
): typeof PAGE_CONNEXION | typeof PAGE_ADMIN | typeof PAGE_ACCUEIL | null {
  if (!estDans(pathname, PAGE_ADMIN)) return null;
  const surConnexion = estDans(pathname, PAGE_CONNEXION);
  if (compte === "anonyme") return surConnexion ? null : PAGE_CONNEXION;
  if (compte === "collectionneur") return PAGE_ACCUEIL;
  return surConnexion ? PAGE_ADMIN : null;
}
