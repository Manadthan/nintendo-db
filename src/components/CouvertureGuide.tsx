"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Couverture,
  adresseCouvertureGuide,
} from "@/lib/guides/couverture";

/**
 * Couverture d'un guide (ADR-19 point 2 révisé) : copie d'Amazon Japon dans notre stockage, sinon Google Books (servie
 * par Google, jamais copiée). Sans couverture, ou si l'image ne charge pas : vignette neutre (titre, éditeur, année),
 * comme un jeu sans jaquette (US-27).
 */
export function CouvertureGuide({
  couverture,
  titre,
  legende,
  petite = false,
}: {
  couverture: Couverture | null;
  titre: string;
  /** Éditeur et année, sur la vignette neutre. */
  legende: string;
  /** Liste « Guides (N) » de la fiche : vignette neutre réduite au début du titre. */
  petite?: boolean;
}) {
  const [cassee, setCassee] = useState(false);
  const image = useRef<HTMLImageElement>(null);

  // Page préparée à l'avance : l'image peut échouer avant que React ne branche onError (comme Captures).
  useEffect(() => {
    const img = image.current;
    if (img?.complete && img.naturalWidth === 0) setCassee(true);
  }, []);

  if ((!couverture || cassee) && petite)
    return (
      <div
        role="img"
        aria-label={`${titre} — couverture indisponible`}
        className="flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-sm bg-vignette p-1 text-center text-[9px] leading-snug text-texte-doux"
      >
        <span className="line-clamp-4">{titre}</span>
      </div>
    );
  if (!couverture || cassee)
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
    // eslint-disable-next-line @next/next/no-img-element -- copie déjà réduite, ou Google jamais relayé (ADR-19)
    <img
      ref={image}
      src={adresseCouvertureGuide(couverture)}
      alt={`Couverture de ${titre}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setCassee(true)}
      className={`h-auto w-full border border-vignette-bordure bg-vignette ${petite ? "rounded-sm" : "rounded-md"}`}
    />
  );
}

/** Mention de la source sous les couvertures (SPEC v1.52 : Amazon.co.jp ; conditions de Google Books : powered by Google). */
export function MentionCouverture({
  sources,
  pluriel = false,
}: {
  sources: readonly Couverture["source"][];
  pluriel?: boolean;
}) {
  const amazon = sources.includes("amazon");
  const google = sources.includes("google");
  if (!amazon && !google) return null;
  return (
    <p className="text-[11px] text-texte-discret">
      {pluriel ? "Couvertures" : "Couverture"} : {amazon && "Amazon.co.jp"}
      {amazon && google && " · "}
      {google && (
        <>
          Google Books ·{" "}
          <span className="font-semibold">powered by Google</span>
        </>
      )}
    </p>
  );
}
