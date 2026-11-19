import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirectionAdmin } from "@/lib/auth/routes";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Exécuté avant chaque page /admin (US-09) :
 * 1. rafraîchit la session Supabase (cookies), pour qu'elle reste ouverte d'une visite à l'autre ;
 * 2. renvoie vers la connexion si le propriétaire n'est pas connecté.
 * Les pages publiques n'y passent pas : elles restent préparées à l'avance et rapides (ADR-02).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() vérifie la session auprès de Supabase : un cookie falsifié ne suffit pas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const destination = redirectionAdmin(request.nextUrl.pathname, user !== null);
  if (destination) {
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    // Conserve les cookies de session éventuellement rafraîchis.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
