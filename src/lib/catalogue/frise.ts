import type { Tri, VersionAffichee } from "./types";

/** Côté d'un jeu sur la frise (SPEC v1.38) : en alternance, à gauche puis à droite de la ligne. */
export type Cote = "gauche" | "droite";

/** Une année de la frise et ses jeux, chacun avec son côté. */
export type AnneeFrise = {
  annee: string;
  jeux: { version: VersionAffichee; cote: Cote }[];
};

/** La frise ne connaît que les tris par date : A → Z et « mieux notés » deviennent « plus récents ». */
export const triFrise = (tri: Tri): Tri =>
  tri === "anciens" || tri === "recents" ? tri : "recents";

/**
 * Découpe des versions déjà triées par date en années (date de la version affichée ; « Date inconnue » sinon) et
 * place les jeux en alternance à gauche et à droite, sans recommencer à chaque année.
 */
export function decouperFrise(versions: VersionAffichee[]): AnneeFrise[] {
  const annees: AnneeFrise[] = [];
  versions.forEach((version, i) => {
    const annee = version.sortie.date?.slice(0, 4) ?? "Date inconnue";
    const cote: Cote = i % 2 === 0 ? "gauche" : "droite";
    const derniere = annees.at(-1);
    if (derniere?.annee === annee) derniere.jeux.push({ version, cote });
    else annees.push({ annee, jeux: [{ version, cote }] });
  });
  return annees;
}
