/** Identifiants IGDB (Twitch), côté serveur uniquement : jamais de préfixe NEXT_PUBLIC_ (ADR-03). */
export type IgdbEnv = { clientId: string; clientSecret: string };

export function lireIgdbEnv(env: Record<string, string | undefined>): IgdbEnv {
  const clientId = env.IGDB_CLIENT_ID?.trim();
  const clientSecret = env.IGDB_CLIENT_SECRET?.trim();
  const manquantes = [
    !clientId && "IGDB_CLIENT_ID",
    !clientSecret && "IGDB_CLIENT_SECRET",
  ].filter(Boolean);
  if (manquantes.length) {
    throw new Error(
      `Variable(s) IGDB manquante(s) : ${manquantes.join(", ")}. En ligne : réglages Vercel → Environment Variables.`,
    );
  }
  return { clientId: clientId!, clientSecret: clientSecret! };
}
