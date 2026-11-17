"use client";

import { useActionState } from "react";
import { ajouterJeu, type EtatAjout } from "@/app/actions/jeux";
import type { ConsoleAdmin } from "@/lib/admin/consoles";
import { REGIONS } from "@/lib/catalogue/types";

/** Ajouter un jeu manquant à la main (US-11) à la console affichée : un titre et les régions sorties en boîte. */
export function FormulaireAjout({
  console: laConsole,
}: {
  console: ConsoleAdmin;
}) {
  const [etat, action, enCours] = useActionState<EtatAjout, FormData>(
    ajouterJeu,
    {},
  );
  return (
    <details
      className="rounded-xl border border-bordure bg-carte p-3"
      open={Boolean(etat.erreur)}
    >
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">
        + Ajouter un jeu
      </summary>
      <form action={action} className="mt-2 flex flex-col gap-3" noValidate>
        <input type="hidden" name="console" value={laConsole.slug} />
        <p className="text-sm text-texte-doux">
          Console : <strong className="text-texte">{laConsole.nom}</strong>
        </p>
        {etat.erreur && (
          <div
            role="alert"
            className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
          >
            {etat.erreur}
          </div>
        )}
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-texte-doux">
          Titre
          <input
            name="titre"
            defaultValue={etat.titre}
            className="h-11 rounded-[10px] border border-champ bg-carte px-3 text-base text-texte"
          />
        </label>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="mb-1 text-[13px] font-semibold text-texte-doux">
            Sorti en boîte
          </legend>
          {REGIONS.map((r) => (
            <label key={r} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                name={`region.${r}`}
                className="size-5 accent-accent"
              />
              {r}
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          disabled={enCours}
          className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
        >
          {enCours ? "Ajout…" : "Ajouter le jeu"}
        </button>
      </form>
    </details>
  );
}
