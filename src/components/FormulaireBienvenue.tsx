"use client";

import { useActionState } from "react";
import {
  accepterInvitation,
  type EtatBienvenue,
} from "@/app/actions/bienvenue";
import { ChoixAvatar } from "@/components/Avatar";
import { LienPerime } from "@/components/LienPerime";
import { avatarOuDefaut } from "@/lib/profil/avatars";

const champ =
  "h-12 rounded-[10px] border border-champ bg-carte px-3 text-base text-texte outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const etiquette =
  "flex flex-col gap-1.5 text-[13px] font-semibold text-texte-doux";

/** Création du compte d'un invité (US-20) : e-mail, mot de passe, pseudo, avatar. */
export function FormulaireBienvenue({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState<EtatBienvenue, FormData>(
    accepterInvitation,
    {},
  );
  if (etat.perime) return <LienPerime />;

  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      <input type="hidden" name="jeton" value={jeton} />
      {etat.erreurs && (
        <div
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm leading-snug text-erreur"
        >
          {etat.erreurs.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      <label className={etiquette}>
        E-mail (pour vous connecter)
        <input
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={etat.email}
          className={champ}
        />
      </label>
      <label className={etiquette}>
        Mot de passe (8 caractères au moins)
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={champ}
        />
      </label>
      <label className={etiquette}>
        Pseudo (3 à 20 lettres, chiffres ou tirets)
        <input
          name="pseudo"
          autoComplete="nickname"
          autoCapitalize="none"
          maxLength={20}
          required
          defaultValue={etat.pseudo}
          className={champ}
        />
      </label>
      <ChoixAvatar valeur={avatarOuDefaut(etat.avatar)} />
      <button
        type="submit"
        disabled={enCours}
        className="mt-1.5 h-[50px] rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
      >
        {enCours ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
