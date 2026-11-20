"use client";

import { useEffect, useState } from "react";

/** Défilement à partir duquel le bouton apparaît (px) : un peu moins d'un demi-écran d'iPhone 12 mini. */
const SEUIL = 300;

/**
 * Bouton flottant « Remonter en haut » (SPEC v1.34, demande du propriétaire) : en bas à droite, au-dessus de la
 * barre d'accueil de l'iPhone, visible seulement après un défilement.
 */
export function BoutonHaut() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const suivre = () => setVisible(window.scrollY > SEUIL);
    suivre();
    window.addEventListener("scroll", suivre, { passive: true });
    return () => window.removeEventListener("scroll", suivre);
  }, []);
  if (!visible) return null;
  const doux = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <button
      type="button"
      aria-label="Remonter en haut"
      title="Remonter en haut"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: doux ? "auto" : "smooth" })
      }
      className="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex size-12 items-center justify-center rounded-full border border-bordure bg-carte text-texte shadow-lg"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
