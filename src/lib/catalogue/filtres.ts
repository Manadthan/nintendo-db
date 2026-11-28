import {
  LIBELLES_TYPE,
  TYPES_AMIIBO,
  type TypeAmiibo,
} from "@/lib/amiibo/fiche";
import { jeuAVenir, sortieAVenir } from "./a-venir";
import {
  NINTENDO_FIRST_PARTY,
  cleStudio,
  estFirstParty,
  regrouperStudios,
  studios,
} from "./developpeurs";
import {
  REGIONS,
  type Marche,
  type Region,
  type VersionAffichee,
} from "./types";

/** Disponibilité (US-06) : sorti dans les 3 régions, ou exclusif à une région. */
export type FiltreDisponibilite = "TOUTES" | Region;

/** Filtres du catalogue (US-06) : null / false = pas de filtre actif (valeur par défaut). */
export type Filtres = {
  /** Adresse de la console (étape 8, US-01). */
  console: string | null;
  disponibilite: FiltreDisponibilite | null;
  annee: string | null;
  genre: string | null;
  /** Studio (nom nettoyé), ou « Nintendo (first party) » pour tous les studios internes (#89). */
  developpeur: string | null;
  /** Série (SPEC v1.37), ou « Sans série » pour les jeux qui n'en ont pas. */
  serie: string | null;
  /** Type d'amiibo (US-29, SPEC v1.54) : appliqué quand « Amiibo » est coché ; cache les jeux et guides. */
  typeAmiibo: TypeAmiibo | null;
  /** Ma collection (US-16) : appliqué par le catalogue, et seulement pour le propriétaire connecté. */
  collection: "possedes" | "manquants" | "souhaits" | null;
  /** Inclure les items à venir (US-06, US-32, SPEC v1.55) : false par défaut (« Déjà sortis uniquement » cochée). */
  inclureAVenir: boolean;
  /** Inclure les items sans image (US-06, SPEC v1.55) : false par défaut (« Avec image uniquement » cochée). */
  inclureSansImage: boolean;
};

export const SANS_FILTRE: Filtres = {
  console: null,
  disponibilite: null,
  annee: null,
  genre: null,
  developpeur: null,
  serie: null,
  typeAmiibo: null,
  collection: null,
  inclureAVenir: false,
  inclureSansImage: false,
};

/** Contexte nécessaire pour savoir si un item est déjà sorti sur le marché affiché (US-06, US-32, SPEC v1.55). */
export type ContexteFiltrage = {
  marche: Marche;
  aujourdhui: string;
};

/** Choix du filtre Série pour les jeux sans série connue (SPEC v1.37). */
export const SANS_SERIE = "Sans série";

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
  developpeur: "dev",
  serie: "serie",
  typeAmiibo: "type",
  collection: "collection",
  inclureAVenir: "avenir",
  inclureSansImage: "sans-image",
} as const satisfies Record<keyof Filtres, string>;

/** Année de la version affichée (celle du marché choisi, comme les groupes par année). */
const annee = (v: VersionAffichee) => v.sortie.date?.slice(0, 4) ?? null;

function disponible(v: VersionAffichee, d: FiltreDisponibilite): boolean {
  const sorties = REGIONS.filter((r) => v.jeu.sorties[r].sortie);
  return d === "TOUTES"
    ? sorties.length === REGIONS.length
    : sorties.length === 1 && sorties[0] === d;
}

/** Le jeu a-t-il été développé par ce studio (ou par un studio interne de Nintendo) ? */
function developpePar(v: VersionAffichee, developpeur: string): boolean {
  const liste = studios(v.jeu.developpeur);
  if (developpeur === NINTENDO_FIRST_PARTY) return liste.some(estFirstParty);
  const cle = cleStudio(developpeur);
  return liste.some((s) => cleStudio(s) === cle);
}

/**
 * Console d'une version : celle du jeu ; un amiibo (US-29) est « sur » chaque console des jeux qui le lisent.
 * Genre et Développeur cachent les amiibo : ils n'ont ni genre ni studio.
 * À l'inverse, Type d'amiibo cache les jeux et les guides.
 */
const surConsole = (v: VersionAffichee, console: string) =>
  v.amiibo
    ? v.amiibo.consoles.includes(console)
    : v.jeu.console.slug === console;

/** L'item affiché a-t-il une image (jaquette de jeu, couverture de guide, ou photo d'amiibo) ? (US-06, SPEC v1.55) */
export function aUneImage(v: VersionAffichee): boolean {
  if (v.guide) return v.guide.couverture !== null;
  if (v.amiibo) return v.amiibo.image !== null;
  return v.sortie.jaquette !== null;
}

/**
 * L'item est-il encore à venir sur ce marché ? (US-06, US-32, SPEC v1.55)
 * Jeu et amiibo suivent la même règle que la bande « À venir » (`jeuAVenir`) : déjà sorti dans une région n'est plus
 * « à venir » sur « Tous ». Un guide suit sa propre date de parution.
 */
export function estItemAVenir(
  v: VersionAffichee,
  marche: Marche,
  aujourdhui: string,
): boolean {
  if (v.guide)
    return sortieAVenir(v.sortie.date, v.sortie.precision, aujourdhui);
  return jeuAVenir(v.jeu, marche, aujourdhui);
}

/** Applique uniquement les deux coches de visibilité (« Déjà sortis uniquement », « Avec image uniquement »). */
export function filtrerVisibilite(
  versions: VersionAffichee[],
  filtres: Pick<Filtres, "inclureAVenir" | "inclureSansImage">,
  contexte: ContexteFiltrage,
): VersionAffichee[] {
  return versions.filter(
    (v) =>
      (filtres.inclureAVenir ||
        !estItemAVenir(v, contexte.marche, contexte.aujourdhui)) &&
      (filtres.inclureSansImage || aUneImage(v)),
  );
}

/** Versions qui passent tous les filtres actifs (US-06 : filtres combinables). */
export function filtrer(
  versions: VersionAffichee[],
  filtres: Filtres,
  contexte: ContexteFiltrage,
): VersionAffichee[] {
  return filtrerVisibilite(versions, filtres, contexte).filter(
    (v) =>
      (!filtres.console || surConsole(v, filtres.console)) &&
      (!filtres.disponibilite || disponible(v, filtres.disponibilite)) &&
      (!filtres.annee || annee(v) === filtres.annee) &&
      (!filtres.genre || v.jeu.genres.includes(filtres.genre)) &&
      (!filtres.developpeur || developpePar(v, filtres.developpeur)) &&
      (!filtres.serie ||
        (filtres.serie === SANS_SERIE
          ? v.jeu.series.length === 0
          : v.jeu.series.includes(filtres.serie))) &&
      (!filtres.typeAmiibo || v.amiibo?.type === filtres.typeAmiibo),
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
      nombre: versions.filter((v) => surConsole(v, c.slug)).length,
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

/**
 * Développeurs proposés (#89) : « Nintendo (first party) » en tête, puis chaque studio des jeux affichés, du plus grand
 * nombre de jeux au plus petit, avec ce nombre.
 */
export function developpeursProposes(
  versions: VersionAffichee[],
): { nom: string; nombre: number }[] {
  const parJeu = versions.map((v) => studios(v.jeu.developpeur));
  const firstParty = parJeu.filter((l) => l.some(estFirstParty)).length;
  return [
    ...(firstParty ? [{ nom: NINTENDO_FIRST_PARTY, nombre: firstParty }] : []),
    ...regrouperStudios(parJeu),
  ];
}

/**
 * Séries proposées (SPEC v1.37) : celles des jeux affichés, par ordre alphabétique, avec leur nombre de jeux (un jeu
 * compte dans chacune de ses séries), puis « Sans série ».
 */
export function seriesProposees(
  versions: VersionAffichee[],
): { nom: string; nombre: number }[] {
  const nombres = new Map<string, number>();
  for (const v of versions)
    for (const s of v.jeu.series) nombres.set(s, (nombres.get(s) ?? 0) + 1);
  const sans = versions.filter((v) => v.jeu.series.length === 0).length;
  return [
    ...[...nombres]
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([nom, nombre]) => ({ nom, nombre })),
    ...(sans ? [{ nom: SANS_SERIE, nombre: sans }] : []),
  ];
}

/** Types d'amiibo proposés (US-29, SPEC v1.54) : ceux présents parmi les amiibo affichés, dans l'ordre fixe, avec leur nombre. */
export function typesAmiiboProposes(
  versions: VersionAffichee[],
): { valeur: TypeAmiibo; libelle: string; nombre: number }[] {
  return TYPES_AMIIBO.map((valeur) => ({
    valeur,
    libelle: LIBELLES_TYPE[valeur],
    nombre: versions.filter((v) => v.amiibo?.type === valeur).length,
  })).filter((t) => t.nombre > 0);
}

/** Nombre de filtres actifs (affiché sur le bouton « Filtres ») : critères qui s'écartent du défaut. */
export const nombreActifs = (f: Filtres) =>
  Object.values(f).filter((v) => v !== null && v !== false).length;

/** Filtres lus dans les paramètres de l'adresse ; une valeur inconnue est ignorée. */
export function filtresDepuisParametres(recherche: string): Filtres {
  const params = new URLSearchParams(recherche);
  const dispo = params.get(PARAMETRES.disponibilite)?.toUpperCase();
  const an = params.get(PARAMETRES.annee);
  const console_ = params.get(PARAMETRES.console);
  const typeAmiibo = params.get(PARAMETRES.typeAmiibo)?.toLowerCase();
  return {
    console:
      console_ && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(console_) ? console_ : null,
    disponibilite:
      DISPONIBILITES.find((d) => d.valeur === dispo)?.valeur ?? null,
    annee: an && /^\d{4}$/.test(an) ? an : null,
    genre: params.get(PARAMETRES.genre)?.trim() || null,
    developpeur: params.get(PARAMETRES.developpeur)?.trim() || null,
    serie: params.get(PARAMETRES.serie)?.trim() || null,
    typeAmiibo: TYPES_AMIIBO.find((t) => t === typeAmiibo) ?? null,
    collection:
      (["possedes", "manquants", "souhaits"] as const).find(
        (c) => c === params.get(PARAMETRES.collection),
      ) ?? null,
    inclureAVenir: params.get(PARAMETRES.inclureAVenir) === "1",
    inclureSansImage: params.get(PARAMETRES.inclureSansImage) === "1",
  };
}

/** Paramètres de l'adresse avec les filtres, en gardant les autres (recherche, marché). */
export function avecFiltres(recherche: string, filtres: Filtres): string {
  const params = new URLSearchParams(recherche);
  // `?dispo=jap` comme `?marche=jap` ; le genre garde sa casse (« Plates-formes 3D »).
  const valeurs: Record<keyof Filtres, string | null> = {
    ...filtres,
    disponibilite: filtres.disponibilite?.toLowerCase() ?? null,
    inclureAVenir: filtres.inclureAVenir ? "1" : null,
    inclureSansImage: filtres.inclureSansImage ? "1" : null,
  };
  for (const cle of Object.keys(PARAMETRES) as (keyof Filtres)[]) {
    const valeur = valeurs[cle];
    if (valeur) params.set(PARAMETRES[cle], valeur);
    else params.delete(PARAMETRES[cle]);
  }
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/** Mêmes filtres, champ par champ ? */
export function memesFiltres(a: Filtres, b: Filtres): boolean {
  return (Object.keys(SANS_FILTRE) as (keyof Filtres)[]).every(
    (cle) => a[cle] === b[cle],
  );
}

/**
 * Filtres en cours, lus dans l'adresse. Mémorisés : `useSyncExternalStore` exige le même objet tant que rien ne
 * change, et le catalogue ne refait pas ses calculs quand seule la recherche (`?q=`) change (audit, B).
 */
let dernier: { recherche: string; filtres: Filtres } | null = null;
export function lireFiltres(): Filtres {
  const recherche = window.location.search;
  if (dernier?.recherche !== recherche) {
    const filtres = filtresDepuisParametres(recherche);
    dernier = {
      recherche,
      filtres:
        dernier && memesFiltres(dernier.filtres, filtres)
          ? dernier.filtres
          : filtres,
    };
  }
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
