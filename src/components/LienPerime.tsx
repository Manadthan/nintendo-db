import Link from "next/link";

/** Lien d'invitation expiré, déjà utilisé, annulé ou inconnu (US-20). */
export function LienPerime() {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-3 text-sm leading-snug text-erreur"
    >
      <p className="font-semibold">
        Ce lien d&apos;invitation n&apos;est plus valable.
      </p>
      <p>
        Il a expiré, a déjà servi ou a été annulé : demandez une nouvelle
        invitation à la personne qui vous l&apos;a envoyé.
      </p>
      <Link href="/" className="font-semibold text-accent">
        Voir le catalogue
      </Link>
    </div>
  );
}
