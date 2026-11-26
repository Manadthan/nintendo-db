import { describe, expect, it } from "vitest";
import type { VersionAffichee } from "./types";
import {
  VOIR_PAR_DEFAUT,
  avecVoir,
  basculer,
  guidesPermis,
  libelleCompte,
  voirDepuisParametres,
  voirEffectif,
} from "./voir";

// Coches « Jeux » / « Guides » (US-27) / « Amiibo » (US-29) du catalogue.

describe("coches Jeux et Guides (?voir=)", () => {
  it("à l'ouverture, « Jeux » seule ; l'adresse garde le choix", () => {
    expect(voirDepuisParametres("")).toBe(VOIR_PAR_DEFAUT);
    expect(voirDepuisParametres("?voir=guides")).toEqual({
      jeux: false,
      guides: true,
      amiibo: false,
    });
    expect(voirDepuisParametres("?voir=jeux,guides")).toEqual({
      jeux: true,
      guides: true,
      amiibo: false,
    });
    expect(voirDepuisParametres("?voir=jeux,amiibo")).toEqual({
      jeux: true,
      guides: false,
      amiibo: true,
    });
    expect(voirDepuisParametres("?voir=jeux")).toBe(VOIR_PAR_DEFAUT);
    expect(voirDepuisParametres("?voir=n-importe")).toBe(VOIR_PAR_DEFAUT);
  });

  it("toujours les mêmes objets pour un même choix (lecture stable pour React)", () => {
    expect(voirDepuisParametres("?voir=guides")).toBe(
      voirDepuisParametres("?q=x&voir=guides"),
    );
  });

  it("écrit le choix dans l'adresse, rien pour le défaut, sans toucher au reste", () => {
    expect(
      avecVoir("?tri=az", { jeux: true, guides: true, amiibo: false }),
    ).toBe("?tri=az&voir=jeux%2Cguides");
    expect(avecVoir("", { jeux: false, guides: false, amiibo: true })).toBe(
      "?voir=amiibo",
    );
    expect(avecVoir("?voir=guides&tri=az", VOIR_PAR_DEFAUT)).toBe("?tri=az");
    expect(
      voirDepuisParametres(
        avecVoir("", { jeux: false, guides: true, amiibo: true }),
      ),
    ).toEqual({ jeux: false, guides: true, amiibo: true });
  });

  it("on ne peut pas tout décocher", () => {
    expect(basculer(VOIR_PAR_DEFAUT, "jeux")).toBe(VOIR_PAR_DEFAUT);
    expect(basculer(VOIR_PAR_DEFAUT, "guides")).toEqual({
      jeux: true,
      guides: true,
      amiibo: false,
    });
    const amiiboSeuls = voirDepuisParametres("?voir=amiibo");
    expect(basculer(amiiboSeuls, "amiibo")).toBe(amiiboSeuls);
  });

  it("guides seulement sur les marchés Tous et Japon", () => {
    expect(guidesPermis("TOUS")).toBe(true);
    expect(guidesPermis("JAP")).toBe(true);
    expect(guidesPermis("PAL")).toBe(false);
    expect(
      voirEffectif({ jeux: false, guides: true, amiibo: false }, "US"),
    ).toBe(VOIR_PAR_DEFAUT);
    // Les amiibo restent : seule la coche Guides tombe.
    expect(
      voirEffectif(voirDepuisParametres("?voir=guides,amiibo"), "PAL"),
    ).toBe(voirDepuisParametres("?voir=amiibo"));
  });
});

describe("compteur", () => {
  const v = (genre?: "guide" | "amiibo") =>
    ({
      ...(genre === "guide" && { guide: {} }),
      ...(genre === "amiibo" && { amiibo: {} }),
    }) as unknown as VersionAffichee;
  const voir = (q: string) => voirDepuisParametres(q);

  it("Jeux seule : les jeux affichés sur le total", () => {
    expect(libelleCompte([v(), v()], VOIR_PAR_DEFAUT, 4)).toBe(
      "2 jeux affichés sur 4",
    );
    expect(libelleCompte([v()], VOIR_PAR_DEFAUT, 4)).toBe(
      "1 jeu affiché sur 4",
    );
  });

  it("sinon seulement ce qui est coché", () => {
    expect(libelleCompte([v(), v("guide")], voir("?voir=jeux,guides"), 4)).toBe(
      "1 jeu et 1 guide affichés",
    );
    expect(libelleCompte([v("guide")], voir("?voir=guides"), 4)).toBe(
      "1 guide affiché",
    );
    expect(
      libelleCompte(
        [v(), v(), v("guide"), v("amiibo"), v("amiibo")],
        voir("?voir=jeux,guides,amiibo"),
        4,
      ),
    ).toBe("2 jeux, 1 guide et 2 amiibo affichés");
    expect(libelleCompte([], voir("?voir=amiibo"), 4)).toBe("0 amiibo affiché");
  });
});
