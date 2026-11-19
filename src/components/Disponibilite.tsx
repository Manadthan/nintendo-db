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
}: {
  jeu: JeuCatalogue;
  /** Régions possédées par le propriétaire connecté (vide pour un visiteur). */
  possedees?: readonly Region[];
}) {
  return (
    <ul aria-label="Disponibilité" className="flex gap-1">
      {disponibilite(jeu).map(({ region, sorti }) => {
        const possede = sorti && possedees.includes(region);
        return (
          <li
            key={region}
            aria-label={`${NOMS[region]} : ${sorti ? "sorti" : "non sorti"}${possede ? ", possédé" : ""}`}
            className={`flex h-5 items-center rounded border px-1.5 text-[10px] font-bold ${
              possede
                ? "border-possede bg-carte text-possede"
                : sorti
                  ? "border-transparent bg-accent-doux text-accent-fonce"
                  : "border-transparent bg-surface text-texte-discret"
            }`}
          >
            {region}
            {sorti && " ✓"}
          </li>
        );
      })}
    </ul>
  );
}
