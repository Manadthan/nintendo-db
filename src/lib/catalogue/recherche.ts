import { normaliser } from "@/lib/recherche/normaliser";
import { REGIONS, type JeuCatalogue } from "./types";

/**
 * Le jeu correspond-il à la recherche (US-05, ADR-05) ? Chaque mot cherché doit apparaître, dans n'importe quel
 * ordre, dans ses titres des 3 régions (et la forme romanisée), son éditeur ou son développeur —
 * sans tenir compte des majuscules, des accents ni de la ponctuation.
 */
export function correspond(jeu: JeuCatalogue, recherche: string): boolean {
  const mots = normaliser(recherche).split(" ").filter(Boolean);
  if (mots.length === 0) return true;
  const texte = normaliser(
    [
      ...REGIONS.flatMap((r) => [
        jeu.sorties[r].titre,
        jeu.sorties[r].titreRomanise,
      ]),
      jeu.editeur,
      jeu.developpeur,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return mots.every((mot) => texte.includes(mot));
}

/** Paramètres de l'adresse avec la recherche (`?q=…`), en gardant les autres (marché) ; vide : retirée. */
export function avecRecherche(parametres: string, recherche: string): string {
  const params = new URLSearchParams(parametres);
  if (recherche.trim()) params.set("q", recherche);
  else params.delete("q");
  const texte = params.toString();
  return texte ? `?${texte}` : "";
}

/** Recherche en cours, lue dans l'adresse (lien partageable). */
export function lireRecherche(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

const abonnes = new Set<() => void>();

/** Pour `useSyncExternalStore` : prévient les composants quand la recherche change. */
export function abonnerRecherche(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

/** Enregistre la recherche dans l'adresse, sans recharger la page, et prévient les composants. */
export function enregistrerRecherche(recherche: string) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${avecRecherche(search, recherche)}${hash}`,
  );
  for (const rappel of abonnes) rappel();
}
