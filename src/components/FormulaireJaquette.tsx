"use client";

import { useActionState } from "react";
import {
  remplacerJaquetteParAdresse,
  type EtatRemplacement,
} from "@/app/actions/jaquettes";
import type { Region } from "@/lib/catalogue/types";

const champ =
  "h-12 rounded-[10px] border border-champ bg-carte px-3 text-base text-texte outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

/** Remplacer une jaquette par l'adresse d'une image (US-12). */
export function FormulaireJaquette({
  gameId,
  consoleSlug,
  slug,
  region,
}: {
  gameId: string;
  /** Console du jeu : le retour à la liste des jaquettes la garde (étape 8). */
  consoleSlug: string;
  slug: string;
  region: Region;
}) {
  const [etat, action, enCours] = useActionState<EtatRemplacement, FormData>(
    remplacerJaquetteParAdresse,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="jeu" value={gameId} />
      <input type="hidden" name="console" value={consoleSlug} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="region" value={region} />
      {etat.erreur && (
        <div
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
        >
          {etat.erreur}
        </div>
      )}
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texte-doux">
        Adresse de l&apos;image
        <input
          name="adresse"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…/jaquette.jpg"
          defaultValue={etat.adresse}
          className={champ}
        />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
      >
        {enCours ? "Copie en cours…" : "Remplacer la jaquette"}
      </button>
    </form>
  );
}
