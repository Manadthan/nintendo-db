// Numéros de série No-Intro (étape 15, DESIGN v1.9 ADR-10) : fichier « metadat/no-intro/{console}.dat » de
// libretro-database. Chaque cartouche y a son nom No-Intro et sa série (« NZSE » : base « NZS » + lettre de région).
import type { Region } from "@/lib/catalogue/types";
import { cleTitre, estEcartee } from "./libretro";

/** Fichiers No-Intro de libretro-database, par console. */
export const FICHIERS_NOINTRO: Record<string, string> = {
  n64: "Nintendo - Nintendo 64",
  gb: "Nintendo - Game Boy",
  gbc: "Nintendo - Game Boy Color",
  gba: "Nintendo - Game Boy Advance",
};

export const adresseNoIntro = (fichier: string) =>
  `https://raw.githubusercontent.com/libretro/libretro-database/master/metadat/no-intro/${encodeURIComponent(`${fichier}.dat`)}`;

export type CartoucheNoIntro = { nom: string; serie: string };

/** Cartouches du fichier : nom et série, sans prototypes, démos ni rééditions (mêmes règles que les boîtes). */
export function lireNoIntro(dat: string): CartoucheNoIntro[] {
  const vues = new Set<string>();
  const cartouches: CartoucheNoIntro[] = [];
  for (const bloc of dat.split(/^game \(/m).slice(1)) {
    const nom = bloc.match(/^\tname "([^"]+)"/m)?.[1];
    const serie = bloc.match(/^\tserial "([A-Z0-9]{4})"/m)?.[1];
    if (!nom || !serie || estEcartee(nom) || vues.has(nom)) continue;
    vues.add(nom);
    cartouches.push({ nom, serie });
  }
  return cartouches;
}

/** Clé d'un titre : celle des boîtes, « ou » et « ō » confondus (« Doubutsu no Mori » = « Dōbutsu no Mori »). */
const cle = (titre: string) =>
  cleTitre(titre).replace(/ou/g, "o").replace(/uu/g, "u");

/** Titre d'un nom No-Intro, sans ses étiquettes : « Mario Kart 64 (Japan) (Rev 1) » → « Mario Kart 64 ». */
const titreNoIntro = (nom: string) => nom.replace(/ \(.*$/, "");

export type IndexSeries = {
  /** Clé de titre → bases de série (3 premiers caractères). */
  bases: Map<string, Set<string>>;
  /** Base → cartouches de toutes les régions. */
  cartouches: Map<string, CartoucheNoIntro[]>;
};

export function indexerSeries(cartouches: CartoucheNoIntro[]): IndexSeries {
  const index: IndexSeries = { bases: new Map(), cartouches: new Map() };
  const ajouter = (k: string, base: string) =>
    index.bases.set(k, (index.bases.get(k) ?? new Set()).add(base));
  for (const c of cartouches) {
    const base = c.serie.slice(0, 3);
    const titre = titreNoIntro(c.nom);
    ajouter(cle(titre), base);
    // Sous-titre propre à une région (« Wave Race 64 - Kawasaki Jet Ski ») : aussi trouvé sans lui, en dernier recours.
    if (titre.includes(" - ")) ajouter(`~${cle(titre.split(" - ")[0]!)}`, base);
    index.cartouches.set(base, [...(index.cartouches.get(base) ?? []), c]);
  }
  return index;
}

/** Lettres de série des pays européens, après « P » (Europe) : Allemagne, France, Espagne, Italie, Pays-Bas… */
const LETTRES_PAL = ["P", "D", "F", "S", "I", "H", "X", "Y", "U"];

/**
 * Séries d'un jeu, par région sortie, et nom No-Intro de sa cartouche japonaise (pour retrouver la boîte japonaise
 * nommée en japonais). Le jeu est retrouvé par son titre américain, sinon européen.
 */
export function seriesDuJeu(
  index: IndexSeries,
  titres: { US: string; PAL: string },
  sorties: Record<Region, boolean>,
): { series: Partial<Record<Region, string>>; japonaise: string | null } {
  const bases = [
    ...(index.bases.get(cle(titres.US)) ??
      index.bases.get(cle(titres.PAL)) ??
      index.bases.get(`~${cle(titres.US)}`) ??
      []),
  ].sort();
  const cartouches = bases.flatMap((b) => index.cartouches.get(b) ?? []);
  // « A » : une même cartouche pour le Japon et les États-Unis (« 1080 Snowboarding (Japan, USA) »).
  const avecLettre = (lettre: string) =>
    cartouches.find((c) => c.serie[3] === lettre) ??
    (lettre === "J" || lettre === "E"
      ? cartouches.find((c) => c.serie[3] === "A")
      : undefined);
  const japonaise =
    cartouches.find((c) => c.serie[3] === "J" && /\(Japan\b/.test(c.nom)) ??
    avecLettre("J");
  const europe =
    LETTRES_PAL.map(avecLettre).find(Boolean) ??
    cartouches.find((c) => /\((?:[^)]*, )?Europe\b/.test(c.nom));
  const series: Partial<Record<Region, string>> = {};
  if (sorties.JAP && japonaise) series.JAP = japonaise.serie;
  if (sorties.US && avecLettre("E")) series.US = avecLettre("E")!.serie;
  if (sorties.PAL && europe) series.PAL = europe.serie;
  return {
    series,
    japonaise: sorties.JAP && japonaise ? japonaise.nom : null,
  };
}
