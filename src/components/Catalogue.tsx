"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  formaterDate,
  grouperParAnnee,
  trier,
} from "@/lib/catalogue/catalogue";
import type { JeuCatalogue, Tri, VersionAffichee } from "@/lib/catalogue/types";
import { Disponibilite } from "./Disponibilite";
import { Jaquette } from "./Jaquette";

type Vue = "grille" | "liste";
const CLE_VUE = "nintendo-db:vue";

/** Choix du visiteur gardé dans ce navigateur ; ignoré si le stockage est indisponible (navigation privée). */
function lireVue(): Vue {
  try {
    return localStorage.getItem(CLE_VUE) === "liste" ? "liste" : "grille";
  } catch {
    return "grille";
  }
}

const abonnes = new Set<() => void>();
function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}
function enregistrerVue(vue: Vue) {
  try {
    localStorage.setItem(CLE_VUE, vue);
  } catch {
    // Stockage indisponible : le choix vaut pour cette visite seulement.
  }
  for (const rappel of abonnes) rappel();
}

type Props = { jeux: JeuCatalogue[]; consoleSlug: string; consoleNom: string };

/** Catalogue d'une console (US-02) : tri, grille / liste, groupes par année. */
export function Catalogue({ jeux, consoleSlug, consoleNom }: Props) {
  const [tri, setTri] = useState<Tri>("anciens");
  // Page préparée à l'avance, identique pour tous (ADR-02) : « grille » au premier affichage,
  // puis le choix enregistré dans ce navigateur.
  const vue = useSyncExternalStore(abonner, lireVue, () => "grille" as Vue);
  const changerVue = enregistrerVue;

  const versions = trier(jeux, tri, "TOUS");
  const groupes = grouperParAnnee(versions, tri);
  const lien = (v: VersionAffichee) => `/jeux/${consoleSlug}/${v.jeu.slug}`;

  return (
    <section
      aria-labelledby="tous-les-jeux"
      className="flex flex-col gap-3.5 px-4 pt-5 pb-7"
    >
      <div className="flex items-baseline gap-2">
        <h2 id="tous-les-jeux" className="font-titre text-[21px] font-bold">
          Tous les jeux
        </h2>
        <span className="text-[15px] font-semibold text-texte-discret">
          {jeux.length}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="tri" className="text-[13px] text-texte-doux">
          Tri
        </label>
        <select
          id="tri"
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="h-9 rounded-[10px] border border-[#d6d9e0] bg-carte px-2.5 text-[13px] font-medium"
        >
          <option value="anciens">Plus anciens</option>
          <option value="recents">Plus récents</option>
          <option value="az">A → Z</option>
        </select>
        <div className="flex-1" />
        <div role="group" aria-label="Affichage" className="flex gap-0.5">
          {(["grille", "liste"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vue === v}
              onClick={() => changerVue(v)}
              className={`h-9 rounded-lg px-2.5 text-[13px] font-medium ${
                vue === v ? "bg-texte text-white" : "text-texte-doux"
              }`}
            >
              {v === "grille" ? "Grille" : "Liste"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[13px] text-texte-discret">
        {versions.length} jeu{versions.length > 1 ? "x" : ""} affiché
        {versions.length > 1 ? "s" : ""} sur {jeux.length}
      </p>

      {groupes.map((groupe) => (
        <div key={groupe.titre ?? "az"} className="flex flex-col gap-3">
          {groupe.titre && (
            <div className="flex items-center gap-2.5">
              <h3 className="text-[15px] font-bold">{groupe.titre}</h3>
              <div className="h-px flex-1 bg-[#dde0e6]" />
              <span className="text-xs text-texte-discret">
                {groupe.versions.length} jeu
                {groupe.versions.length > 1 ? "x" : ""}
              </span>
            </div>
          )}

          {vue === "grille" ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-[18px]">
              {groupe.versions.map((v) => (
                <li key={v.jeu.id}>
                  <Link href={lien(v)} className="flex flex-col gap-2">
                    <Jaquette
                      sortie={v.sortie}
                      titre={v.sortie.titre!}
                      console={consoleNom}
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                    <div className="flex flex-col gap-[3px]">
                      <span className="line-clamp-2 text-sm leading-tight font-semibold">
                        {v.sortie.titre}
                      </span>
                      <span className="text-xs text-texte-discret">
                        {formaterDate(v.sortie.date, v.sortie.precision)}
                      </span>
                      <Disponibilite jeu={v.jeu} />
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
                  className="border-t border-[#eef0f3] first:border-t-0"
                >
                  <Link
                    href={lien(v)}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="w-[54px] shrink-0">
                      <Jaquette
                        sortie={v.sortie}
                        titre={v.sortie.titre!}
                        console={consoleNom}
                        sizes="54px"
                        petite
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm leading-tight font-semibold">
                        {v.sortie.titre}
                      </span>
                      <span className="text-xs text-texte-discret">
                        {formaterDate(v.sortie.date, v.sortie.precision)}
                      </span>
                      <Disponibilite jeu={v.jeu} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
