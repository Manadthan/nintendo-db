/** Étiquette « À venir » d'un jeu annoncé (US-32, ADR-20 point 4), sur les cartes du catalogue et sur la fiche. */
export function EtiquetteAVenir({
  grande = false,
  compact = false,
}: {
  grande?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded font-bold whitespace-nowrap bg-avenir-fond text-avenir ${
        grande
          ? "h-6 px-2 text-xs"
          : compact
            ? "h-4 px-1 text-[9px]"
            : "h-5 px-1.5 text-[10px]"
      }`}
    >
      À venir
    </span>
  );
}
