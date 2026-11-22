"use client";

import { useActionState } from "react";
import {
  basculerPublic,
  modifierProfil,
  type EtatProfil,
} from "@/app/actions/profil";
import { ChoixAvatar } from "@/components/Avatar";
import type { IdAvatar } from "@/lib/profil/avatars";

/** « Modifier » de Mon profil (US-22) : pseudo et avatar. */
export function ModifierProfil({
  pseudo,
  avatar,
}: {
  pseudo: string;
  avatar: IdAvatar;
}) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(
    modifierProfil,
    {},
  );
  return (
    <details
      className="group rounded-xl border border-bordure bg-carte p-3"
      // Reste ouvert après un envoi : le rendu du serveur (revalidatePath) ne doit pas cacher le message.
      open={!!etat.erreurs || !!etat.enregistre}
    >
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">
        Modifier mon pseudo ou mon avatar
      </summary>
      <form action={action} className="mt-2 flex flex-col gap-3" noValidate>
        {etat.erreurs && (
          <div
            role="alert"
            className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
          >
            {etat.erreurs.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
        {etat.enregistre && (
          <p role="status" className="text-sm font-semibold text-possede">
            Profil enregistré.
          </p>
        )}
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-texte-doux">
          Pseudo (3 à 20 lettres, chiffres ou tirets)
          <input
            name="pseudo"
            defaultValue={pseudo}
            maxLength={20}
            autoCapitalize="none"
            className="h-11 rounded-[10px] border border-champ bg-carte px-3 text-base text-texte"
          />
        </label>
        <ChoixAvatar valeur={avatar} />
        <button
          type="submit"
          disabled={enCours}
          className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </details>
  );
}

/** Interrupteur « Profil public » (US-22) : enregistré dès qu'on le touche. */
export function InterrupteurPublic({ public: estPublic }: { public: boolean }) {
  return (
    <form
      action={basculerPublic}
      className="flex items-center justify-between gap-3"
    >
      <span className="flex flex-col text-sm">
        <span className="font-semibold">Profil public</span>
        <span className="text-texte-doux">
          {estPublic
            ? "Votre profil pourra être vu par ceux qui ont le lien (page publique : bientôt)."
            : "Privé : vous seul voyez votre collection."}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        name="public"
        aria-label="Profil public"
        defaultChecked={estPublic}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-champ transition-colors before:absolute before:top-1 before:left-1 before:size-5 before:rounded-full before:bg-carte before:transition-transform checked:bg-possede checked:before:translate-x-5"
      />
    </form>
  );
}
