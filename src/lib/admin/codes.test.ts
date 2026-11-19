import { describe, expect, it } from "vitest";
import { lireFiltreJeux, sansCodeProduit } from "./codes";

describe("filtre « sans code produit » de la liste Jeux (US-18)", () => {
  it("une version sortie sans code suffit ; une version non sortie ne compte pas", () => {
    expect(
      sansCodeProduit([
        { sortie: true, code_produit: "NUS-NZSE" },
        { sortie: true, code_produit: null },
      ]),
    ).toBe(true);
    expect(
      sansCodeProduit([
        { sortie: true, code_produit: "NUS-NZSE" },
        { sortie: false, code_produit: null },
      ]),
    ).toBe(false);
  });

  it("filtre lu dans l'adresse : « tous » par défaut", () => {
    expect(lireFiltreJeux("sans-code")).toBe("sans-code");
    expect(lireFiltreJeux(undefined)).toBe("tous");
    expect(lireFiltreJeux("autre")).toBe("tous");
  });
});
