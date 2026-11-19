import { describe, expect, it } from "vitest";
import { classeProportions, FORMES_REELLES } from "./proportions";

describe("classeProportions (étape 9)", () => {
  it("DS et 3DS : boîte presque carrée", () => {
    expect(classeProportions("ds")).toBe("aspect-[768/680]");
    expect(classeProportions("3ds")).toBe("aspect-[768/680]");
  });

  it("Switch et Switch 2 : boîtier plus étroit (étape 10)", () => {
    expect(classeProportions("switch")).toBe("aspect-[1166/1888]");
    expect(classeProportions("switch-2")).toBe("aspect-[1166/1888]");
  });

  it("N64 et GBA : cadre carré dans le catalogue, forme réelle sur la fiche (étape 14)", () => {
    expect(classeProportions("n64")).toBe("aspect-square");
    expect(classeProportions("gba")).toBe("aspect-square");
    expect(FORMES_REELLES.has("n64")).toBe(true);
    expect(FORMES_REELLES.has("wii")).toBe(false);
  });

  it("Wii U, Wii et console inconnue : boîte en hauteur", () => {
    expect(classeProportions("wii-u")).toBe("aspect-[27/38]");
    expect(classeProportions("wii")).toBe("aspect-[27/38]");
    expect(classeProportions("game-cube")).toBe("aspect-[27/38]");
  });
});
