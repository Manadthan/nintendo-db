"use client";

import { useActionState } from "react";
import { seConnecter, type EtatConnexion } from "@/app/actions/auth";

const champ =
  "h-12 rounded-[10px] border border-[#d6d9e0] bg-carte px-3 text-base text-texte outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(seConnecter, {});

  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      {etat.erreur && (
        <div
          role="alert"
          className="rounded-[10px] border border-[#f1c4c4] bg-[#fff5f5] px-3 py-2.5 text-sm leading-snug text-[#b42318]"
        >
          {etat.erreur}
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texte-doux">
        E-mail
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

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texte-doux">
        Mot de passe
        <input name="password" type="password" autoComplete="current-password" required className={champ} />
      </label>

      <button
        type="submit"
        disabled={enCours}
        className="mt-1.5 h-[50px] rounded-xl bg-accent text-base font-semibold text-white disabled:opacity-60"
      >
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
