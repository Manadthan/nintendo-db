import { describe, expect, it } from "vitest";
import { dimensionsReduites } from "./reduire";

describe("dimensionsReduites (US-12, photo)", () => {
  it("ramène le plus grand côté à 1600 px, proportions gardées", () => {
    expect(dimensionsReduites(3024, 4032)).toEqual({
      largeur: 1200,
      hauteur: 1600,
    });
    expect(dimensionsReduites(4032, 3024)).toEqual({
      largeur: 1600,
      hauteur: 1200,
    });
  });

  it("n'agrandit jamais une petite photo", () => {
    expect(dimensionsReduites(800, 1000)).toEqual({
      largeur: 800,
      hauteur: 1000,
    });
  });
});
