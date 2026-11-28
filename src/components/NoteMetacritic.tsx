import { CLASSES_NOTE, niveauNote } from "@/lib/catalogue/metacritic";

/**
 * Note Metacritic dans le catalogue (US-17, SPEC v1.30) : le seul chiffre, en surimpression dans le coin en haut à
 * gauche de la jaquette (l'angle haut droit est réservé au fanion « possédé »), aux couleurs de Metacritic.
 * À placer dans un parent `relative` qui entoure la jaquette. Rien sans note.
 */
export function NoteMetacritic({
  note,
  petite = false,
}: {
  note: number | null;
  /** Vignette de la vue liste (54 px) : pastille plus petite. */
  petite?: boolean;
}) {
  if (note === null) return null;
  return (
    <span
      role="img"
      aria-label={`Metacritic : ${note} sur 100`}
      title="Note Metacritic"
      className={`absolute flex items-center justify-center rounded font-bold tabular-nums shadow-sm ${CLASSES_NOTE[niveauNote(note)]} ${petite ? "top-0.5 left-0.5 h-4 min-w-5 px-0.5 text-[10px]" : "top-1.5 left-1.5 h-6 min-w-7 px-1 text-xs"}`}
    >
      {note}
    </span>
  );
}
