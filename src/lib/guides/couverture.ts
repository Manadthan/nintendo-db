// Couverture d'un guide (SPEC v1.52 US-27, DESIGN ADR-19 point 2 révisé) : la copie d'Amazon Japon (bucket public
// `guides`) d'abord, sinon Google Books (servie par Google, jamais copiée), sinon la vignette neutre.
import { supabaseEnv } from "@/lib/supabase/env";
import { adresseCouverture } from "./guides";

export type Couverture =
  { source: "amazon"; chemin: string } | { source: "google"; id: string };

/** Couverture affichée depuis les colonnes `couverture` et `google_books_id` ; null : vignette neutre. */
export function choisirCouverture(
  copie: string | null,
  googleBooksId: string | null,
): Couverture | null {
  if (copie) return { source: "amazon", chemin: copie };
  if (googleBooksId) return { source: "google", id: googleBooksId };
  return null;
}

/** Adresse de l'image, affichable dans une balise <img>. */
export function adresseCouvertureGuide(
  couverture: Couverture,
  baseUrl?: string,
): string {
  if (couverture.source === "google") return adresseCouverture(couverture.id);
  const base = (baseUrl ?? supabaseEnv().url).replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/guides/${couverture.chemin}`;
}
