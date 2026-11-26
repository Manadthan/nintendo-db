import { REGIONS, type Region } from "@/lib/catalogue/types";

export const NOMS_REGION: Record<Region, string> = {
  JAP: "Japon",
  US: "Amérique du Nord",
  PAL: "Europe",
};

/**
 * Bascule JAP / US / PAL de la fiche du jeu (US-04) et de la fiche de l'amiibo (US-29, ADR-21 point 6). Une région
 * non sortie est barrée ; elle reste touchable si `absentesTouchables` (amiibo : « Non sorti dans cette région »).
 */
export function BasculeRegion({
  region,
  sorties,
  onChoix,
  absentesTouchables = false,
}: {
  region: Region;
  sorties: Record<Region, boolean>;
  onChoix: (r: Region) => void;
  absentesTouchables?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Version"
      className="grid w-[230px] grid-cols-3 gap-1 rounded-xl bg-segment p-1"
    >
      {REGIONS.map((r) => {
        const sorti = sorties[r];
        return (
          <button
            key={r}
            type="button"
            aria-pressed={r === region}
            disabled={!sorti && !absentesTouchables}
            aria-label={
              sorti
                ? `Version ${NOMS_REGION[r]}`
                : `${NOMS_REGION[r]} : non sorti`
            }
            onClick={() => onChoix(r)}
            className={`h-10 rounded-[9px] text-sm ${
              r === region
                ? "bg-carte font-semibold shadow-sm"
                : sorti
                  ? "font-medium text-texte-doux"
                  : "font-medium text-absent line-through"
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
