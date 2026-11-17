import { describe, expect, it } from "vitest";
import { MARCHES, marcheDepuisTexte, versParametre } from "./marche";

describe("marcheDepuisTexte (US-03)", () => {
  it("reconnaît les marchés, en minuscules (adresse) comme en majuscules (stockage)", () => {
    expect(marcheDepuisTexte("jap")).toBe("JAP");
    expect(marcheDepuisTexte("US")).toBe("US");
    expect(marcheDepuisTexte("pal")).toBe("PAL");
    expect(marcheDepuisTexte("tous")).toBe("TOUS");
  });

  it("ignore une valeur inconnue ou absente", () => {
    expect(marcheDepuisTexte("kor")).toBeNull();
    expect(marcheDepuisTexte("")).toBeNull();
    expect(marcheDepuisTexte(null)).toBeNull();
  });
});

describe("versParametre", () => {
  it("écrit le marché en minuscules dans l'adresse, et retire le paramètre pour « Tous »", () => {
    expect(versParametre("?marche=jap&q=zelda", "US")).toBe(
      "?marche=us&q=zelda",
    );
    expect(versParametre("", "PAL")).toBe("?marche=pal");
    expect(versParametre("?marche=us&q=zelda", "TOUS")).toBe("?q=zelda");
    expect(versParametre("?marche=us", "TOUS")).toBe("");
  });
});

describe("MARCHES", () => {
  it("propose Tous, Europe, Amérique du Nord, Japon, dans cet ordre", () => {
    expect(MARCHES.map((m) => m.libelle)).toEqual([
      "Tous",
      "Europe",
      "Amérique du Nord",
      "Japon",
    ]);
  });
});
