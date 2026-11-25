"use client";

import { useEffect, useRef, useState } from "react";
import { adresseCouverture } from "@/lib/guides/guides";

/**
 * Couverture d'un guide servie par Google Books (ADR-19 point 2 : jamais copiée chez nous). Sans couverture, ou si
 * l'image ne charge pas : vignette neutre (titre, éditeur, année), comme un jeu sans jaquette (US-27).
 */
export function CouvertureGuide({
  googleBooksId,
  titre,
  legende,
}: {
  googleBooksId: string | null;
  titre: string;
  /** Éditeur et année, sur la vignette neutre. */
  legende: string;
}) {
  const [cassee, setCassee] = useState(false);
  const image = useRef<HTMLImageElement>(null);

  // Page préparée à l'avance : l'image peut échouer avant que React ne branche onError (comme Captures).
  useEffect(() => {
    const img = image.current;
    if (img?.complete && img.naturalWidth === 0) setCassee(true);
  }, []);

  if (!googleBooksId || cassee)
    return (
      <div
        role="img"
        aria-label={`${titre} — couverture indisponible`}
        className="flex aspect-[2/3] w-full flex-col overflow-hidden rounded-md border border-vignette-bordure bg-vignette"
      >
        <div className="flex h-[18px] items-center bg-vignette-bandeau px-2 text-[9px] font-bold tracking-wider text-white">
          GUIDE
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 p-3 text-center">
          <span className="text-sm leading-snug font-semibold text-texte">
            {titre}
          </span>
          <span className="text-xs text-texte-doux">{legende}</span>
        </div>
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- couverture servie par Google, jamais relayée (ADR-19)
    <img
      ref={image}
      src={adresseCouverture(googleBooksId)}
      alt={`Couverture de ${titre}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setCassee(true)}
      className="h-auto w-full rounded-md border border-vignette-bordure bg-vignette"
    />
  );
}
