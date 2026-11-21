"use client";

import { useActionState } from "react";
import { corrigerJeu, type EtatCorrection } from "@/app/actions/jeux";
import type { PrecisionDate, Region } from "@/lib/catalogue/types";

const champ =
  "h-11 rounded-[10px] border border-champ bg-carte px-3 text-base text-texte outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const etiquette =
  "flex flex-col gap-1 text-[13px] font-semibold text-texte-doux";

const NOMS: Record<Region, string> = {
  JAP: "Japon",
  US: "Amérique du Nord",
  PAL: "Europe",
};

type Sortie = {
  region: Region;
  sortie: boolean;
  titre: string;
  titre_romanise: string;
  date_sortie: string;
  precision_date: PrecisionDate;
  code_produit: string;
  editeur: string;
  verrous: string[];
};

/** Petit cadenas après un champ déjà corrigé à la main (l'import ne le remplace plus). */
function Verrou({ actif }: { actif: boolean }) {
  return actif ? (
    <span
      title="Corrigé à la main : l'import ne le remplace plus"
      className="ml-1 text-texte-discret"
    >
      🔒
    </span>
  ) : null;
}

/** Formulaire de correction d'un jeu (US-11) : le jeu, puis ses 3 versions. */
export function FormulaireCorrection({
  gameId,
  developpeur,
  series,
  metacriticNote,
  metacriticUrl,
  verrousJeu,
  sorties,
}: {
  gameId: string;
  developpeur: string;
  /** Séries séparées par « , » (SPEC v1.37). */
  series: string;
  metacriticNote: string;
  metacriticUrl: string;
  verrousJeu: string[];
  sorties: Sortie[];
}) {
  const [etat, action, enCours] = useActionState<EtatCorrection, FormData>(
    corrigerJeu,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="jeu" value={gameId} />
      {etat.erreurs && (
        <div
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
        >
          <ul className="list-disc pl-4">
            {etat.erreurs.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {etat.enregistre && (
        <p
          role="status"
          className="rounded-xl border border-bordure bg-accent-doux p-3 text-sm"
        >
          Fiche enregistrée. Le site se met à jour dans quelques instants.
        </p>
      )}

      <label className={etiquette}>
        <span>
          Développeur
          <Verrou actif={verrousJeu.includes("developpeur")} />
        </span>
        <input
          name="developpeur"
          defaultValue={developpeur}
          className={champ}
        />
      </label>

      <label className={etiquette}>
        <span>
          Séries
          <Verrou actif={verrousJeu.includes("series")} />
        </span>
        <input
          name="series"
          defaultValue={series}
          placeholder="Mario, Dr. Mario"
          className={champ}
        />
        <span className="text-xs text-texte-discret">
          Séparées par des virgules ; une série parente s&apos;écrit aussi.
        </span>
      </label>

      <div className="grid grid-cols-[96px_1fr] gap-3">
        <label className={etiquette}>
          <span>
            Metacritic
            <Verrou actif={verrousJeu.includes("metacritic_note")} />
          </span>
          <input
            name="metacritic_note"
            inputMode="numeric"
            placeholder="0–100"
            defaultValue={metacriticNote}
            className={champ}
          />
        </label>
        <label className={etiquette}>
          <span>
            Page Metacritic
            <Verrou actif={verrousJeu.includes("metacritic_url")} />
          </span>
          <input
            name="metacritic_url"
            type="url"
            placeholder="https://www.metacritic.com/game/…"
            defaultValue={metacriticUrl}
            className={`${champ} min-w-0`}
          />
        </label>
      </div>

      {sorties.map((s) => {
        const v = (c: string) => s.verrous.includes(c);
        return (
          <fieldset
            key={s.region}
            className="flex flex-col gap-3 rounded-xl border border-bordure bg-carte p-3"
          >
            <legend className="px-1 font-titre text-base font-bold">
              {s.region} · {NOMS[s.region]}
            </legend>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name={`${s.region}.sortie`}
                defaultChecked={s.sortie}
                className="size-5 accent-accent"
              />
              Sorti en boîte dans cette région
              <Verrou actif={v("sortie")} />
            </label>
            <label className={etiquette}>
              <span>
                Titre
                <Verrou actif={v("titre")} />
              </span>
              <input
                name={`${s.region}.titre`}
                defaultValue={s.titre}
                className={champ}
              />
            </label>
            {s.region === "JAP" && (
              <label className={etiquette}>
                <span>
                  Titre romanisé
                  <Verrou actif={v("titre_romanise")} />
                </span>
                <input
                  name="JAP.titre_romanise"
                  defaultValue={s.titre_romanise}
                  className={champ}
                />
              </label>
            )}
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className={etiquette}>
                <span>
                  Date de sortie
                  <Verrou actif={v("date_sortie")} />
                </span>
                <input
                  type="date"
                  name={`${s.region}.date_sortie`}
                  defaultValue={s.date_sortie}
                  className={champ}
                />
              </label>
              <label className={etiquette}>
                Précision
                <select
                  name={`${s.region}.precision_date`}
                  defaultValue={s.precision_date}
                  className={champ}
                >
                  <option value="jour">Jour</option>
                  <option value="mois">Mois</option>
                  <option value="annee">Année</option>
                </select>
              </label>
            </div>
            <label className={etiquette}>
              <span>
                Code produit
                <Verrou actif={v("code_produit")} />
              </span>
              <input
                name={`${s.region}.code_produit`}
                defaultValue={s.code_produit}
                placeholder="WUP-P-XXXX"
                className={champ}
              />
            </label>
            <label className={etiquette}>
              <span>
                Éditeur
                <Verrou actif={v("editeur")} />
              </span>
              <input
                name={`${s.region}.editeur`}
                defaultValue={s.editeur}
                className={champ}
              />
            </label>
          </fieldset>
        );
      })}

      <button
        type="submit"
        disabled={enCours}
        className="sticky bottom-3 h-12 rounded-xl bg-accent text-base font-semibold text-inverse shadow-lg disabled:opacity-60"
      >
        {enCours ? "Enregistrement…" : "Enregistrer la fiche"}
      </button>
    </form>
  );
}
