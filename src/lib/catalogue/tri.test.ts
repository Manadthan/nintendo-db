import { describe, expect, it } from "vitest";
import { avecTri, triDepuisParametres } from "./tri";

describe("tri dans l'adresse (SPEC v1.45)", () => {
  it("lit ?tri=, sinon le tri par défaut", () => {
    expect(triDepuisParametres("?tri=az")).toBe("az");
    expect(triDepuisParametres("?console=wii&tri=note")).toBe("note");
    expect(triDepuisParametres("?tri=anciens")).toBe("anciens");
    expect(triDepuisParametres("")).toBe("recents");
    expect(triDepuisParametres("?tri=prix")).toBe("recents");
  });

  it("écrit le tri en gardant les autres paramètres, rien pour le tri par défaut", () => {
    expect(avecTri("?console=wii", "az")).toBe("?console=wii&tri=az");
    expect(avecTri("?console=wii&tri=az", "recents")).toBe("?console=wii");
    expect(avecTri("?tri=note", "recents")).toBe("");
    expect(avecTri("", "anciens")).toBe("?tri=anciens");
  });
});
