import { normaliser } from "@/lib/recherche/normaliser";
import { cleTriDate } from "./a-venir";
import {
  REGIONS,
  type Groupe,
  type JeuCatalogue,
  type Marche,
  type PrecisionDate,
  type Region,
  type Tri,
  type VersionAffichee,
} from "./types";

/** Avec « Tous », la version affichée est PAL, sinon US, sinon JAP (US-03). */
const PREFERENCE_TOUS: readonly Region[] = ["PAL", "US", "JAP"];

/** Version d'un jeu à afficher pour un marché ; null si le jeu n'y est pas sorti. */
export function versionAffichee(
  jeu: JeuCatalogue,
  marche: Marche,
): VersionAffichee | null {
  const candidates = marche === "TOUS" ? PREFERENCE_TOUS : [marche];
  for (const region of candidates) {
    const sortie = jeu.sorties[region];
    if (sortie.sortie && sortie.titre) return { jeu, region, sortie };
  }
  return null;
}

/** Disponibilité par région, dans l'ordre JAP · US · PAL (US-02). */
export function disponibilite(
  jeu: JeuCatalogue,
): { region: Region; sorti: boolean }[] {
  return REGIONS.map((region) => ({
    region,
    sorti: jeu.sorties[region].sortie,
  }));
}

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Saison d'une date annoncée (ADR-20 point 3 : le 1er jour de la saison est enregistré). */
const SAISONS: Record<number, string> = {
  3: "Printemps",
  6: "Été",
  9: "Automne",
  12: "Hiver",
};

/**
 * Date en français, selon ce que la source connaît : « 30 mai 2014 », « mai 2014 », « 2014 », et pour un jeu annoncé
 * (US-32) « Printemps 2027 » ou « Date à venir ».
 */
export function formaterDate(
  date: string | null,
  precision: PrecisionDate | null,
): string {
  if (precision === "inconnue") return "Date à venir";
  if (!date) return "—";
  const [annee, mois, jour] = date.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  if (precision === "annee") return String(annee);
  if (precision === "saison")
    return `${SAISONS[mois] ?? MOIS[mois - 1]} ${annee}`;
  if (precision === "mois") return `${MOIS[mois - 1]} ${annee}`;
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]} ${annee}`;
}

/** Jeux sortis sur le marché choisi, triés (US-02, US-03). */
/** Tri à l'ouverture du catalogue : les plus récents d'abord (SPEC v1.31, demande du propriétaire). */
export const TRI_PAR_DEFAUT: Tri = "recents";

export function trier(
  jeux: JeuCatalogue[],
  tri: Tri,
  marche: Marche,
): VersionAffichee[] {
  return trierVersions(
    jeux
      .map((j) => versionAffichee(j, marche))
      .filter((v): v is VersionAffichee => v !== null),
    tri,
  );
}

/** Trie des versions déjà choisies, jeux et guides mêlés (US-27 : un guide n'a pas de note, il va en fin). */
export function trierVersions(
  versions: VersionAffichee[],
  tri: Tri,
): VersionAffichee[] {
  const parTitre = (a: VersionAffichee, b: VersionAffichee) =>
    normaliser(a.sortie.titre!).localeCompare(
      normaliser(b.sortie.titre!),
      "fr",
    );
  if (tri === "az") return versions.sort(parTitre);
  // Note Metacritic : la meilleure d'abord ; à égalité, et pour les jeux sans note (en fin de liste), par titre.
  if (tri === "note")
    return versions.sort(
      (a, b) =>
        (b.jeu.metacritic ?? -1) - (a.jeu.metacritic ?? -1) || parTitre(a, b),
    );
  const sens = tri === "recents" ? -1 : 1;
  // Clé de tri (ADR-20) : saison et année seule en fin d'année, date annoncée inconnue après toutes les autres ; une
  // date absente va en fin de liste, quel que soit le sens.
  const cle = (v: VersionAffichee) =>
    cleTriDate(v.sortie.date, v.sortie.precision);
  return versions.sort((a, b) => {
    const ca = cle(a);
    const cb = cle(b);
    if (!ca || !cb) return ca ? -1 : cb ? 1 : 0;
    return ca.localeCompare(cb) * sens;
  });
}

/** Tranche d'une note, aux seuils des couleurs Metacritic (US-17) et 90 pour les chefs-d'œuvre. */
export function trancheNote(note: number | null): string {
  if (note === null) return "Sans note";
  if (note >= 90) return "90 et plus";
  if (note >= 75) return "75 à 89";
  if (note >= 50) return "50 à 74";
  return "Moins de 50";
}

/**
 * Groupes par année en tri par date ; par tranche de note en tri par note ; un seul groupe sans titre en tri
 * alphabétique (US-02, US-17).
 */
export function grouperParAnnee(
  versions: VersionAffichee[],
  tri: Tri,
): Groupe[] {
  if (tri === "az") return versions.length ? [{ titre: null, versions }] : [];
  const groupes: Groupe[] = [];
  for (const v of versions) {
    const titre =
      tri === "note"
        ? trancheNote(v.jeu.metacritic)
        : v.sortie.precision === "inconnue"
          ? "Date à venir"
          : (v.sortie.date?.slice(0, 4) ?? "Date inconnue");
    const dernier = groupes.at(-1);
    if (dernier?.titre === titre) dernier.versions.push(v);
    else groupes.push({ titre, versions: [v] });
  }
  return groupes;
}
