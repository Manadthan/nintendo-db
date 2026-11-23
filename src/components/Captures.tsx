"use client";

import { useEffect, useRef, useState } from "react";
import { adresseReduite, lienRawg } from "@/lib/captures/rawg";
import type { CaptureFiche } from "@/lib/fiche/fiche";

/**
 * Bloc « Captures » de la fiche (US-26, ADR-18) : carrousel des captures RAWG (version réduite 640), image en grand
 * au toucher (version 1280, dans un <dialog> : Échap et « Fermer » le referment). Une image qui ne charge pas est
 * retirée ; sans aucune image, le bloc disparaît. Les images restent chez RAWG, citée avec un lien actif.
 */
export function Captures({
  titre,
  captures,
  rawgSlug,
}: {
  titre: string;
  captures: CaptureFiche[];
  rawgSlug: string | null;
}) {
  const [cassees, setCassees] = useState<ReadonlySet<string>>(new Set());
  const [visible, setVisible] = useState(0);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const bande = useRef<HTMLUListElement>(null);
  const grande = useRef<HTMLUListElement>(null);
  const fenetre = useRef<HTMLDialogElement>(null);

  const images = captures.filter((c) => !cassees.has(c.url));
  const total = images.length;
  const casser = (url: string) =>
    setCassees((avant) => new Set(avant).add(url));

  // La fiche est préparée à l'avance : une image peut échouer avant que React ne branche onError. À l'arrivée, une
  // image déjà finie mais sans dimensions (complete et naturalWidth à 0) est donc comptée comme cassée.
  useEffect(() => {
    bande.current?.querySelectorAll("img").forEach((img) => {
      const url = img.dataset.capture;
      if (url && img.complete && img.naturalWidth === 0)
        setCassees((avant) => new Set(avant).add(url));
    });
  }, []);

  // Ouverture : la fenêtre se montre sur la capture touchée.
  useEffect(() => {
    if (ouverte === null) return;
    if (!fenetre.current?.open) fenetre.current?.showModal();
    const cible = grande.current?.children[ouverte] as HTMLElement | undefined;
    cible?.scrollIntoView({ inline: "start", block: "nearest" });
  }, [ouverte]);

  if (total === 0) return null;

  /** Rang de l'image la plus à gauche d'une bande défilante. */
  const rang = (liste: HTMLUListElement) => {
    const largeur = liste.firstElementChild?.clientWidth ?? 1;
    return Math.min(total - 1, Math.round(liste.scrollLeft / largeur));
  };

  return (
    <section aria-labelledby="captures" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <h2 id="captures" className="text-[15px] font-bold">
          Captures
        </h2>
        <span className="text-xs text-texte-discret">
          {total} · toucher pour agrandir
        </span>
      </div>
      <ul
        ref={bande}
        onScroll={(e) => setVisible(rang(e.currentTarget))}
        className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4"
      >
        {images.map((c, i) => (
          <li key={c.url} className="w-[78%] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOuverte(i)}
              aria-label={`Agrandir la capture ${i + 1} sur ${total}`}
              className="block w-full overflow-hidden rounded-[10px] bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- images déjà réduites par RAWG (ADR-18 point 6) */}
              <img
                src={adresseReduite(c.url, 640)}
                data-capture={c.url}
                alt={`${titre}, capture ${i + 1} sur ${total}`}
                width={c.largeur ?? 640}
                height={c.hauteur ?? 360}
                loading="lazy"
                decoding="async"
                onError={() => casser(c.url)}
                className="aspect-video w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      {total > 1 && (
        <div aria-hidden="true" className="flex justify-center gap-1.5">
          {images.map((c, i) => (
            <span
              key={c.url}
              className={`size-1.5 rounded-full ${i === visible ? "bg-accent" : "bg-champ"}`}
            />
          ))}
        </div>
      )}
      <p className="text-xs text-texte-discret">
        Captures :{" "}
        {rawgSlug ? (
          <a
            href={lienRawg(rawgSlug)}
            className="text-accent underline-offset-2 hover:underline"
          >
            RAWG
          </a>
        ) : (
          "RAWG"
        )}
      </p>

      <dialog
        ref={fenetre}
        aria-label={`Captures de ${titre}`}
        onClose={() => setOuverte(null)}
        className="m-0 h-full max-h-none w-full max-w-none bg-visionneuse/95 p-0 text-sur-visionneuse backdrop:bg-visionneuse/60"
      >
        {ouverte !== null && (
          <div className="flex h-full flex-col justify-center gap-3.5">
            <button
              type="button"
              onClick={() => fenetre.current?.close()}
              className="absolute top-3 right-3 min-h-11 px-3 text-[15px] font-semibold"
            >
              Fermer ✕
            </button>
            <ul
              ref={grande}
              onScroll={(e) => setOuverte(rang(e.currentTarget))}
              className="flex snap-x snap-mandatory overflow-x-auto"
            >
              {images.map((c, i) => (
                <li key={c.url} className="w-full shrink-0 snap-start">
                  {/* eslint-disable-next-line @next/next/no-img-element -- images déjà réduites par RAWG (ADR-18 point 6) */}
                  <img
                    src={adresseReduite(c.url, 1280)}
                    alt={`${titre}, capture ${i + 1} sur ${total}`}
                    width={c.largeur ?? 1280}
                    height={c.hauteur ?? 720}
                    loading="lazy"
                    className="w-full object-contain"
                  />
                </li>
              ))}
            </ul>
            <p className="text-center text-[13px] text-sur-visionneuse/80">
              {ouverte + 1} / {total}
              {total > 1 && " · glisser pour la suivante"}
            </p>
          </div>
        )}
      </dialog>
    </section>
  );
}
