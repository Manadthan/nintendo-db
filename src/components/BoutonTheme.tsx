"use client";

import { useSyncExternalStore } from "react";
import {
  LIBELLES,
  abonnerTheme,
  appliquerTheme,
  lireTheme,
  themeSuivant,
  type Theme,
} from "@/lib/theme/theme";

const ICONES: Record<Theme, React.ReactNode> = {
  // Moitié pleine : suit l'iPhone.
  auto: (
    <>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </>
  ),
  clair: (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  sombre: (
    <path
      d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
      fill="currentColor"
    />
  ),
};

/** Bouton de l'en-tête (US-08) : automatique → clair → sombre. Le choix est gardé dans ce navigateur. */
export function BoutonTheme() {
  const theme = useSyncExternalStore<Theme>(
    abonnerTheme,
    lireTheme,
    () => "auto",
  );
  return (
    <button
      type="button"
      onClick={() => appliquerTheme(themeSuivant(theme))}
      aria-label={`${LIBELLES[theme]} (changer)`}
      title={LIBELLES[theme]}
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-texte-doux"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        {ICONES[theme]}
      </svg>
    </button>
  );
}
