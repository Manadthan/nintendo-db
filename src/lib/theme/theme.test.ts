import { describe, expect, it } from "vitest";
import { SCRIPT_THEME, themeDepuisTexte, themeSuivant } from "./theme";

describe("thème (US-08)", () => {
  it("le bouton passe d'automatique à clair, puis sombre, puis automatique", () => {
    expect(themeSuivant("auto")).toBe("clair");
    expect(themeSuivant("clair")).toBe("sombre");
    expect(themeSuivant("sombre")).toBe("auto");
  });

  it("une valeur absente ou inconnue du stockage vaut automatique", () => {
    expect(themeDepuisTexte(null)).toBe("auto");
    expect(themeDepuisTexte("violet")).toBe("auto");
    expect(themeDepuisTexte("sombre")).toBe("sombre");
  });

  it("le script de tête pose le choix forcé sur <html>, et rien sinon", () => {
    const executer = (stocke: string | null) => {
      const html = { dataset: {} as Record<string, string> };
      new Function("localStorage", "document", SCRIPT_THEME)(
        { getItem: () => stocke },
        { documentElement: html },
      );
      return html.dataset.theme;
    };
    expect(executer("sombre")).toBe("sombre");
    expect(executer("clair")).toBe("clair");
    expect(executer(null)).toBeUndefined();
    expect(executer("<script>")).toBeUndefined();
  });
});
