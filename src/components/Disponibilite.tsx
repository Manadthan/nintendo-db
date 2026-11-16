import { disponibilite } from "@/lib/catalogue/catalogue";
import type { JeuCatalogue } from "@/lib/catalogue/types";

const NOMS = { JAP: "Japon", US: "Amérique du Nord", PAL: "Europe" } as const;

/** JAP · US · PAL, cochées si le jeu y est sorti (US-02). */
export function Disponibilite({ jeu }: { jeu: JeuCatalogue }) {
  return (
    <ul aria-label="Disponibilité" className="flex gap-1">
      {disponibilite(jeu).map(({ region, sorti }) => (
        <li
          key={region}
          aria-label={`${NOMS[region]} : ${sorti ? "sorti" : "non sorti"}`}
          className={`flex h-5 items-center rounded px-1.5 text-[10px] font-bold ${
            sorti
              ? "bg-[#e4e9fb] text-accent-fonce"
              : "bg-[#eceef2] text-texte-discret"
          }`}
        >
          {region}
          {sorti && " ✓"}
        </li>
      ))}
    </ul>
  );
}
