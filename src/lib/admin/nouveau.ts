import { REGIONS, type Region } from "@/lib/catalogue/types";
import { slugifier } from "@/lib/import/wikipedia";

/** Verrou d'un jeu ajouté à la main (US-11) : absent des sources, l'import ne le supprime jamais. */
export const VERROU_MANUEL = "manuel";

export type NouveauJeu = {
  slug: string;
  titre: string;
  regions: Region[];
};

/** Adresse stable d'un nouveau jeu (ADR-06), tirée du titre, sans doublon : « zelda », « zelda-2 »… */
export function slugDisponible(titre: string, existants: Set<string>): string {
  const base = slugifier(titre) || "jeu";
  if (!existants.has(base)) return base;
  for (let n = 2; ; n++)
    if (!existants.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Vérifie la saisie « Ajouter un jeu » : un titre, au moins une région où il est sorti en boîte. */
export function lireNouveauJeu(
  formData: FormData,
  existants: Set<string>,
): { ok: true; jeu: NouveauJeu } | { ok: false; erreur: string } {
  const titre = String(formData.get("titre") ?? "").trim();
  const regions = REGIONS.filter((r) => formData.get(`region.${r}`) === "on");
  if (!titre) return { ok: false, erreur: "Saisis le titre du jeu." };
  if (titre.length > 300)
    return { ok: false, erreur: "Titre trop long (300 caractères au plus)." };
  if (!regions.length)
    return {
      ok: false,
      erreur: "Coche au moins une région où le jeu est sorti en boîte.",
    };
  return {
    ok: true,
    jeu: { slug: slugDisponible(titre, existants), titre, regions },
  };
}
