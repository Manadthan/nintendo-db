import { describe, expect, it } from "vitest";
import { classeProportions } from "./proportions";

describe("classeProportions (étape 9)", () => {
  it("DS et 3DS : boîte presque carrée", () => {
    expect(classeProportions("ds")).toBe("aspect-[768/680]");
    expect(classeProportions("3ds")).toBe("aspect-[768/680]");
  });

  it("Wii U, Wii et console inconnue : boîte en hauteur", () => {
    expect(classeProportions("wii-u")).toBe("aspect-[27/38]");
    expect(classeProportions("wii")).toBe("aspect-[27/38]");
    expect(classeProportions("game-cube")).toBe("aspect-[27/38]");
  });
});
