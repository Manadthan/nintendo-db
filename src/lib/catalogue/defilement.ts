/**
 * Position du catalogue au retour d'une fiche (bouton « Précédent »). Safari remet la hauteur une seule fois, tout
 * de suite, quand le catalogue n'est pas encore réaffiché : la page est courte et il s'arrête en haut. Le catalogue
 * note donc sa hauteur au clic sur un jeu, et la remet lui-même une fois réaffiché, seulement après un retour arrière.
 */

const CLE = "nintendo-db:defilement";

type Stockage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Position = { adresse: string; y: number; fiche?: string };

/**
 * Note la hauteur du catalogue à cette adresse (chemin + paramètres : filtres, recherche, marché), et la fiche
 * ouverte : son lien « Retour au catalogue » fait alors comme « Précédent ».
 */
export function noterPosition(
  stockage: Stockage,
  adresse: string,
  y: number,
  fiche?: string,
) {
  stockage.setItem(
    CLE,
    JSON.stringify({ adresse, y, fiche } satisfies Position),
  );
}

/** Vrai si cette fiche a été ouverte depuis le catalogue (la page précédente de l'historique est le catalogue). */
export function ouverteDepuisCatalogue(stockage: Stockage, fiche: string) {
  try {
    const position = JSON.parse(
      stockage.getItem(CLE) ?? "null",
    ) as Partial<Position> | null;
    return position?.fiche === fiche;
  } catch {
    return false;
  }
}

/**
 * Hauteur à remettre : celle notée pour la même adresse, après un retour arrière seulement (un retour par l'icône
 * Catalogue repart du haut). La note est effacée dans tous les cas : elle ne sert qu'une fois.
 */
export function positionARemettre(
  stockage: Stockage,
  adresse: string,
  retourArriere: boolean,
): number | null {
  const texte = stockage.getItem(CLE);
  stockage.removeItem(CLE);
  if (!retourArriere || !texte) return null;
  try {
    const position = JSON.parse(texte) as Partial<Position>;
    return position.adresse === adresse &&
      typeof position.y === "number" &&
      position.y > 0
      ? position.y
      : null;
  } catch {
    return null;
  }
}

// --- Navigateur -------------------------------------------------------------------------------------------------

// Retour arrière ou avant dans le site (Next.js ne recharge pas la page : l'événement « popstate » le signale).
// Daté : un retour ancien (fiche → fiche, puis icône Catalogue) ne compte pas. 5 s laissent le temps d'afficher
// plus de 1 000 jeux sur un petit téléphone.
const DELAI_RETOUR_MS = 5000;
let dernierRetour = -Infinity;
// Le type de chargement de la page vaut pour toute la visite : seul le premier affichage du catalogue le lit.
let premierAffichage = true;
if (typeof window !== "undefined")
  window.addEventListener("popstate", () => {
    dernierRetour = performance.now();
  });

/** Vrai si le catalogue s'affiche après « Précédent » (dans le site, ou page rechargée par le navigateur). */
function consommerRetourArriere(): boolean {
  const retour = performance.now() - dernierRetour < DELAI_RETOUR_MS;
  dernierRetour = -Infinity;
  const premier = premierAffichage;
  premierAffichage = false;
  if (retour) return true;
  if (!premier) return false;
  const chargement = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return chargement?.type === "back_forward";
}

const adresseCourante = () => location.pathname + location.search;

/** Au clic sur un jeu du catalogue. Stockage indisponible (navigation privée) : rien n'est noté. */
export function noterPositionCatalogue(clic: {
  currentTarget: { getAttribute(nom: string): string | null };
}) {
  try {
    noterPosition(
      sessionStorage,
      adresseCourante(),
      window.scrollY,
      clic.currentTarget.getAttribute("href") ?? undefined,
    );
  } catch {
    // Sans stockage, le navigateur fait comme il peut.
  }
}

/** À l'affichage du catalogue : remet la hauteur notée si l'on revient d'une fiche. */
export function remettrePositionCatalogue() {
  const retour = consommerRetourArriere();
  let y: number | null = null;
  try {
    y = positionARemettre(sessionStorage, adresseCourante(), retour);
  } catch {
    return;
  }
  if (y === null) return;
  const hauteur = y;
  // Après le rendu du catalogue (la page a retrouvé sa longueur).
  requestAnimationFrame(() => window.scrollTo(0, hauteur));
}

/**
 * « Retour au catalogue » depuis une fiche ouverte dans le catalogue : vrai si le lien doit faire « Précédent »
 * (même hauteur, mêmes filtres) plutôt qu'ouvrir l'accueil en haut de page.
 */
export function retourParPrecedent(): boolean {
  try {
    return ouverteDepuisCatalogue(sessionStorage, location.pathname);
  } catch {
    return false;
  }
}
