import { sortieAVenir } from "@/lib/catalogue/a-venir";
import { disponibilite } from "@/lib/catalogue/catalogue";
import type { JeuCatalogue, Region } from "@/lib/catalogue/types";

const NOMS = { JAP: "Japon", US: "Amérique du Nord", PAL: "Europe" } as const;

/**
 * JAP · US · PAL, cochées si le jeu y est sorti (US-02). Ma collection (US-16, SPEC v1.16) : une version possédée a
 * son texte, sa coche et son contour en vert ; un visiteur ne voit jamais de vert.
 */
export function Disponibilite({
  jeu,
  possedees = [],
  souhaitees = [],
  aujourdhui,
}: {
  jeu: JeuCatalogue;
  /** Régions possédées par le propriétaire connecté (vide pour un visiteur). */
  possedees?: readonly Region[];
  /** Régions en liste de souhaits par le compte connecté (vide pour un visiteur). */
  souhaitees?: readonly Region[];
  /** Jour de préparation de la page : une version annoncée pas encore sortie n'a pas de coche (US-32, 25/11). */
  aujourdhui: string;
}) {
  return (
    <ul aria-label="Disponibilité" className="flex shrink-0 gap-1">
      {disponibilite(jeu).map(({ region, sorti: annoncee }) => {
        const s = jeu.sorties[region];
        const aVenir =
          annoncee && sortieAVenir(s.date, s.precision, aujourdhui);
        const sorti = annoncee && !aVenir;
        const possede = sorti && possedees.includes(region);
        const souhaite = annoncee && !possede && souhaitees.includes(region);
        return (
          <li
            key={region}
            aria-label={`${NOMS[region]} : ${sorti ? "sorti" : aVenir ? "à venir" : "non sorti"}${possede ? ", possédé" : souhaite ? ", souhaité" : ""}`}
            className={`flex h-5 shrink-0 items-center rounded border px-1 text-[10px] font-bold whitespace-nowrap ${
              possede
                ? "border-possede bg-carte text-possede"
                : souhaite
                  ? "border-souhait bg-carte text-souhait"
                  : sorti || aVenir
                    ? "border-transparent bg-accent-doux text-accent-fonce"
                    : "border-transparent bg-surface text-texte-discret"
            }`}
          >
            {region}
            {/* Espace fine : les 3 étiquettes et la note tiennent sur une ligne de carte (≈ 165 px, iPhone 12 mini). */}
            {souhaite ? "\u2009★" : sorti ? "\u2009✓" : null}
          </li>
        );
      })}
    </ul>
  );
}
