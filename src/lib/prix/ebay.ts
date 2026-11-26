import "server-only";
/**
 * Accès réseau du prix eBay (US-25, DESIGN ADR-17) : jeton d'application, Browse API, taux de la BCE. Serveur
 * seulement : les clés EBAY_CLIENT_ID et EBAY_CLIENT_SECRET (variables Vercel) ne vont jamais au navigateur.
 */
import { CATEGORIE_JEUX, lireAnnonces, lireTauxBce, type Marche } from "./prix";
import type { Sources } from "./calcul";

const API = "https://api.ebay.com";
const BCE = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
/** Au-delà, eBay est tenu pour indisponible : le bloc est masqué plutôt que d'attendre. */
const DELAI_MS = 8000;

let jeton: { valeur: string; expire: number } | null = null;

/** Jeton « client credentials » (valable 2 h chez eBay), gardé 1 h 50 en mémoire. */
async function jetonEbay(): Promise<string> {
  if (jeton && jeton.expire > Date.now()) return jeton.valeur;
  const id = process.env.EBAY_CLIENT_ID?.trim();
  const secret = process.env.EBAY_CLIENT_SECRET?.trim();
  if (!id || !secret)
    throw new Error(
      "Clés eBay absentes : EBAY_CLIENT_ID, EBAY_CLIENT_SECRET (variables Vercel).",
    );
  const reponse = await fetch(`${API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: `${API}/oauth/api_scope`,
    }),
    signal: AbortSignal.timeout(DELAI_MS),
  });
  if (!reponse.ok)
    throw new Error(`Jeton eBay refusé : HTTP ${reponse.status}`);
  const corps = (await reponse.json()) as { access_token?: string };
  if (!corps.access_token) throw new Error("Jeton eBay absent de la réponse");
  jeton = { valeur: corps.access_token, expire: Date.now() + 110 * 60 * 1000 };
  return jeton.valeur;
}

export const sourcesEbay: Sources = {
  async chercher(marche: Marche, q: string, categorie = CATEGORIE_JEUX) {
    const url = new URL(`${API}/buy/browse/v1/item_summary/search`);
    url.search = new URLSearchParams({
      q,
      ...(categorie && { category_ids: categorie }),
      limit: "50",
    }).toString();
    const reponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${await jetonEbay()}`,
        "X-EBAY-C-MARKETPLACE-ID": marche,
      },
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (reponse.status === 401) jeton = null; // jeton expiré côté eBay : redemandé au prochain appel
    if (!reponse.ok)
      throw new Error(`Browse ${marche} : HTTP ${reponse.status}`);
    return lireAnnonces(await reponse.json());
  },

  async taux() {
    const reponse = await fetch(BCE, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (!reponse.ok) throw new Error(`Taux de la BCE : HTTP ${reponse.status}`);
    const taux = lireTauxBce(await reponse.text());
    if (!taux.USD || !taux.GBP) throw new Error("Taux de la BCE illisibles");
    return taux;
  },
};
