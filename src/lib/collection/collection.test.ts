import { describe, expect, it } from "vitest";
import { avecVersion, cleVersion, ensemble, possede } from "./collection";

describe("ma collection (US-16)", () => {
  const possessions = ensemble([
    { game_id: "splatoon", region: "PAL" },
    { game_id: "splatoon", region: "JAP" },
  ]);

  it("une version possédée se reconnaît par son jeu et sa région", () => {
    expect(possede(possessions, "splatoon", "PAL")).toBe(true);
    expect(possede(possessions, "splatoon", "US")).toBe(false);
    expect(possede(possessions, "mario-kart-8", "PAL")).toBe(false);
  });

  it("cocher et décocher rendent un nouvel ensemble, sans toucher l'ancien", () => {
    const avec = avecVersion(
      possessions,
      { gameId: "splatoon", region: "US" },
      true,
    );
    expect(possede(avec, "splatoon", "US")).toBe(true);
    expect(possede(possessions, "splatoon", "US")).toBe(false);
    const sans = avecVersion(
      avec,
      { gameId: "splatoon", region: "PAL" },
      false,
    );
    expect([...sans].sort()).toEqual([
      cleVersion("splatoon", "JAP"),
      cleVersion("splatoon", "US"),
    ]);
  });
});
