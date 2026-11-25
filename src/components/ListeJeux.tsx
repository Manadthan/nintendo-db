"use client";

import Link from "next/link";
import { memo } from "react";
import { sortieAVenir } from "@/lib/catalogue/a-venir";
import { formaterDate } from "@/lib/catalogue/catalogue";
import { noterPositionCatalogue } from "@/lib/catalogue/defilement";
import { decouperFrise } from "@/lib/catalogue/frise";
import { premiersDesGroupes } from "@/lib/catalogue/lots";
import { REGIONS, type VersionAffichee } from "@/lib/catalogue/types";
import { possede } from "@/lib/collection/collection";
import {
  CouvertureCarte,
  EtiquettesGuide,
  legendeGuide,
  lienGuide,
} from "./CarteGuide";
import { Disponibilite } from "./Disponibilite";
import { EtiquetteAVenir } from "./EtiquetteAVenir";
import { Frise } from "./Frise";
import { Jaquette } from "./Jaquette";
import { NoteMetacritic } from "./NoteMetacritic";

type Props = {
  vue: "grille" | "liste" | "frise";
  versions: VersionAffichee[];
  groupes: { titre: string | null; versions: VersionAffichee[] }[];
  /** Versions possédées (US-16) ; `null` pour un visiteur : aucune étiquette verte. */
  possessions: ReadonlySet<string> | null;
  /** Nombre de jeux à dessiner (affichage par lots, SPEC v1.41). */
  limite: number;
  /** Jour de préparation de la page (AAAA-MM-JJ, Paris) : étiquette « À venir » des jeux annoncés (US-32). */
  aujourdhui: string;
};

const lien = (v: VersionAffichee) =>
  v.guide
    ? lienGuide(v.guide.isbn)
    : `/jeux/${v.jeu.console.slug}/${v.jeu.slug}`;
const cle = (v: VersionAffichee) => v.guide?.isbn ?? v.jeu.id;

/** La version affichée d'un jeu est-elle encore à venir (US-32) ? Un guide ne l'est jamais. */
const estAVenir = (v: VersionAffichee, aujourdhui: string) =>
  !v.guide && sortieAVenir(v.sortie.date, v.sortie.precision, aujourdhui);

/** « 3 jeux », « 1 jeu · 2 guides », « 2 jeux à venir » (en-tête d'un groupe, US-27, US-32). */
function compte(versions: VersionAffichee[], aujourdhui: string): string {
  const guides = versions.filter((v) => v.guide).length;
  const jeux = versions.length - guides;
  const tousAVenir =
    jeux > 0 && versions.every((v) => estAVenir(v, aujourdhui));
  return [
    jeux && `${jeux} jeu${jeux > 1 ? "x" : ""}${tousAVenir ? " à venir" : ""}`,
    guides && `${guides} guide${guides > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Jeux du catalogue en grille, en liste ou en frise. Mémorisé (`memo`, audit de performance, B) : pendant la frappe
 * d'une recherche, React ne redessine pas les cartes tant que la liste à afficher n'a pas changé.
 */
export const ListeJeux = memo(function ListeJeux({
  vue,
  versions,
  groupes,
  possessions,
  limite,
  aujourdhui,
}: Props) {
  // Au clic sur un jeu : la hauteur et le nombre de jeux dessinés, pour le retour par « Précédent ».
  const noter = () => noterPositionCatalogue(limite);
  // Étiquettes JAP / US / PAL en vert pour les versions possédées (US-16) ; rien pour un visiteur.
  const possedees = (v: VersionAffichee) =>
    possessions ? REGIONS.filter((r) => possede(possessions, v.jeu.id, r)) : [];

  return (
    <div className="flex flex-col gap-3.5">
      {vue === "frise" && (
        <Frise
          annees={decouperFrise(versions.slice(0, limite))}
          lien={lien}
          surClic={noter}
          aVenir={(v) => estAVenir(v, aujourdhui)}
        />
      )}

      {vue !== "frise" &&
        premiersDesGroupes(groupes, limite).map((groupe) => (
          <div key={groupe.titre ?? "az"} className="flex flex-col gap-3">
            {groupe.titre && (
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-bold">{groupe.titre}</h3>
                <div className="h-px flex-1 bg-filet" />
                <span className="text-xs text-texte-discret">
                  {compte(groupe.versions, aujourdhui)}
                </span>
              </div>
            )}

            {vue === "grille" ? (
              // 2 colonnes sur téléphone, jusqu'à 6 sur grand écran (SPEC v1.36).
              <ul className="grid grid-cols-2 gap-x-3 gap-y-[18px] sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 lg:grid-cols-5 xl:grid-cols-6">
                {groupe.affichees.map((v) => (
                  <li key={cle(v)}>
                    <Link
                      href={lien(v)}
                      onClick={noter}
                      className="group flex flex-col gap-2"
                    >
                      {v.guide ? (
                        <>
                          <CouvertureCarte v={v} />
                          <div className="flex flex-col gap-[3px]">
                            <span
                              lang="ja"
                              className="line-clamp-2 text-sm leading-tight font-semibold group-hover:underline"
                            >
                              {v.sortie.titre}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              <EtiquettesGuide v={v} />
                            </div>
                            <span className="text-xs text-texte-discret">
                              {legendeGuide(v)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <Jaquette
                              sortie={v.sortie}
                              titre={v.sortie.titre!}
                              console={v.jeu.console.nom}
                              consoleSlug={v.jeu.console.slug}
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
                            />
                            <NoteMetacritic note={v.jeu.metacritic} />
                          </div>
                          <div className="flex flex-col gap-[3px]">
                            <span className="line-clamp-2 text-sm leading-tight font-semibold group-hover:underline">
                              {v.sortie.titre}
                            </span>
                            <span className="text-xs text-texte-discret">
                              {formaterDate(v.sortie.date, v.sortie.precision)}{" "}
                              · {v.jeu.console.nom}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {estAVenir(v, aujourdhui) && <EtiquetteAVenir />}
                              <Disponibilite
                                jeu={v.jeu}
                                possedees={possedees(v)}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
                {groupe.affichees.map((v) => (
                  <li
                    key={cle(v)}
                    className="border-t border-separateur first:border-t-0"
                  >
                    <Link
                      href={lien(v)}
                      onClick={noter}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface"
                    >
                      {v.guide ? (
                        <>
                          <div className="w-[54px] shrink-0">
                            <CouvertureCarte v={v} petite />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span
                              lang="ja"
                              className="text-sm leading-tight font-semibold"
                            >
                              {v.sortie.titre}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              <EtiquettesGuide v={v} />
                              <span className="text-xs text-texte-discret">
                                {legendeGuide(v)}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative w-[54px] shrink-0">
                            <Jaquette
                              sortie={v.sortie}
                              titre={v.sortie.titre!}
                              console={v.jeu.console.nom}
                              consoleSlug={v.jeu.console.slug}
                              sizes="54px"
                              petite
                            />
                            <NoteMetacritic note={v.jeu.metacritic} petite />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-sm leading-tight font-semibold">
                              {v.sortie.titre}
                            </span>
                            <span className="text-xs text-texte-discret">
                              {formaterDate(v.sortie.date, v.sortie.precision)}{" "}
                              · {v.jeu.console.nom}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {estAVenir(v, aujourdhui) && <EtiquetteAVenir />}
                              <Disponibilite
                                jeu={v.jeu}
                                possedees={possedees(v)}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
    </div>
  );
});
