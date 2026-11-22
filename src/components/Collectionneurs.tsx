"use client";

import { useActionState, useState } from "react";
import {
  annulerInvitation,
  creerInvitation,
  renouvelerInvitation,
  supprimerCollectionneur,
  type EtatLien,
} from "@/app/actions/collectionneurs";

const ERREUR =
  "rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur";
const BOUTON =
  "h-11 rounded-[10px] border border-bordure bg-carte px-3 text-sm font-semibold";

/** Lien à envoyer soi-même (SMS, messagerie), montré une seule fois (US-19). */
function LienAPartager({ lien, nom }: { lien: string; nom: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-[10px] border border-bordure bg-surface p-3 text-sm"
    >
      <p>
        Lien pour <strong>{nom}</strong>, valable 7 jours et une seule fois. Il
        ne sera plus affiché : copiez-le maintenant.
      </p>
      <input
        readOnly
        aria-label={`Lien d'invitation pour ${nom}`}
        value={lien}
        onFocus={(e) => e.currentTarget.select()}
        className="h-11 rounded-[10px] border border-champ bg-carte px-3 text-sm text-texte"
      />
      <button
        type="button"
        className="h-11 rounded-[10px] bg-accent text-sm font-semibold text-inverse"
        onClick={async () => {
          await navigator.clipboard.writeText(lien);
          setCopie(true);
        }}
      >
        {copie ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}

/** Créer une invitation (US-19) : un nom pour s'en souvenir, puis le lien à partager. */
export function FormulaireInvitation() {
  const [etat, action, enCours] = useActionState<EtatLien, FormData>(
    creerInvitation,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      {etat.erreur && (
        <div role="alert" className={ERREUR}>
          {etat.erreur}
        </div>
      )}
      <label className="flex flex-col gap-1 text-[13px] font-semibold text-texte-doux">
        Nom de l&apos;invité (pour vous en souvenir)
        <input
          name="nom"
          maxLength={40}
          placeholder="Léa"
          className="h-11 rounded-[10px] border border-champ bg-carte px-3 text-base text-texte"
        />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
      >
        {enCours ? "Création…" : "Créer une invitation"}
      </button>
      {etat.lien && etat.nom && (
        <LienAPartager lien={etat.lien} nom={etat.nom} />
      )}
    </form>
  );
}

/** Invitation en attente : nouveau lien (l'ancien n'est pas gardé en clair) ou annulation. */
export function ActionsInvitation({ id, nom }: { id: string; nom: string }) {
  const [etat, action, enCours] = useActionState<EtatLien, FormData>(
    renouvelerInvitation,
    {},
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="invitation" value={id} />
          <button type="submit" disabled={enCours} className={BOUTON}>
            Nouveau lien
          </button>
        </form>
        <form
          action={annulerInvitation}
          onSubmit={(e) => {
            if (
              !window.confirm(
                `Annuler l'invitation de « ${nom} » ? Son lien ne marchera plus.`,
              )
            )
              e.preventDefault();
          }}
        >
          <input type="hidden" name="invitation" value={id} />
          <button type="submit" className={`${BOUTON} text-erreur`}>
            Annuler
          </button>
        </form>
      </div>
      {etat.erreur && (
        <div role="alert" className={ERREUR}>
          {etat.erreur}
        </div>
      )}
      {etat.lien && etat.nom && (
        <LienAPartager lien={etat.lien} nom={etat.nom} />
      )}
    </div>
  );
}

/** Supprimer le compte d'un collectionneur (US-19), après confirmation : profil et collection effacés. */
export function BoutonSupprimerCollectionneur({
  userId,
  pseudo,
}: {
  userId: string;
  pseudo: string;
}) {
  return (
    <form
      action={supprimerCollectionneur}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer le compte de « ${pseudo} » ? Sa collection et son profil seront effacés. C'est définitif.`,
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="compte" value={userId} />
      <button
        type="submit"
        aria-label={`Supprimer le compte de ${pseudo}`}
        className={`${BOUTON} text-erreur`}
      >
        Supprimer
      </button>
    </form>
  );
}
