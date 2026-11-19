import { describe, expect, it } from "vitest";
import { niveauNote } from "./metacritic";

describe("couleur de la note Metacritic (US-17)", () => {
  it("vert à partir de 75, jaune de 50 à 74, rouge en dessous de 50", () => {
    expect(niveauNote(97)).toBe("bon");
    expect(niveauNote(75)).toBe("bon");
    expect(niveauNote(74)).toBe("moyen");
    expect(niveauNote(50)).toBe("moyen");
    expect(niveauNote(49)).toBe("faible");
    expect(niveauNote(0)).toBe("faible");
  });
});
