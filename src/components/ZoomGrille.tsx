"use client";

import {
  LIBELLES_ZOOM,
  dezoomer,
  peutDezoomer,
  peutZoomer,
  zoomer,
  type NiveauZoom,
} from "@/lib/catalogue/zoom";

type Props = {
  niveau: NiveauZoom;
  surChangement: (suivant: NiveauZoom) => void;
};

/** Boutons − / + compacts pour ajuster la densité de la grille du catalogue. */
export function ZoomGrille({ niveau, surChangement }: Props) {
  const dezoomActif = peutDezoomer(niveau);
  const zoomActif = peutZoomer(niveau);

  return (
    <div
      role="group"
      aria-label={`Taille de la grille (${LIBELLES_ZOOM[niveau]})`}
      className="inline-flex items-center overflow-hidden rounded-[10px] border border-champ bg-carte"
    >
      <button
        type="button"
        onClick={() => surChangement(dezoomer(niveau))}
        disabled={!dezoomActif}
        aria-label="Dézoomer la grille"
        title="Dézoomer la grille"
        className="flex h-9 w-9 items-center justify-center text-texte transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="M8 11h6" />
        </svg>
      </button>
      <span aria-hidden="true" className="h-5 w-px bg-bordure" />
      <button
        type="button"
        onClick={() => surChangement(zoomer(niveau))}
        disabled={!zoomActif}
        aria-label="Zoomer la grille"
        title="Zoomer la grille"
        className="flex h-9 w-9 items-center justify-center text-texte transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="M8 11h6" />
          <path d="M11 8v6" />
        </svg>
      </button>
    </div>
  );
}
