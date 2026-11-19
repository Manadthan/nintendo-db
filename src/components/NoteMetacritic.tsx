import { CLASSES_NOTE, niveauNote } from "@/lib/catalogue/metacritic";

/**
 * Étiquette de la note Metacritic dans le catalogue (US-17) : le seul chiffre, aux couleurs de Metacritic, sur la
 * ligne des étiquettes JAP / US / PAL. Rien sans note.
 */
export function NoteMetacritic({ note }: { note: number | null }) {
  if (note === null) return null;
  return (
    <span
      role="img"
      aria-label={`Metacritic : ${note} sur 100`}
      title="Note Metacritic"
      className={`flex h-5 min-w-6 items-center justify-center rounded px-1 text-[11px] font-bold tabular-nums ${CLASSES_NOTE[niveauNote(note)]}`}
    >
      {note}
    </span>
  );
}
