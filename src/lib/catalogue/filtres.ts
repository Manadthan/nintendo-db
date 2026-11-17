import { REGIONS, type Region, type VersionAffichee } from "./types";

/** Disponibilité (US-06) : sorti dans les 3 régions, ou exclusif à une région. */
export type FiltreDisponibilite = "TOUTES" | Region;

/** Filtres du catalogue (US-06) : null = pas de filtre sur ce critère. */
export type Filtres = {
  /** Adresse de la console (étape 8, US-01). */
  console: string | null;
  disponibilite: FiltreDisponibilite | null;
  annee: string | null;
  genre: string | null;
};

export const SANS_FILTRE: Filtres = {
  console: null,
  disponibilite: null,
  annee: null,
  genre: null,
};

/** Choix de disponibilité, dans l'ordre d'affichage. */
export const DISPONIBILITES: readonly {
  valeur: FiltreDisponibilite;
  libelle: string;
}[] = [
  { valeur: "TOUTES", libelle: "Sorti dans les 3 régions" },
  { valeur: "JAP", libelle: "Exclusif au Japon" },
  { valeur: "US", libelle: "Exclusif à l'Amérique du Nord" },
  { valeur: "PAL", libelle: "Exclusif à l'Europe" },
];

/** Paramètres de l'adresse de chaque filtre (comme `?q=` et `?marche=` : une vue filtrée se partage). */
const PARAMETRES = {
  console: "console",
  disponibilite: "dispo",
  annee: "annee",
  genre: "genre",
} as const satisfies Record<keyof Filtres, string>;

/** Année de la version affichée (celle du marché choisi, comme les groupes par année). */
const annee = (v: VersionAffichee) => v.sortie.date?.slice(0, 4) ?? null;

function disponible(v: VersionAffichee, d: FiltreDisponibilite): boolean {
  const sorties = REGIONS.filter((r) => v.jeu.sorties[r].sortie);
  return d === "TOUTES"
    ? sorties.length === REGIONS.length
    : sorties.length === 1 && sorties[0] === d;
}

/** Versions qui passent tous les filtres actifs (US-06 : filtres combinables). */
export function filtrer(
  versions: VersionAffichee[],
  filtres: Filtres,
): VersionAffichee[] {
  return versions.filter(
    (v) =>
      (!filtres.console || v.jeu.console.slug === filtres.console) &&
      (!filtres.disponibilite || disponible(v, filtres.disponibilite)) &&
      (!filtres.annee || annee(v) === filtres.annee) &&
      (!filtres.genre || v.jeu.genres.includes(filtres.genre)),
  );
}

/** Consoles proposées : celles qui ont des jeux affichés, dans l'ordre donné (chronologique), avec leur nombre. */
export function consolesProposees(
  versions: VersionAffichee[],
  ordre: { slug: string; nom: string }[],
): { slug: string; nom: string; nombre: number }[] {
  return ordre
    .map((c) => ({
      ...c,
      nombre: versions.filter((v) => v.jeu.console.slug === c.slug).length,
    }))
    .filter((c) => c.nombre > 0);
}

/** Années proposées : celles des versions affichées, de la plus ancienne à la plus récente. */
export function anneesProposees(versions: VersionAffichee[]): string[] {
  return [...new Set(versions.map(annee).filter((a) => a !== null))].sort();
}

/** Genres proposés : ceux des jeux affichés, par ordre alphabétique. */
export function genresProposes(versions: VersionAffichee[]): string[] {
  return [...new Set(versions.flatMap((v) => v.jeu.genres))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

/** Nombre de filtres actifs (affiché sur le bouton « Filtres »). */
export const nombreActifs = (f: Filtres) =>
  Object.values(f).filter((v) => v !== null).length;

/** Filtres lus dans les paramètres de l'adresse ; une valeur inconnue est ignorée. */
export function filtresDepuisParametres(recherche: string): Filtres {
  const params = new URLSearchParams(recherche);
  const dispo = params.get(PARAMETRES.disponibilite)?.toUpperCase();
  const an = params.get(PARAMETRES.annee);
  const console_ = params.get(PARAMETRES.console);
  return {
    console:
      console_ && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(console_) ? console_ : null,
    disponibilite:
      DISPONIBILITES.find((d) => d.valeur === dispo)?.valeur ?? null,
    annee: an && /^\d{4}$/.test(an) ? an : null,
    genre: params.get(PARAMETRES.genre)?.trim() || null,
  };
}

/** Paramètres de l'adresse avec les filtres, en gardant les autres (recherche, marché). */
export function avecFiltres(recherche: string, filtres: Filtres): string {
  const params = new URLSearchParams(recherche);
  // `?dispo=jap` comme `?marche=jap` ; le genre garde sa casse (« Plates-formes 3D »).
  const valeurs = {
    ...filtres,
    disponibilite: filtres.disponibilite?.toLowerCase() ?? null,
  };
  for (const cle of Object.keys(PARAMETRES) as (keyof Filtres)[]) {
    const valeur = valeurs[cle];
    if (valeur) params.set(PARAMETRES[cle], valeur);
    else params.delete(PARAMETRES[cle]);
  }
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/** Filtres en cours, lus dans l'adresse. Mémorisés : `useSyncExternalStore` exige le même objet tant que rien ne change. */
let dernier: { recherche: string; filtres: Filtres } | null = null;
export function lireFiltres(): Filtres {
  const recherche = window.location.search;
  if (dernier?.recherche !== recherche)
    dernier = { recherche, filtres: filtresDepuisParametres(recherche) };
  return dernier.filtres;
}

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient les composants quand les filtres changent. */
export function abonnerFiltres(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Enregistre les filtres dans l'adresse, sans recharger la page, et prévient les composants. */
export function enregistrerFiltres(filtres: Filtres) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${avecFiltres(search, filtres)}${hash}`,
  );
  for (const rappel of abonnes) rappel();
}
