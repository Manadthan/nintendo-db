/**
 * Note Metacritic (US-17, ADR-08) : couleur de l'étiquette selon les seuils de Metacritic, vert ≥ 75, jaune 50 à 74,
 * rouge < 50. Classes Tailwind écrites en entier (Tailwind ne lit pas les classes construites).
 */
export type NiveauNote = "bon" | "moyen" | "faible";

export const niveauNote = (note: number): NiveauNote =>
  note >= 75 ? "bon" : note >= 50 ? "moyen" : "faible";

export const CLASSES_NOTE: Record<NiveauNote, string> = {
  bon: "bg-mc-bon text-mc-texte",
  moyen: "bg-mc-moyen text-mc-texte-moyen",
  faible: "bg-mc-faible text-mc-texte",
};
