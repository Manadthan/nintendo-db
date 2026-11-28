import { titreAffiche } from "./titre";
import {
  REGIONS,
  type JeuCatalogue,
  type Marche,
  type PrecisionDate,
  type VersionAffichee,
} from "./types";

/**
 * Jeux à venir (US-32, ADR-20 point 2) : « à venir » n'est jamais stocké, il se calcule depuis la date annoncée et sa
 * précision, au jour où la page est préparée (`aujourdhui`, AAAA-MM-JJ, heure de Paris).
 */

/** Date du jour à Paris, au format AAAA-MM-JJ (les pages sont refaites toutes les 5 minutes). */
export function aujourdhuiParis(maintenant: Date = new Date()): string {
  return maintenant.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

/** Une sortie annoncée est-elle encore à venir ? Une saison, un mois ou une année pas encore commencés le sont. */
export function sortieAVenir(
  date: string | null,
  precision: PrecisionDate | null,
  aujourdhui: string,
): boolean {
  if (precision === "inconnue") return true;
  if (!date) return false;
  if (precision === "annee") return date.slice(0, 4) > aujourdhui.slice(0, 4);
  if (precision === "mois") return date.slice(0, 7) > aujourdhui.slice(0, 7);
  // Saison : date_sortie est le 1er jour de la saison (ADR-20 point 3) ; elle est à venir tant qu'elle n'a pas commencé.
  return date > aujourdhui;
}

/**
 * Un jeu est à venir sur un marché si sa version de ce marché l'est ; sur « Tous », si toutes ses versions annoncées
 * le sont (un jeu déjà sorti quelque part n'est plus « à venir »).
 */
export function jeuAVenir(
  jeu: JeuCatalogue,
  marche: Marche,
  aujourdhui: string,
): boolean {
  const regions = marche === "TOUS" ? REGIONS : [marche];
  const annoncees = regions.map((r) => jeu.sorties[r]).filter((s) => s.sortie);
  return (
    annoncees.length > 0 &&
    annoncees.every((s) => sortieAVenir(s.date, s.precision, aujourdhui))
  );
}

/**
 * Clé de tri par date (ADR-20 point 3) : une date à la saison ou à l'année seule va à la fin de son année, une date
 * inconnue tout à la fin ; null si la date est vraiment absente (jeu ancien sans date).
 */
export function cleTriDate(
  date: string | null,
  precision: PrecisionDate | null,
): string | null {
  if (precision === "inconnue") return "9999-12-31";
  if (!date) return null;
  if (precision === "annee" || precision === "saison")
    return `${date.slice(0, 4)}-12-31`;
  return date;
}

/** Nombre de cartes de la bande « À venir » de l'accueil (ADR-20 point 4). */
export const CARTES_BANDE = 12;

/**
 * Jeux de la bande « À venir » (US-32) : un jeu à venir sur le marché choisi, dans la version dont la date est la plus
 * proche (sur « Tous », la plus proche des trois régions), la sortie la plus proche d'abord.
 */
export function versionsAVenir(
  jeux: JeuCatalogue[],
  marche: Marche,
  aujourdhui: string,
): VersionAffichee[] {
  const versions: VersionAffichee[] = [];
  for (const jeu of jeux) {
    if (!jeuAVenir(jeu, marche, aujourdhui)) continue;
    const regions = marche === "TOUS" ? REGIONS : [marche];
    let choisie: VersionAffichee | null = null;
    for (const region of regions) {
      const sortie = jeu.sorties[region];
      if (!sortie.sortie || !sortie.titre) continue;
      const cle = cleTriDate(sortie.date, sortie.precision) ?? "9999-12-31";
      const cleChoisie = choisie
        ? (cleTriDate(choisie.sortie.date, choisie.sortie.precision) ??
          "9999-12-31")
        : null;
      if (cleChoisie === null || cle < cleChoisie)
        choisie = { jeu, region, sortie };
    }
    if (choisie) versions.push(choisie);
  }
  const cle = (v: VersionAffichee) =>
    cleTriDate(v.sortie.date, v.sortie.precision) ?? "9999-12-31";
  return versions.sort(
    (a, b) =>
      cle(a).localeCompare(cle(b)) ||
      titreAffiche(a).localeCompare(titreAffiche(b), "fr"),
  );
}
