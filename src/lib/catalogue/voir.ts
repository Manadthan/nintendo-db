import type { Marche, VersionAffichee } from "./types";

/**
 * Coches « Jeux », « Guides » (US-27) et « Amiibo » (US-29) du catalogue, dans l'adresse (`?voir=guides`,
 * `?voir=jeux,amiibo`…) comme le tri : le défaut (« Jeux » seule) n'ajoute rien. On ne peut pas tout décocher.
 */
export type Voir = { jeux: boolean; guides: boolean; amiibo: boolean };
export type Coche = keyof Voir;

/** Ordre des coches, dans la barre comme dans l'adresse. */
export const COCHES: readonly Coche[] = ["jeux", "guides", "amiibo"];
const PARAMETRE = "voir";

// Toujours le même objet pour un même choix (`useSyncExternalStore` compare par référence).
const choix = new Map<string, Voir>();
function stable(voir: Voir): Voir {
  const cle = COCHES.filter((c) => voir[c]).join(",");
  let objet = choix.get(cle);
  if (!objet) {
    objet = { jeux: voir.jeux, guides: voir.guides, amiibo: voir.amiibo };
    choix.set(cle, objet);
  }
  return objet;
}

export const VOIR_PAR_DEFAUT: Voir = stable({
  jeux: true,
  guides: false,
  amiibo: false,
});

/** Choix lu dans les paramètres d'une adresse ; inconnu, vide ou absent : « Jeux » seule. */
export function voirDepuisParametres(recherche: string): Voir {
  const valeurs = (new URLSearchParams(recherche).get(PARAMETRE) ?? "").split(
    ",",
  );
  const voir = {
    jeux: valeurs.includes("jeux"),
    guides: valeurs.includes("guides"),
    amiibo: valeurs.includes("amiibo"),
  };
  // Sans guides ni amiibo, l'adresse ne dit rien de plus que le défaut.
  return voir.guides || voir.amiibo ? stable(voir) : VOIR_PAR_DEFAUT;
}

/** Paramètres de l'adresse avec ce choix, les autres gardés. */
export function avecVoir(recherche: string, voir: Voir): string {
  const params = new URLSearchParams(recherche);
  if (!voir.guides && !voir.amiibo) params.delete(PARAMETRE);
  else params.set(PARAMETRE, COCHES.filter((c) => voir[c]).join(","));
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/** Les guides sont japonais : seulement sur les marchés « Tous » et « Japon » (US-27). */
export const guidesPermis = (marche: Marche) =>
  marche === "TOUS" || marche === "JAP";

/**
 * Ce qui s'affiche vraiment : sur un autre marché, « Guides » est grisée ; s'il ne reste rien de coché, les jeux
 * reviennent. Les amiibo valent pour tous les marchés (US-29).
 */
export function voirEffectif(voir: Voir, marche: Marche): Voir {
  if (guidesPermis(marche) || !voir.guides) return voir;
  const sans = { ...voir, guides: false };
  return sans.jeux || sans.amiibo ? stable(sans) : VOIR_PAR_DEFAUT;
}

/** Bascule d'une coche ; la dernière cochée ne se décoche pas. */
export function basculer(voir: Voir, coche: Coche): Voir {
  const suivant = { ...voir, [coche]: !voir[coche] };
  return COCHES.some((c) => suivant[c]) ? stable(suivant) : voir;
}

const pluriel = (n: number, mot: string, motPluriel = `${mot}s`) =>
  `${n} ${n > 1 ? motPluriel : mot}`;

/**
 * Compteur sous la barre d'outils : « 4 jeux affichés sur 4 » (Jeux seule) ; sinon ce qui est coché, seulement :
 * « 48 jeux et 31 guides affichés » (US-27), « 1126 jeux, 31 guides et 954 amiibo affichés » (US-29).
 */
export function libelleCompte(
  versions: readonly VersionAffichee[],
  voir: Voir,
  totalJeux: number,
): string {
  const guides = versions.filter((v) => v.guide).length;
  const amiibo = versions.filter((v) => v.amiibo).length;
  const jeux = versions.length - guides - amiibo;
  const affiches = `affiché${versions.length > 1 ? "s" : ""}`;
  if (!voir.guides && !voir.amiibo)
    return `${pluriel(jeux, "jeu", "jeux")} ${affiches} sur ${totalJeux}`;
  const parties = [
    voir.jeux && pluriel(jeux, "jeu", "jeux"),
    voir.guides && pluriel(guides, "guide"),
    voir.amiibo && `${amiibo} amiibo`,
  ].filter((p): p is string => !!p);
  const liste =
    parties.length > 1
      ? `${parties.slice(0, -1).join(", ")} et ${parties.at(-1)}`
      : parties[0];
  return `${liste} ${affiches}`;
}

/** Choix en cours, lu dans l'adresse. */
export const lireVoir = (): Voir =>
  voirDepuisParametres(window.location.search);

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient les composants quand le choix change. */
export function abonnerVoir(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Enregistre le choix dans l'adresse, sans recharger la page, et prévient les composants. */
export function enregistrerVoir(voir: Voir) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${avecVoir(search, voir)}${hash}`,
  );
  for (const rappel of abonnes) rappel();
}
