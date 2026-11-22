/**
 * Client Supabase du navigateur, chargé seulement quand il sert (audit de performance du 22/11/2026, règle
 * `bundle-conditional`) : la bibliothèque pèse ≈ 71 Ko compressés, 27 % du code de l'accueil. Un visiteur sans
 * cookie de session n'en a pas besoin pour savoir qu'il n'est pas connecté.
 */

/** Cookie de session posé par @supabase/ssr : `sb-{projet}-auth-token`, éventuellement découpé (`.0`, `.1`…). */
const COOKIE_SESSION = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/;

export function aCookieDeSession(cookies: string): boolean {
  return COOKIE_SESSION.test(cookies);
}

/** Le client, chargé à la demande (écriture d'une case « Je l'ai », par un compte déjà connecté). */
export async function clientNavigateur() {
  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
  return createSupabaseBrowserClient();
}

/** Le client si un cookie de session existe ; sinon `null`, sans rien télécharger. */
export async function clientSiSession() {
  if (typeof document === "undefined" || !aCookieDeSession(document.cookie))
    return null;
  return clientNavigateur();
}
