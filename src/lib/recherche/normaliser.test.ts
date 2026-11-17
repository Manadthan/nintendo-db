import { describe, expect, it } from "vitest";
import { normaliser } from "./normaliser";

describe("normaliser", () => {
  it("met en minuscules et retire les accents", () => {
    expect(normaliser("Pokémon")).toBe("pokemon");
    expect(normaliser("Épis de Blé")).toBe("epis de ble");
  });

  it("retire la ponctuation et réduit les espaces", () => {
    expect(normaliser("Captain Toad: Treasure Tracker")).toBe(
      "captain toad treasure tracker",
    );
    expect(normaliser("Mario & Sonic  at the   Rio 2016")).toBe(
      "mario sonic at the rio 2016",
    );
    expect(normaliser("  Splatoon  ")).toBe("splatoon");
  });

  it("colle les apostrophes pour que « yoshis » trouve « Yoshi's »", () => {
    expect(normaliser("Yoshi's Woolly World")).toBe("yoshis woolly world");
    expect(normaliser("Yoshi’s Woolly World")).toBe("yoshis woolly world");
  });

  it("ramène les caractères pleine largeur à leur forme simple", () => {
    expect(normaliser("Ｗｉｉ Ｕ")).toBe("wii u");
  });

  it("conserve les titres japonais, y compris les signes sonores (ゼ ≠ セ)", () => {
    expect(normaliser("ゼルダの伝説")).toBe("ゼルダの伝説");
    expect(normaliser("進め！キノピオ隊長")).toBe("進め キノピオ隊長");
    expect(normaliser("ゼルダ")).not.toBe(normaliser("セルタ"));
  });

  it("renvoie une chaîne vide pour un texte vide ou sans lettres", () => {
    expect(normaliser("")).toBe("");
    expect(normaliser(" — ")).toBe("");
  });
});
