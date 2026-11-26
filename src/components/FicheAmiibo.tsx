"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  identifiantLisible,
  LIBELLES_TYPE,
  libelleSortieAmiibo,
  regionAmiiboParDefaut,
  SOURCE_AMIIBOAPI,
  srcsetAmiibo,
  type AmiiboFiche,
} from "@/lib/amiibo/fiche";
import { sortieAVenir } from "@/lib/catalogue/a-venir";
import { formaterDate } from "@/lib/catalogue/catalogue";
import { lireMarche } from "@/lib/catalogue/marche";
import { REGIONS, type Marche, type Region } from "@/lib/catalogue/types";
import { BasculeRegion, NOMS_REGION } from "./BasculeRegion";
import { ImageAmiibo } from "./ImageAmiibo";
import { RetourCatalogue } from "./RetourCatalogue";

function Info({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div>
      <dt className="text-xs text-texte-discret">{libelle}</dt>
      {/* Une donnée inconnue s'affiche « — », jamais vide ni inventée (comme US-04). */}
      <dd className="mt-0.5 text-sm font-medium">{valeur ?? "—"}</dd>
    </div>
  );
}

// Le marché ne change pas pendant la visite de la fiche : rien à écouter.
const sansAbonnement = () => () => {};

const LIEN = "text-accent underline-offset-2 hover:underline";

/**
 * Fiche d'un amiibo (US-29, maquette amiibo-fiche.png) : photo, boîte américaine, bascule JAP / US / PAL sur la date
 * de sortie, informations, jeux compatibles, disponibilité, sources. Case « Je l'ai » (US-30) et prix eBay : plus tard.
 */
export function FicheAmiibo({
  amiibo,
  aujourdhui,
}: {
  amiibo: AmiiboFiche;
  /** Jour de préparation de la page (AAAA-MM-JJ, Paris) : sorties à venir (US-32). */
  aujourdhui: string;
}) {
  // Page préparée à l'avance : région du marché « Tous » au premier affichage, puis le marché choisi ici.
  const marche = useSyncExternalStore<Marche>(
    sansAbonnement,
    lireMarche,
    () => "TOUS",
  );
  const [choix, setChoix] = useState<Region | null>(null);
  const region = choix ?? regionAmiiboParDefaut(amiibo.sorties, marche);
  const fenetre = useRef<HTMLDialogElement>(null);
  const type = LIBELLES_TYPE[amiibo.type];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pt-2 pb-7">
      <RetourCatalogue />

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-x-12">
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-[72px]">
          <div className="w-full max-w-[400px]">
            <ImageAmiibo
              base={amiibo.image}
              alt={`Amiibo ${amiibo.nom}`}
              sizes="(max-width: 432px) calc(100vw - 32px), 400px"
              prioritaire
            />
          </div>
          {amiibo.boite && (
            <button
              type="button"
              onClick={() => fenetre.current?.showModal()}
              className="flex w-full max-w-[400px] items-center gap-3 rounded-xl border border-bordure bg-carte p-2.5 text-left"
            >
              <span className="w-14 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-21 point 2) */}
                <img
                  srcSet={srcsetAmiibo(amiibo.boite)}
                  sizes="56px"
                  alt=""
                  loading="lazy"
                  className="w-full object-contain"
                />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  Boîte (États-Unis)
                </span>
                <span className="text-xs text-texte-doux">
                  toucher pour agrandir · Nintendo US
                </span>
              </span>
            </button>
          )}
          <BasculeRegion
            region={region}
            sorties={{
              JAP: amiibo.sorties.JAP.sortie,
              US: amiibo.sorties.US.sortie,
              PAL: amiibo.sorties.PAL.sortie,
            }}
            onChoix={setChoix}
            absentesTouchables
          />
          {amiibo.image && (
            <p className="text-[11px] text-texte-discret">Photo : Nintendo</p>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="flex h-6 items-center rounded-md border border-accent-doux bg-accent-doux px-2 text-xs font-semibold text-accent-fonce">
                Amiibo
              </span>
              <span className="flex h-6 items-center rounded-md border border-champ bg-carte px-2 text-xs font-semibold">
                {type}
              </span>
            </div>
            <h1 className="font-titre text-2xl leading-tight font-bold tracking-tight">
              {amiibo.nom}
            </h1>
            {region === "JAP" && amiibo.nomJap && (
              <p lang="ja" className="text-sm text-texte-discret">
                {amiibo.nomJap}
              </p>
            )}
            <p className="text-[15px] font-semibold text-accent-fonce">
              {libelleSortieAmiibo(amiibo.sorties[region], aujourdhui)} ·{" "}
              {NOMS_REGION[region]}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5 rounded-xl border border-bordure bg-carte p-3.5">
            <Info libelle="Série amiibo" valeur={amiibo.serieAmiibo} />
            <Info libelle="Série de jeux" valeur={amiibo.serieJeux} />
            <Info libelle="Personnage" valeur={amiibo.personnage} />
            <Info libelle="Éditeur" valeur={amiibo.editeur} />
            <Info libelle="Type" valeur={type} />
            <Info
              libelle="Identifiant"
              valeur={identifiantLisible(amiibo.identifiant)}
            />
          </dl>

          {amiibo.jeux.length > 0 && (
            <section
              aria-labelledby="jeux-compatibles"
              className="flex flex-col gap-2.5"
            >
              <h2 id="jeux-compatibles" className="text-[15px] font-bold">
                Jeux compatibles ({amiibo.jeux.length})
              </h2>
              <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
                {amiibo.jeux.map((j) => (
                  <li
                    key={`${j.titre}/${j.console}`}
                    className="flex flex-col gap-1 border-t border-separateur px-3.5 py-3 first:border-t-0"
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {j.fiche ? (
                        <Link
                          href={j.fiche}
                          className="text-sm font-semibold text-accent"
                        >
                          {j.titre} <span aria-hidden="true">›</span>
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold">{j.titre}</span>
                      )}
                      <span className="flex h-5 items-center rounded bg-texte px-1.5 text-[11px] font-semibold text-inverse">
                        {j.console}
                      </span>
                    </span>
                    {j.usage && (
                      <span lang="en" className="text-[13px] text-texte-doux">
                        {j.usage}
                      </span>
                    )}
                    {!j.fiche && (
                      <span className="text-xs text-texte-discret">
                        hors catalogue
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-texte-discret">
                Texte de la source, en anglais · AmiiboAPI
              </p>
            </section>
          )}

          <section
            aria-labelledby="disponibilite"
            className="flex flex-col gap-2.5"
          >
            <h2 id="disponibilite" className="text-[15px] font-bold">
              Disponibilité
            </h2>
            <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
              {REGIONS.map((r) => {
                const s = amiibo.sorties[r];
                const aVenir = sortieAVenir(s.date, s.precision, aujourdhui);
                return (
                  <li
                    key={r}
                    className="flex gap-3 border-t border-separateur px-3.5 py-3 first:border-t-0"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-4 font-bold ${s.sortie ? "text-accent-fonce" : "text-absent"}`}
                    >
                      {s.sortie ? (aVenir ? "·" : "✓") : "–"}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold">
                        {NOMS_REGION[r]}{" "}
                        <span className="font-normal text-texte-discret">
                          ·{" "}
                          {s.sortie
                            ? `${aVenir ? "à venir, " : ""}${formaterDate(s.date, s.precision)}`
                            : "non sorti"}
                        </span>
                      </span>
                      {r === "JAP" && s.sortie && amiibo.nomJap && (
                        <span lang="ja" className="text-[13px] text-texte-doux">
                          {amiibo.nomJap}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs leading-relaxed text-texte-discret">
            Sources :{" "}
            <a href={SOURCE_AMIIBOAPI} className={LIEN}>
              AmiiboAPI
            </a>{" "}
            (liste, dates, jeux compatibles) · photo
            {amiibo.boite ? " et boîte" : ""} : Nintendo. Site de fan non
            affilié à Nintendo.
          </p>
        </div>
      </div>

      {amiibo.boite && (
        <dialog
          ref={fenetre}
          aria-label={`Boîte américaine de l'amiibo ${amiibo.nom}`}
          className="m-0 h-full max-h-none w-full max-w-none bg-visionneuse/95 p-0 text-sur-visionneuse backdrop:bg-visionneuse/60"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3.5 p-4">
            <button
              type="button"
              onClick={() => fenetre.current?.close()}
              className="absolute top-3 right-3 min-h-11 px-3 text-[15px] font-semibold"
            >
              Fermer ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-21 point 2) */}
            <img
              srcSet={srcsetAmiibo(amiibo.boite)}
              sizes="(max-width: 632px) calc(100vw - 32px), 600px"
              alt={`Boîte américaine de l'amiibo ${amiibo.nom}`}
              className="max-h-[80vh] w-full max-w-[600px] object-contain"
            />
          </div>
        </dialog>
      )}
    </main>
  );
}
