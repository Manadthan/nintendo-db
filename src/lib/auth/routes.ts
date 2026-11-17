/** Page de connexion du propriétaire (US-09) : atteinte par le lien discret « Administration » du pied de page. */
export const PAGE_CONNEXION = "/admin/connexion";
/** Accueil de l'administration. */
export const PAGE_ADMIN = "/admin";

function estDans(pathname: string, prefixe: string): boolean {
  return pathname === prefixe || pathname.startsWith(`${prefixe}/`);
}

/**
 * Où envoyer une requête selon la page demandée et l'état de connexion (US-09).
 * Le site est public (ADR-01) : seules les pages /admin sont concernées.
 * - non connecté sur une page d'administration → connexion
 * - déjà connecté sur la connexion → administration
 * - sinon : on laisse passer (null)
 */
export function redirectionAdmin(
  pathname: string,
  connecte: boolean,
): typeof PAGE_CONNEXION | typeof PAGE_ADMIN | null {
  if (!estDans(pathname, PAGE_ADMIN)) return null;
  const surConnexion = estDans(pathname, PAGE_CONNEXION);
  if (!connecte && !surConnexion) return PAGE_CONNEXION;
  if (connecte && surConnexion) return PAGE_ADMIN;
  return null;
}
