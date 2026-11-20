import { describe, expect, it } from "vitest";
import { SCANS_SWITCH } from "./relais-switch";
import { LANGUES_SCAN_WII_U } from "./relais-wii";

// Boîte PAL (choix du propriétaire, 20/11/2026, SPEC v1.28) : la française (PEGI) avant l'anglaise, souvent un
// scan allemand (USK) chez GameTDB ; l'allemande en dernier recours.
describe("langue de la boîte PAL", () => {
  it("Wii U : FR, puis EN, puis DE", () => {
    expect(LANGUES_SCAN_WII_U.PAL).toEqual(["FR", "EN", "DE"]);
  });

  it("Switch : haute définition FR, EN, DE, puis scan moyen FR, EN", () => {
    expect(SCANS_SWITCH.PAL).toEqual([
      "coverHQ/FR",
      "coverHQ/EN",
      "coverHQ/DE",
      "coverM/FR",
      "coverM/EN",
    ]);
  });
});
