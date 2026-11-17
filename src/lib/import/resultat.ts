/**
 * Résultat d'une action serveur de l'import. En production, Next.js remplace le message d'une erreur lancée par
 * une action serveur par un message générique (« React error #441 ») : l'erreur est donc rendue, pas lancée, pour
 * que le propriétaire lise la vraie cause (#53). Les messages ne contiennent aucun secret.
 */
export type Resultat<T> =
  { ok: true; valeur: T } | { ok: false; erreur: string };

/** Message de l'erreur, suivi de ses causes en chaîne (« GameTDB injoignable (fetch failed (ETIMEDOUT)) »). */
function message(e: unknown): string {
  if (!(e instanceof Error)) return "Erreur inconnue";
  return e.cause instanceof Error
    ? `${e.message} (${message(e.cause)})`
    : e.message;
}

/** Côté serveur : exécute l'action et rend sa valeur, ou le message de son erreur. */
export async function capturer<T>(
  action: () => Promise<T>,
): Promise<Resultat<T>> {
  try {
    return { ok: true, valeur: await action() };
  } catch (e) {
    console.error(e);
    return { ok: false, erreur: message(e) };
  }
}

/** Côté navigateur : la valeur, ou une erreur portant le vrai message. */
export function valeur<T>(r: Resultat<T>): T {
  if (!r.ok) throw new Error(r.erreur);
  return r.valeur;
}
