import { describe, expect, it } from "vitest";
import japon from "./__fixtures__/annonces-japon.json";
import europe from "./__fixtures__/annonces-europe.json";
import etatsUnis from "./__fixtures__/annonces-etats-unis.json";
import {
  dateEtatsUnis,
  dateEurope,
  dateJapon,
  lireEtatsUnis,
  lireEurope,
  lireJapon,
} from "./annonces";

const AUJ = "2026-11-25";

describe("dates des sources (ADR-20 point 5)", () => {
  it("Japon : jour, mois, saison, année, sinon inconnue", () => {
    expect(dateJapon("2027.1.28")).toEqual({
      date: "2027-01-28",
      precision: "jour",
    });
    expect(dateJapon("2027.3")).toEqual({
      date: "2027-03-01",
      precision: "mois",
    });
    expect(dateJapon("2027.春")).toEqual({
      date: "2027-03-01",
      precision: "saison",
    });
    expect(dateJapon("2027.秋")).toEqual({
      date: "2027-09-01",
      precision: "saison",
    });
    expect(dateJapon("2027")).toEqual({
      date: "2027-01-01",
      precision: "annee",
    });
    expect(dateJapon("未定")).toEqual({ date: null, precision: "inconnue" });
  });
  it("Europe : le libellé décide ; « Date à déterminer » (31/12/2050) n'est jamais une date", () => {
    expect(dateEurope("28/01/2027", "2027-01-28T00:00:00Z")).toEqual({
      date: "2027-01-28",
      precision: "jour",
    });
    expect(dateEurope("2027", "2027-12-31T00:00:00Z")).toEqual({
      date: "2027-01-01",
      precision: "annee",
    });
    expect(dateEurope("Mars 2027", null)).toEqual({
      date: "2027-03-01",
      precision: "mois",
    });
    expect(dateEurope("Printemps 2027", null)).toEqual({
      date: "2027-03-01",
      precision: "saison",
    });
    expect(dateEurope("Date à déterminer", "2050-12-31T00:00:00Z")).toEqual({
      date: null,
      precision: "inconnue",
    });
  });
  it("Europe en anglais (titres anglais du catalogue PAL) : « May 2027 », « Spring 2027 », « TBD »", () => {
    expect(dateEurope("May 2027", "2027-05-31T00:00:00Z")).toEqual({
      date: "2027-05-01",
      precision: "mois",
    });
    expect(dateEurope("Spring 2027", null)).toEqual({
      date: "2027-03-01",
      precision: "saison",
    });
    expect(dateEurope("TBD", "2050-12-31T00:00:00Z")).toEqual({
      date: null,
      precision: "inconnue",
    });
  });
  it("US : le 31/12 tient lieu d'année seule", () => {
    expect(dateEtatsUnis("2027-01-28T00:00:00.000Z")).toEqual({
      date: "2027-01-28",
      precision: "jour",
    });
    expect(dateEtatsUnis("2027-12-31T00:00:00.000Z")).toEqual({
      date: "2027-01-01",
      precision: "annee",
    });
  });
});

describe("lireJapon", () => {
  const annonces = lireJapon(japon.items, AUJ);
  it("garde les jeux Nintendo et Pokémon à venir ; écarte amiibo, consoles, contenus en plus, autres éditeurs, téléchargement seul, éditions spéciales, jeux sortis", () => {
    expect(annonces.map((a) => a.titre).sort()).toEqual(
      [
        "Xenoblade3 (ゼノブレイド3) Nintendo Switch 2 Edition",
        "ポケットモンスター ウェーブ",
        "メトロイド ラヴェナス",
        "星のカービィ ワールドビヨンド",
      ].sort(),
    );
  });
  it("un jeu annoncé deux fois garde la date la plus précise (« 2027.春 » plutôt que « 2027 »)", () => {
    const kirby = annonces.find(
      (a) => a.titre === "星のカービィ ワールドビヨンド",
    )!;
    expect(kirby).toMatchObject({
      date: "2027-03-01",
      precision: "saison",
      console: "switch-2",
      region: "JAP",
    });
  });
  it("image officielle du Japon quand la source la donne", () => {
    expect(
      annonces.find((a) => a.titre === "メトロイド ラヴェナス")!.image,
    ).toBe("https://img-eshop.cdn.nintendo.net/i/d4e5f6.jpg");
  });
});

describe("lireEurope", () => {
  const annonces = lireEurope(europe.docs, AUJ);
  it("jeux à venir, console et précision ; un jeu déjà sorti est écarté", () => {
    expect(annonces.map((a) => [a.titre, a.console, a.precision])).toEqual([
      ["Pokémon Vents", "switch-2", "annee"],
      [
        "Xenoblade Chronicles 3 – Nintendo Switch 2 Edition",
        "switch-2",
        "jour",
      ],
      ["Metroid Ravenous", "switch-2", "jour"],
      ["Jeu sans date", "switch", "inconnue"],
      ["Jeu au mois", "switch", "mois"],
    ]);
  });
});

describe("lireEtatsUnis", () => {
  const annonces = lireEtatsUnis(etatsUnis, AUJ);
  it("jeux Nintendo à venir, sans les éditions spéciales, packs de mise à jour, jeux sortis ni autres éditeurs", () => {
    expect(annonces.map((a) => a.titre)).toEqual([
      "Metroid Ravenous",
      "Kirby and the World Beyond",
    ]);
  });
  it("le produit en boîte du My Nintendo Store donne la boîte américaine", () => {
    const metroid = annonces[0]!;
    expect(metroid.physique).toBe(true);
    expect(metroid.image).toContain(
      "ncom/My%20Nintendo%20Store/EN-US/Nintendo%20Switch%202",
    );
  });
  it("un même jeu écrit avec un tiret long ou court n'est gardé qu'une fois", () => {
    const produit = (name: string, sku: string) => ({
      name,
      nsuid: sku,
      platform: "Nintendo Switch 2",
      releaseDate: "2027-02-25T00:00:00.000Z",
      sku,
      softwarePublisher: "Nintendo",
    });
    const deux = lireEtatsUnis(
      [
        produit("Hyrule Warriors: Age of Calamity – Definitive Edition", "1"),
        produit("Hyrule Warriors: Age of Calamity - Definitive Edition", "2"),
      ],
      AUJ,
    );
    expect(deux).toHaveLength(1);
  });

  it("« 2027 » (31/12) : année seule", () => {
    expect(annonces[1]).toMatchObject({
      date: "2027-01-01",
      precision: "annee",
    });
  });
});
