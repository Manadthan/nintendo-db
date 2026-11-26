"use client";

import { possedeGuide } from "@/lib/collection/collection";
import { basculerGuide, useCollection } from "@/lib/collection/navigateur";

/**
 * Case « Je l'ai » sur la page d'un guide : isolée dans un composant client pour que la page du guide reste
 * préparée à l'avance (ISR) ; pour un visiteur, rien n'est affiché.
 */
export function CaseGuide({ guideId }: { guideId: string }) {
  const collection = useCollection();
  if (!collection.connecte) return null;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-bordure bg-carte px-3.5 text-[15px] font-semibold">
        <input
          type="checkbox"
          checked={possedeGuide(collection.possessions, guideId)}
          onChange={(e) => void basculerGuide(guideId, e.target.checked)}
          className="size-5 accent-possede"
        />
        Je l&apos;ai
      </label>
      {collection.erreur && (
        <p
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2 text-sm text-erreur"
        >
          {collection.erreur}
        </p>
      )}
    </div>
  );
}
