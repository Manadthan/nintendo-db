import { describe, expect, it } from "vitest";
import {
  VOIR_PAR_DEFAUT,
  avecVoir,
  basculer,
  guidesPermis,
  voirDepuisParametres,
  voirEffectif,
} from "./voir";

// Coches « Jeux » / « Guides » du catalogue (US-27).

describe("coches Jeux et Guides (?voir=)", () => {
  it("à l'ouverture, « Jeux » seule ; l'adresse garde le choix", () => {
    expect(voirDepuisParametres("")).toBe(VOIR_PAR_DEFAUT);
    expect(voirDepuisParametres("?voir=guides")).toEqual({
      jeux: false,
      guides: true,
    });
    expect(voirDepuisParametres("?voir=jeux,guides")).toEqual({
      jeux: true,
      guides: true,
    });
    expect(voirDepuisParametres("?voir=n-importe")).toBe(VOIR_PAR_DEFAUT);
  });

  it("toujours les mêmes objets pour un même choix (lecture stable pour React)", () => {
    expect(voirDepuisParametres("?voir=guides")).toBe(
      voirDepuisParametres("?q=x&voir=guides"),
    );
  });

  it("écrit le choix dans l'adresse, rien pour le défaut, sans toucher au reste", () => {
    expect(avecVoir("?tri=az", { jeux: true, guides: true })).toBe(
      "?tri=az&voir=jeux%2Cguides",
    );
    expect(avecVoir("?voir=guides&tri=az", VOIR_PAR_DEFAUT)).toBe("?tri=az");
    expect(
      voirDepuisParametres(avecVoir("", { jeux: false, guides: true })),
    ).toEqual({ jeux: false, guides: true });
  });

  it("on ne peut pas tout décocher", () => {
    expect(basculer(VOIR_PAR_DEFAUT, "jeux")).toBe(VOIR_PAR_DEFAUT);
    expect(basculer(VOIR_PAR_DEFAUT, "guides")).toEqual({
      jeux: true,
      guides: true,
    });
  });

  it("guides seulement sur les marchés Tous et Japon", () => {
    expect(guidesPermis("TOUS")).toBe(true);
    expect(guidesPermis("JAP")).toBe(true);
    expect(guidesPermis("PAL")).toBe(false);
    expect(voirEffectif({ jeux: false, guides: true }, "US")).toBe(
      VOIR_PAR_DEFAUT,
    );
  });
});
