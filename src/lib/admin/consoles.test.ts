import { describe, expect, it } from "vitest";
import { SLUG_CONSOLE, consoleChoisie } from "./consoles";

const CONSOLES = [
  { slug: "wii", nom: "Wii" },
  { slug: "wii-u", nom: "Wii U" },
];

describe("consoleChoisie (administration, étape 8)", () => {
  it("prend la console de l'adresse", () => {
    expect(consoleChoisie(CONSOLES, "wii")?.nom).toBe("Wii");
  });

  it("sans choix ou avec une valeur inconnue : la Wii U", () => {
    expect(consoleChoisie(CONSOLES)?.slug).toBe("wii-u");
    expect(consoleChoisie(CONSOLES, "game-cube")?.slug).toBe("wii-u");
  });

  it("sans Wii U, la première console ; sans console, rien", () => {
    expect(consoleChoisie([CONSOLES[0]!], null)?.slug).toBe("wii");
    expect(consoleChoisie([], "wii")).toBeNull();
  });

  it("reconnaît une adresse de console valide", () => {
    expect(SLUG_CONSOLE.test("wii-u")).toBe(true);
    expect(SLUG_CONSOLE.test("../admin")).toBe(false);
  });
});
