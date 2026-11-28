"use client";

import { possedeGuide, souhaiteGuide } from "@/lib/collection/collection";
import {
  basculerGuide,
  basculerSouhaitGuide,
  useCollection,
} from "@/lib/collection/navigateur";

/**
 * Cases « Je l'ai » et « Liste de souhaits » sur la page d'un guide : isolées dans un composant client pour que la
 * page du guide reste préparée à l'avance (ISR) ; pour un visiteur, rien n'est affiché.
 */
export function CaseGuide({ guideId }: { guideId: string }) {
  const collection = useCollection();
  if (!collection.connecte) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-bordure bg-carte px-3.5 text-[15px] font-semibold">
          <input
            type="checkbox"
            checked={possedeGuide(collection.possessions, guideId)}
            onChange={(e) => void basculerGuide(guideId, e.target.checked)}
            className="size-5 accent-possede"
          />
          Je l&apos;ai
        </label>
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-bordure bg-carte px-3.5 text-[15px] font-semibold">
          <input
            type="checkbox"
            checked={souhaiteGuide(collection.souhaits, guideId)}
            onChange={(e) =>
              void basculerSouhaitGuide(guideId, e.target.checked)
            }
            className="size-5 accent-souhait"
          />
          Liste de souhaits
        </label>
      </div>
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
