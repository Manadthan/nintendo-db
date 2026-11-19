/**
 * Liste Jeux de l'administration, filtre « sans code produit » (US-18 2/2) : un jeu y figure si une de ses versions
 * sorties n'a pas de code produit.
 */
export type FiltreJeux = "tous" | "sans-code";

export const lireFiltreJeux = (brut: string | undefined): FiltreJeux =>
  brut === "sans-code" ? "sans-code" : "tous";

export const sansCodeProduit = (
  releases: { sortie: boolean; code_produit: string | null }[],
) => releases.some((r) => r.sortie && !r.code_produit);
