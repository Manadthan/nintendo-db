"use client";

import { supprimerJeu } from "@/app/actions/jeux";

/** Supprimer un jeu (US-11), après confirmation : ses versions et ses jaquettes disparaissent du site. */
export function BoutonSupprimerJeu({
  gameId,
  nom,
  consoleSlug,
}: {
  gameId: string;
  nom: string;
  /** Console du jeu : le retour à la liste la garde (étape 8). */
  consoleSlug: string;
}) {
  return (
    <form
      action={supprimerJeu}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer « ${nom} » du site, avec ses 3 versions et ses jaquettes ? C'est définitif.`,
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="jeu" value={gameId} />
      <input type="hidden" name="nom" value={nom} />
      <input type="hidden" name="console" value={consoleSlug} />
      <button
        type="submit"
        className="h-12 w-full rounded-xl border-2 border-erreur-bordure bg-carte text-base font-semibold text-erreur"
      >
        Supprimer ce jeu
      </button>
    </form>
  );
}
