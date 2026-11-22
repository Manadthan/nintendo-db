/** Textes du bloc « Prix eBay » de la fiche (US-25, maquette `docs/maquettes/prix-ebay.png`). */
import type { Marche } from "./prix";

const MARCHES_COURTS: Record<Marche, string> = {
  EBAY_US: "US",
  EBAY_FR: "FR",
  EBAY_GB: "UK",
};

/** « eBay US », « eBay FR + UK ». */
export const libelleMarches = (marches: Marche[]) =>
  `eBay ${marches.map((m) => MARCHES_COURTS[m]).join(" + ")}`;

/** « 1 annonce », « 41 annonces ». */
export const libelleAnnonces = (n: number) => `${n} annonce${n > 1 ? "s" : ""}`;

/** Ancienneté du prix : « mis à jour à l'instant », « il y a 25 min », « il y a 2 h » (au plus 6 h, ADR-17). */
export function anciennete(calculeLe: string, maintenant: Date): string {
  const minutes = Math.floor(
    (maintenant.getTime() - new Date(calculeLe).getTime()) / 60_000,
  );
  if (!Number.isFinite(minutes) || minutes < 1) return "Mis à jour à l'instant";
  if (minutes < 60) return `Mis à jour il y a ${minutes} min`;
  return `Mis à jour il y a ${Math.floor(minutes / 60)} h`;
}
