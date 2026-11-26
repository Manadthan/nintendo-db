import { unstable_cache } from "next/cache";
import { chargerAmiibo } from "@/lib/amiibo/charger";
import { estSlugAmiibo } from "@/lib/amiibo/fiche";
import { aujourdhuiParis, sortieAVenir } from "@/lib/catalogue/a-venir";
import { calculerPrixAmiibo } from "@/lib/prix/amiibo";
import { sourcesEbay } from "@/lib/prix/ebay";

/** Durée de vie d'un prix : 6 h au plus (contrat d'eBay, DESIGN ADR-17). */
const SIX_HEURES = 6 * 60 * 60;

/** Prix d'un amiibo, gardé 6 h par amiibo ; une erreur n'est pas gardée (le prochain visiteur réessaie). */
const prixDeLAmiibo = unstable_cache(
  async (slug: string) => {
    const amiibo = await chargerAmiibo(slug);
    if (!amiibo) return null;
    const jour = aujourdhuiParis();
    // Une région annoncée mais pas encore sortie n'a pas de prix (US-32), comme pour un jeu.
    const sortie = (r: "JAP" | "US" | "PAL") => {
      const s = amiibo.sorties[r];
      return s.sortie && !sortieAVenir(s.date, s.precision, jour);
    };
    return calculerPrixAmiibo(
      {
        nom: amiibo.nom,
        type: amiibo.type,
        sorties: { JAP: sortie("JAP"), US: sortie("US"), PAL: sortie("PAL") },
      },
      sourcesEbay,
    );
  },
  ["prix-ebay-amiibo"],
  { revalidate: SIX_HEURES },
);

/** GET /api/prix/amiibo/{slug} (US-29, ADR-21 point 6) : demandé par la fiche de l'amiibo, après l'affichage. */
export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  try {
    const prix = estSlugAmiibo(slug) ? await prixDeLAmiibo(slug) : null;
    if (!prix)
      return Response.json({ erreur: "Amiibo introuvable" }, { status: 404 });
    return Response.json(prix, {
      headers: { "Cache-Control": `public, s-maxage=${SIX_HEURES}` },
    });
  } catch (e) {
    console.error(
      "Prix eBay de l'amiibo indisponible :",
      e instanceof Error ? e.message : e,
    );
    return Response.json(
      { erreur: "eBay indisponible" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
