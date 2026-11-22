import { unstable_cache } from "next/cache";
import { chargerJeu } from "@/lib/fiche/charger";
import { calculerPrix } from "@/lib/prix/calcul";
import { sourcesEbay } from "@/lib/prix/ebay";

/** Durée de vie d'un prix : 6 h au plus (contrat d'eBay, DESIGN ADR-17). */
const SIX_HEURES = 6 * 60 * 60;

/** Prix d'un jeu, gardé 6 h par jeu ; une erreur n'est pas gardée (le prochain visiteur réessaie). */
const prixDuJeu = unstable_cache(
  async (consoleSlug: string, jeu: string) => {
    const fiche = await chargerJeu(consoleSlug, jeu);
    if (!fiche) return null;
    return calculerPrix(
      { console: consoleSlug, sorties: fiche.sorties },
      sourcesEbay,
    );
  },
  ["prix-ebay"],
  { revalidate: SIX_HEURES },
);

/** GET /api/prix/{console}/{jeu} (US-25) : demandé par la fiche, dans le navigateur, après l'affichage. */
export async function GET(
  _: Request,
  ctx: { params: Promise<{ console: string; jeu: string }> },
) {
  const { console: consoleSlug, jeu } = await ctx.params;
  try {
    const prix = await prixDuJeu(consoleSlug, jeu);
    if (!prix)
      return Response.json({ erreur: "Jeu introuvable" }, { status: 404 });
    return Response.json(prix, {
      headers: { "Cache-Control": `public, s-maxage=${SIX_HEURES}` },
    });
  } catch (e) {
    console.error(
      "Prix eBay indisponible :",
      e instanceof Error ? e.message : e,
    );
    return Response.json(
      { erreur: "eBay indisponible" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
