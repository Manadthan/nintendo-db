import { normaliser } from "@/lib/recherche/normaliser";
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

/** Date en français, selon ce que la source connaît : « 30 mai 2014 », « mai 2014 » ou « 2014 ». */
export function formaterDate(
  date: string | null,
  precision: PrecisionDate | null,
): string {
  if (!date) return "—";
  const [annee, mois, jour] = date.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  if (precision === "annee") return String(annee);
  if (precision === "mois") return `${MOIS[mois - 1]} ${annee}`;
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]} ${annee}`;
}

/** Jeux sortis sur le marché choisi, triés (US-02, US-03). */
export function trier(
  jeux: JeuCatalogue[],
  tri: Tri,
  marche: Marche,
): VersionAffichee[] {
  const versions = jeux
    .map((j) => versionAffichee(j, marche))
    .filter((v): v is VersionAffichee => v !== null);
  if (tri === "az") {
    return versions.sort((a, b) =>
      normaliser(a.sortie.titre!).localeCompare(
        normaliser(b.sortie.titre!),
        "fr",
      ),
    );
  }
  const sens = tri === "recents" ? -1 : 1;
  // Une date inconnue va en fin de liste, quel que soit le sens.
  return versions.sort((a, b) => {
    if (!a.sortie.date || !b.sortie.date)
      return a.sortie.date ? -1 : b.sortie.date ? 1 : 0;
    return a.sortie.date.localeCompare(b.sortie.date) * sens;
  });
}

/** Groupes par année en tri par date ; un seul groupe sans titre en tri alphabétique (US-02). */
export function grouperParAnnee(
  versions: VersionAffichee[],
  tri: Tri,
): Groupe[] {
  if (tri === "az") return versions.length ? [{ titre: null, versions }] : [];
  const groupes: Groupe[] = [];
  for (const v of versions) {
    const titre = v.sortie.date?.slice(0, 4) ?? "Date inconnue";
    const dernier = groupes.at(-1);
    if (dernier?.titre === titre) dernier.versions.push(v);
    else groupes.push({ titre, versions: [v] });
  }
  return groupes;
}
