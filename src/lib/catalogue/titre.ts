import type { VersionAffichee } from "./types";

/**
 * Titre affiché dans le catalogue (US-03, SPEC v1.56) : pour une version japonaise, le titre romanisé lorsqu'il est
 * renseigné, sinon le titre tel quel (repli pour les jeux sans romanisation et les guides japonais). La fiche jeu
 * conserve le titre japonais avec le romanisé dessous.
 */
export function titreAffiche(v: VersionAffichee): string {
  if (v.region === "JAP") {
    const romanise = v.sortie.titreRomanise?.trim();
    if (romanise) return romanise;
  }
  return v.sortie.titre ?? v.jeu.slug;
}
