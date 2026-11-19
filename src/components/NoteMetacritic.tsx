/**
 * Étiquette de la note Metacritic dans le catalogue (US-17) : le seul chiffre, sur la ligne des étiquettes JAP / US /
 * PAL et dans leur style (demande du propriétaire ; la fiche, elle, garde les couleurs de Metacritic). Rien sans note.
 */
export function NoteMetacritic({ note }: { note: number | null }) {
  if (note === null) return null;
  return (
    <span
      role="img"
      aria-label={`Metacritic : ${note} sur 100`}
      title="Note Metacritic"
      className="flex h-5 shrink-0 items-center rounded bg-accent-doux px-1 text-[10px] font-bold whitespace-nowrap text-accent-fonce tabular-nums"
    >
      {note}
    </span>
  );
}
