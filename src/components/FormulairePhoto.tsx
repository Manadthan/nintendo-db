"use client";

import { startTransition, useActionState, useState } from "react";
import {
  remplacerJaquetteParPhoto,
  type EtatRemplacement,
} from "@/app/actions/jaquettes";
import type { Region } from "@/lib/catalogue/types";
import { reduirePhoto } from "@/lib/images/reduire";

/**
 * Remplacer une jaquette par une photo (US-12) : sur iPhone, le champ propose l'appareil photo ou la
 * photothèque. La photo est réduite ici (1600 px au plus) avant l'envoi.
 */
export function FormulairePhoto({
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
    remplacerJaquetteParPhoto,
    {},
  );
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);
  const [reduction, setReduction] = useState(false);

  async function envoyer(formulaire: HTMLFormElement) {
    setErreurLocale(null);
    const fichier = (formulaire.elements.namedItem("photo") as HTMLInputElement)
      .files?.[0];
    if (!fichier) {
      setErreurLocale("Choisis ou prends une photo.");
      return;
    }
    setReduction(true);
    try {
      const donnees = new FormData();
      donnees.set("jeu", gameId);
      donnees.set("console", consoleSlug);
      donnees.set("slug", slug);
      donnees.set("region", region);
      donnees.set("photo", await reduirePhoto(fichier), "photo.jpg");
      startTransition(() => action(donnees));
    } catch {
      setErreurLocale("Photo illisible : essaie une autre image.");
    } finally {
      setReduction(false);
    }
  }

  const message = erreurLocale ?? etat.erreur;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void envoyer(e.currentTarget);
      }}
      className="flex flex-col gap-3"
      noValidate
    >
      {message && (
        <div
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
        >
          {message}
        </div>
      )}
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texte-doux">
        Photo de la boîte
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="text-base text-texte file:mr-3 file:h-11 file:rounded-[10px] file:border file:border-champ file:bg-carte file:px-3 file:font-semibold file:text-texte"
        />
      </label>
      <button
        type="submit"
        disabled={enCours || reduction}
        className="h-12 rounded-xl border-2 border-accent bg-carte text-base font-semibold text-accent disabled:opacity-60"
      >
        {reduction || enCours ? "Envoi de la photo…" : "Utiliser cette photo"}
      </button>
    </form>
  );
}
