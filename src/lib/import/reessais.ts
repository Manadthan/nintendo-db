// Réessais du relais GameTDB (#92) : un envoi vers Supabase peut échouer de façon passagère (erreur sans message,
// relais du 17/11/2026). Utilisé par scripts/relais-gametdb.mjs : imports relatifs seulement, pas d'alias « @/ ».

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Lance `action` jusqu'à `essais` fois, en attendant `attente` ms, puis le double, entre deux essais. Rend son
 * résultat, ou lance la dernière erreur, précédée du nombre d'essais.
 */
export async function avecReessais<T>(
  action: () => Promise<T>,
  { essais = 3, attente = 2000 }: { essais?: number; attente?: number } = {},
): Promise<T> {
  let derniere: unknown;
  for (let n = 1; n <= essais; n++) {
    try {
      return await action();
    } catch (e) {
      derniere = e;
      if (n < essais) await pause(attente * 2 ** (n - 1));
    }
  }
  const message =
    derniere instanceof Error ? derniere.message : String(derniere);
  throw new Error(`${message} (après ${essais} essais)`, { cause: derniere });
}

type ErreurStockage = {
  message?: string;
  status?: number | string;
  statusCode?: number | string;
  originalError?: { status?: number };
};

/** Message lisible d'une erreur du stockage Supabase : message (ou « sans message ») et code HTTP s'il est connu. */
export function decrireErreurStockage(erreur: ErreurStockage): string {
  const message = erreur.message?.trim() || "erreur sans message";
  const statut =
    erreur.status ?? erreur.statusCode ?? erreur.originalError?.status;
  return statut === undefined ? message : `${message} (HTTP ${statut})`;
}
