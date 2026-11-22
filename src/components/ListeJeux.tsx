"use client";

import Link from "next/link";
import { memo } from "react";
import { formaterDate } from "@/lib/catalogue/catalogue";
import { noterPositionCatalogue } from "@/lib/catalogue/defilement";
import { decouperFrise } from "@/lib/catalogue/frise";
import { REGIONS, type VersionAffichee } from "@/lib/catalogue/types";
import { possede } from "@/lib/collection/collection";
import { Disponibilite } from "./Disponibilite";
import { Frise } from "./Frise";
import { Jaquette } from "./Jaquette";
import { NoteMetacritic } from "./NoteMetacritic";

type Props = {
  vue: "grille" | "liste" | "frise";
  versions: VersionAffichee[];
  groupes: { titre: string | null; versions: VersionAffichee[] }[];
  /** Versions possédées (US-16) ; `null` pour un visiteur : aucune étiquette verte. */
  possessions: ReadonlySet<string> | null;
};

const lien = (v: VersionAffichee) =>
  `/jeux/${v.jeu.console.slug}/${v.jeu.slug}`;

/**
 * Jeux du catalogue en grille, en liste ou en frise. Mémorisé (`memo`, audit de performance, B) : pendant la frappe
 * d'une recherche, React ne redessine pas les cartes tant que la liste à afficher n'a pas changé.
 */
export const ListeJeux = memo(function ListeJeux({
  vue,
  versions,
  groupes,
  possessions,
}: Props) {
  // Étiquettes JAP / US / PAL en vert pour les versions possédées (US-16) ; rien pour un visiteur.
  const possedees = (v: VersionAffichee) =>
    possessions ? REGIONS.filter((r) => possede(possessions, v.jeu.id, r)) : [];

  return (
    <div className="flex flex-col gap-3.5">
      {vue === "frise" && (
        <Frise
          annees={decouperFrise(versions)}
          lien={lien}
          surClic={noterPositionCatalogue}
        />
      )}

      {vue !== "frise" &&
        groupes.map((groupe) => (
          <div key={groupe.titre ?? "az"} className={"flex flex-col gap-3"}>
            {groupe.titre && (
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-bold">{groupe.titre}</h3>
                <div className="h-px flex-1 bg-filet" />
                <span className="text-xs text-texte-discret">
                  {groupe.versions.length} jeu
                  {groupe.versions.length > 1 ? "x" : ""}
                </span>
              </div>
            )}

            {vue === "grille" ? (
              // 2 colonnes sur téléphone, jusqu'à 6 sur grand écran (SPEC v1.36).
              <ul className="grid grid-cols-2 gap-x-3 gap-y-[18px] sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 lg:grid-cols-5 xl:grid-cols-6">
                {groupe.versions.map((v) => (
                  <li key={v.jeu.id}>
                    <Link
                      href={lien(v)}
                      onClick={noterPositionCatalogue}
                      className="group flex flex-col gap-2"
                    >
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
                          {formaterDate(v.sortie.date, v.sortie.precision)} ·{" "}
                          {v.jeu.console.nom}
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          <Disponibilite jeu={v.jeu} possedees={possedees(v)} />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
                {groupe.versions.map((v) => (
                  <li
                    key={v.jeu.id}
                    className="border-t border-separateur first:border-t-0"
                  >
                    <Link
                      href={lien(v)}
                      onClick={noterPositionCatalogue}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface"
                    >
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
                          {formaterDate(v.sortie.date, v.sortie.precision)} ·{" "}
                          {v.jeu.console.nom}
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          <Disponibilite jeu={v.jeu} possedees={possedees(v)} />
                        </div>
                      </div>
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
