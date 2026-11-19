"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { formaterDate } from "@/lib/catalogue/catalogue";
import { lireMarche } from "@/lib/catalogue/marche";
import { REGIONS, type Marche, type Region } from "@/lib/catalogue/types";
import {
  SOURCES_JAQUETTE,
  regionParDefaut,
  type JeuFiche,
} from "@/lib/fiche/fiche";
import { basculerVersion, useCollection } from "@/lib/collection/navigateur";
import { possede } from "@/lib/collection/collection";
import { FORMES_REELLES } from "@/lib/jaquettes/proportions";
import { Jaquette } from "./Jaquette";

const NOMS: Record<Region, string> = {
  JAP: "Japon",
  US: "Amérique du Nord",
  PAL: "Europe",
};

function Info({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div>
      <dt className="text-xs text-texte-discret">{libelle}</dt>
      {/* Une donnée inconnue s'affiche « — », jamais vide ni inventée (US-04). */}
      <dd className="mt-0.5 text-sm font-medium">{valeur ?? "—"}</dd>
    </div>
  );
}

// Le marché ne change pas pendant la visite de la fiche : rien à écouter.
const sansAbonnement = () => () => {};

/** Fiche d'un jeu (US-04) : sélecteur JAP / US / PAL sous la jaquette, informations, disponibilité, sources. */
export function FicheJeu({ jeu }: { jeu: JeuFiche }) {
  // Page préparée à l'avance (ADR-02) : PAL au premier affichage, puis le marché choisi dans ce navigateur.
  const marche = useSyncExternalStore<Marche>(
    sansAbonnement,
    lireMarche,
    () => "TOUS",
  );
  const [choix, setChoix] = useState<Region | null>(null);
  // Ma collection (US-16) : seulement pour le propriétaire connecté ; un visiteur ne voit rien de plus.
  const collection = useCollection();
  // Sources à créditer en pied de fiche (attribution, R4) : les ajouts à la main n'en ont pas.
  const sourcesExternes = [
    ...new Set(
      REGIONS.map((r) => jeu.sorties[r].sourceJaquette)
        .filter((s) => s === "gametdb" || s === "igdb" || s === "libretro")
        .map((s) => SOURCES_JAQUETTE[s]),
    ),
  ];
  // Wii U : Wikipédia + GameTDB ; Switch 2 : Wikipédia seul (étape 10) ; les autres : GameTDB seul.
  const parWikipedia = ["wii-u", "switch-2", "n64", "gba"].includes(
    jeu.console.slug,
  );
  const region = choix ?? regionParDefaut(jeu, marche);
  const sortie = jeu.sorties[region];
  const titre =
    sortie.titre ?? jeu.sorties[regionParDefaut(jeu, "TOUS")].titre ?? jeu.slug;

  return (
    <main className="flex flex-col gap-5 px-4 pt-2 pb-7">
      <Link
        href="/"
        className="flex h-11 items-center gap-1 text-sm font-medium"
      >
        <span aria-hidden="true">‹</span> Retour au catalogue
      </Link>

      <div className="flex flex-col items-center gap-3">
        {/* Presque pleine largeur sur iPhone (MAQUETTES v0.5) ; 768 px chargés sur écran ×3 (ADR-04). */}
        <div className="w-full max-w-[400px] drop-shadow-[0_10px_14px_rgba(22,24,29,0.16)]">
          <Jaquette
            sortie={sortie}
            titre={titre}
            console={jeu.console.nom}
            consoleSlug={jeu.console.slug}
            formeReelle={FORMES_REELLES.has(jeu.console.slug)}
            sizes="(max-width: 432px) calc(100vw - 32px), 400px"
          />
        </div>
        <div
          role="group"
          aria-label="Version"
          className="grid w-[230px] grid-cols-3 gap-1 rounded-xl bg-segment p-1"
        >
          {REGIONS.map((r) => {
            const sorti = jeu.sorties[r].sortie;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={r === region}
                disabled={!sorti}
                aria-label={
                  sorti ? `Version ${NOMS[r]}` : `${NOMS[r]} : non sorti`
                }
                onClick={() => setChoix(r)}
                className={`h-10 rounded-[9px] text-sm ${
                  r === region
                    ? "bg-carte font-semibold shadow-sm"
                    : sorti
                      ? "font-medium text-texte-doux"
                      : "font-medium text-absent line-through"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
        {sortie.jaquetteSrcset && sortie.sourceJaquette && (
          <p className="text-[11px] text-texte-discret">
            Jaquette : {SOURCES_JAQUETTE[sortie.sourceJaquette]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="flex h-6 items-center rounded-md bg-texte px-2 text-xs font-semibold text-inverse">
            {jeu.console.nom}
          </span>
          <span className="flex h-6 items-center rounded-md border border-champ bg-carte px-2 text-xs font-semibold">
            En boîte
          </span>
        </div>
        <h1 className="font-titre text-2xl leading-tight font-bold tracking-tight">
          {titre}
        </h1>
        {region === "JAP" && sortie.titreRomanise && (
          <p className="text-sm text-texte-discret">{sortie.titreRomanise}</p>
        )}
        <p className="text-[15px] font-semibold text-accent-fonce">
          Sorti le {formaterDate(sortie.date, sortie.precision)} ·{" "}
          {NOMS[region]}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5 rounded-xl border border-bordure bg-carte p-3.5">
        <Info libelle="Éditeur" valeur={sortie.editeur} />
        <Info libelle="Développeur" valeur={jeu.developpeur} />
        <Info libelle="Franchise" valeur={jeu.franchise} />
        <Info libelle="Genre" valeur={jeu.genre} />
        <Info libelle="Code produit" valeur={sortie.codeProduit} />
        <Info libelle="Console" valeur={jeu.console.nom} />
      </dl>

      <section
        aria-labelledby="disponibilite"
        className="flex flex-col gap-2.5"
      >
        <h2 id="disponibilite" className="text-[15px] font-bold">
          Disponibilité
        </h2>
        <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
          {REGIONS.map((r) => {
            const s = jeu.sorties[r];
            return (
              <li
                key={r}
                className="flex gap-3 border-t border-separateur px-3.5 py-3 first:border-t-0"
              >
                <span
                  aria-hidden="true"
                  className={`w-4 font-bold ${s.sortie ? "text-accent-fonce" : "text-absent"}`}
                >
                  {s.sortie ? "✓" : "–"}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">
                    {NOMS[r]}{" "}
                    <span className="font-normal text-texte-discret">
                      ·{" "}
                      {s.sortie
                        ? formaterDate(s.date, s.precision)
                        : "non sorti"}
                    </span>
                  </span>
                  {s.sortie && s.titre !== titre && (
                    <span className="text-[13px] text-texte-doux">
                      {s.titre}
                    </span>
                  )}
                </div>
                {collection.connecte && s.sortie && (
                  <label className="-my-1 flex min-h-11 shrink-0 items-center gap-2 text-[13px] font-medium">
                    <input
                      type="checkbox"
                      checked={possede(collection.possessions, jeu.id, r)}
                      onChange={(e) =>
                        void basculerVersion(
                          { gameId: jeu.id, region: r },
                          e.target.checked,
                        )
                      }
                      aria-label={`Je l'ai : version ${NOMS[r]}`}
                      className="size-5 accent-accent"
                    />
                    Je l&apos;ai
                  </label>
                )}
              </li>
            );
          })}
        </ul>
        {collection.erreur && (
          <p
            role="alert"
            className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2 text-sm text-erreur"
          >
            {collection.erreur}
          </p>
        )}
      </section>

      <p className="text-xs leading-relaxed text-texte-discret">
        Sources :{" "}
        {/* Wii U, Switch 2, N64, GBA : Wikipédia ; les autres consoles, GameTDB seul (SPEC v1.9 à v1.18). */}
        {!parWikipedia ? (
          "GameTDB"
        ) : jeu.wikipediaUrl ? (
          <a
            href={jeu.wikipediaUrl}
            className="text-accent underline-offset-2 hover:underline"
          >
            Wikipédia
          </a>
        ) : (
          "Wikipédia"
        )}
        {parWikipedia && " (CC BY-SA)"}
        {sourcesExternes.length > 0 &&
          ` · jaquettes ${sourcesExternes.join(", ")}`}
        . Site de fan non affilié à Nintendo.
      </p>
    </main>
  );
}
