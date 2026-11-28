export type NiveauZoom = "compact" | "normal" | "grand";

/** Niveaux de zoom de la grille, du plus dézoomé (compact) au plus zoomé (grand). */
export const NIVEAUX_ZOOM: readonly NiveauZoom[] = [
  "compact",
  "normal",
  "grand",
];

export const ZOOM_PAR_DEFAUT: NiveauZoom = "normal";

/** Clé de mémorisation du niveau de zoom dans ce navigateur. */
export const CLE_ZOOM = "nintendo-db:zoom";

export const LIBELLES_ZOOM: Record<NiveauZoom, string> = {
  compact: "Compact",
  normal: "Normal",
  grand: "Grand",
};

/** Classes Tailwind de la grille selon le niveau de zoom (1 / 2 / 3 col. mobile · 4 / 6 / 8 col. bureau). */
export const CLASSES_GRILLE: Record<NiveauZoom, string> = {
  grand:
    "grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4",
  normal:
    "grid grid-cols-2 gap-x-3 gap-y-[18px] sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 lg:grid-cols-5 xl:grid-cols-6",
  compact:
    "grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4 md:grid-cols-5 md:gap-x-3 lg:grid-cols-6 xl:grid-cols-8",
};

/** Attribut `sizes` des jaquettes selon le niveau de zoom, pour charger la variante WebP optimale (ADR-04). */
export const TAILLES_JAQUETTE: Record<NiveauZoom, string> = {
  grand: "(max-width: 640px) 92vw, (max-width: 1024px) 33vw, 320px",
  normal: "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px",
  compact: "(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 160px",
};

/** Reconnaît un niveau de zoom valide ; `null` sinon. */
export function zoomDepuisTexte(texte: string | null): NiveauZoom | null {
  if (!texte) return null;
  const valeur = texte.toLowerCase();
  return NIVEAUX_ZOOM.find((n) => n === valeur) ?? null;
}

/** Passe au niveau supérieur (cartes plus grandes), plafonné à « grand ». */
export function zoomer(niveau: NiveauZoom): NiveauZoom {
  const index = NIVEAUX_ZOOM.indexOf(niveau);
  return NIVEAUX_ZOOM[Math.min(index + 1, NIVEAUX_ZOOM.length - 1)]!;
}

/** Passe au niveau inférieur (cartes plus petites), plafonné à « compact ». */
export function dezoomer(niveau: NiveauZoom): NiveauZoom {
  const index = NIVEAUX_ZOOM.indexOf(niveau);
  return NIVEAUX_ZOOM[Math.max(index - 1, 0)]!;
}

export function peutZoomer(niveau: NiveauZoom): boolean {
  return niveau !== NIVEAUX_ZOOM[NIVEAUX_ZOOM.length - 1];
}

export function peutDezoomer(niveau: NiveauZoom): boolean {
  return niveau !== NIVEAUX_ZOOM[0];
}

let memoire: NiveauZoom | null = null;
const abonnes = new Set<() => void>();

/** Lit le zoom mémorisé dans le navigateur (ou le défaut si le stockage est indisponible). */
export function lireZoom(): NiveauZoom {
  try {
    return zoomDepuisTexte(localStorage.getItem(CLE_ZOOM)) ?? ZOOM_PAR_DEFAUT;
  } catch {
    return memoire ?? ZOOM_PAR_DEFAUT;
  }
}

/** Pour `useSyncExternalStore` : prévient les composants quand le zoom change. */
export function abonnerZoom(rappel: () => void) {
  abonnes.add(rappel);
  const surStockage = (e: StorageEvent) => {
    if (e.key === null || e.key === CLE_ZOOM) rappel();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", surStockage);
  }
  return () => {
    abonnes.delete(rappel);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", surStockage);
    }
  };
}

/** Enregistre le niveau de zoom dans ce navigateur et prévient les composants. */
export function enregistrerZoom(niveau: NiveauZoom) {
  memoire = niveau;
  try {
    localStorage.setItem(CLE_ZOOM, niveau);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour cette visite seulement.
  }
  for (const rappel of abonnes) rappel();
}
