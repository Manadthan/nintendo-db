/**
 * Position du catalogue au retour d'une fiche (bouton « Précédent »). Safari remet la hauteur une seule fois, tout
 * de suite, quand le catalogue n'est pas encore réaffiché : la page est courte et il s'arrête en haut. Le catalogue
 * note donc sa hauteur au clic sur un jeu, et la remet lui-même une fois réaffiché, seulement après un retour arrière.
 * Il note aussi le nombre de jeux dessinés (affichage par lots, SPEC v1.41) : il les redessine avant de défiler.
 */

const CLE = "nintendo-db:defilement";

type Stockage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Position = { adresse: string; y: number; nombre?: number };

/** Hauteur à remettre, et nombre de jeux qui étaient dessinés (0 : inconnu). */
export type PositionCatalogue = { y: number; nombre: number };

/** Note la hauteur du catalogue à cette adresse (chemin + paramètres : filtres, recherche, marché). */
export function noterPosition(
  stockage: Stockage,
  adresse: string,
  y: number,
  nombre: number,
) {
  stockage.setItem(
    CLE,
    JSON.stringify({ adresse, y, nombre } satisfies Position),
  );
}

/**
 * Hauteur à remettre : celle notée pour la même adresse, après un retour arrière seulement (un retour par l'icône
 * Catalogue repart du haut). La note est effacée dans tous les cas : elle ne sert qu'une fois.
 */
export function positionARemettre(
  stockage: Stockage,
  adresse: string,
  retourArriere: boolean,
): PositionCatalogue | null {
  const texte = stockage.getItem(CLE);
  stockage.removeItem(CLE);
  if (!retourArriere || !texte) return null;
  try {
    const position = JSON.parse(texte) as Partial<Position>;
    return position.adresse === adresse &&
      typeof position.y === "number" &&
      position.y > 0
      ? {
          y: position.y,
          nombre: typeof position.nombre === "number" ? position.nombre : 0,
        }
      : null;
  } catch {
    return null;
  }
}

const CLE_ADRESSE = "nintendo-db:catalogue";

/** Note l'adresse du catalogue (recherche, marché, filtres, tri) pour le lien « Retour au catalogue » (v1.45). */
export function noterAdresse(stockage: Stockage, adresse: string) {
  stockage.setItem(CLE_ADRESSE, adresse);
}

/** Adresse du lien « Retour au catalogue » : la dernière notée, si c'est bien le catalogue ; sinon l'accueil. */
export function adresseRetour(stockage: Pick<Storage, "getItem">): string {
  const adresse = stockage.getItem(CLE_ADRESSE);
  return adresse?.startsWith("/?") ? adresse : "/";
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

// Lien « Retour au catalogue » de la fiche : un retour comme « Précédent » (SPEC v1.46). Daté comme lui.
let dernierLien = -Infinity;

/** Au clic sur le lien « Retour au catalogue » de la fiche. */
export function noterRetourParLien() {
  dernierLien = performance.now();
}

/**
 * Vrai si le catalogue s'affiche après « Précédent » (dans le site, ou page rechargée par le navigateur) ou après le
 * lien « Retour au catalogue ».
 */
function consommerRetourArriere(): boolean {
  const maintenant = performance.now();
  const retour =
    maintenant - dernierRetour < DELAI_RETOUR_MS ||
    maintenant - dernierLien < DELAI_RETOUR_MS;
  dernierRetour = -Infinity;
  dernierLien = -Infinity;
  const premier = premierAffichage;
  premierAffichage = false;
  if (retour) return true;
  if (!premier) return false;
  const chargement = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return chargement?.type === "back_forward";
}

const adresseCourante = () => location.pathname + location.search;

/** Au clic sur un jeu du catalogue, avec le nombre de jeux dessinés. Stockage indisponible : rien n'est noté. */
export function noterPositionCatalogue(nombre: number) {
  try {
    noterPosition(sessionStorage, adresseCourante(), window.scrollY, nombre);
    noterAdresse(sessionStorage, adresseCourante());
  } catch {
    // Sans stockage, le navigateur fait comme il peut.
  }
}

/**
 * À l'affichage du catalogue : la hauteur notée si l'on revient d'une fiche, sinon `null`. Le catalogue redessine
 * d'abord assez de jeux, puis défile (`defilerA`).
 */
export function positionCatalogueARemettre(): PositionCatalogue | null {
  const retour = consommerRetourArriere();
  try {
    return positionARemettre(sessionStorage, adresseCourante(), retour);
  } catch {
    return null;
  }
}

/** Défile à la hauteur notée, après le rendu du catalogue (la page a retrouvé sa longueur). */
export function defilerA(y: number) {
  requestAnimationFrame(() => window.scrollTo(0, y));
}

/** Pour le lien « Retour au catalogue » de la fiche. Stockage indisponible : l'accueil. */
export function adresseRetourCatalogue(): string {
  try {
    return adresseRetour(sessionStorage);
  } catch {
    return "/";
  }
}
