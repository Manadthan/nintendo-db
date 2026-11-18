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

/**
 * Téléchargement du relais (18/11/2026 : GameTDB a dépassé le délai de 30 s et tout le relais s'est arrêté). Un
 * délai dépassé, une coupure ou une erreur serveur (5xx) sont réessayés ; un fichier absent (404, scan inexistant)
 * rend null tout de suite. Après tous les essais, l'erreur nomme l'adresse.
 */
export async function telechargerAvecReessais(
  url: string,
  {
    lire = (u: string) =>
      fetch(u, {
        headers: {
          "User-Agent": "nintendo-db/1.0 (https://nintendo-db.vercel.app)",
        },
        signal: AbortSignal.timeout(60_000),
      }),
    essais = 3,
    attente = 5000,
  }: {
    lire?: (url: string) => Promise<Response>;
    essais?: number;
    attente?: number;
  } = {},
): Promise<Uint8Array | null> {
  return avecReessais(
    async () => {
      let reponse: Response;
      try {
        reponse = await lire(url);
      } catch (e) {
        const raison = e instanceof Error ? e.message : String(e);
        throw new Error(`${url} : ${raison}`, { cause: e });
      }
      if (reponse.status >= 500)
        throw new Error(`${url} : HTTP ${reponse.status}`);
      if (!reponse.ok) return null;
      return new Uint8Array(await reponse.arrayBuffer());
    },
    { essais, attente },
  );
}
