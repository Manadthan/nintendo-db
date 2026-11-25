import { describe, expect, it } from "vitest";
import {
  aujourdhuiParis,
  cleTriDate,
  jeuAVenir,
  sortieAVenir,
} from "./a-venir";
import type { JeuCatalogue, SortieCatalogue } from "./types";

const sortie = (s: Partial<SortieCatalogue>): SortieCatalogue => ({
  sortie: true,
  titre: "Metroid Ravenous",
  titreRomanise: null,
  date: null,
  precision: null,
  jaquette: null,
  ...s,
});
const absente = sortie({ sortie: false, titre: null });
const jeu = (sorties: Partial<JeuCatalogue["sorties"]>): JeuCatalogue => ({
  id: "1",
  slug: "metroid-ravenous",
  console: { slug: "switch-2", nom: "Switch 2" },
  developpeur: null,
  editeur: null,
  genres: [],
  series: [],
  metacritic: null,
  sorties: { JAP: absente, US: absente, PAL: absente, ...sorties },
});

describe("sortieAVenir (ADR-20 point 2)", () => {
  const auj = "2026-11-25";
  it("au jour près : la veille est à venir, le jour même ne l'est plus", () => {
    expect(sortieAVenir("2026-11-26", "jour", auj)).toBe(true);
    expect(sortieAVenir("2026-11-25", "jour", auj)).toBe(false);
    expect(sortieAVenir("2026-11-24", "jour", auj)).toBe(false);
  });
  it("au mois : à venir tant que le mois n'a pas commencé", () => {
    expect(sortieAVenir("2026-12-01", "mois", auj)).toBe(true);
    expect(sortieAVenir("2026-11-01", "mois", auj)).toBe(false);
  });
  it("à la saison : à venir tant que la saison n'a pas commencé (printemps 2027 = 1er mars)", () => {
    expect(sortieAVenir("2027-03-01", "saison", auj)).toBe(true);
    expect(sortieAVenir("2027-03-01", "saison", "2027-03-01")).toBe(false);
  });
  it("à l'année : à venir tant que l'année n'a pas commencé", () => {
    expect(sortieAVenir("2027-12-31", "annee", auj)).toBe(true);
    expect(sortieAVenir("2026-12-31", "annee", auj)).toBe(false);
  });
  it("date inconnue : toujours à venir ; aucune date ni précision : pas à venir", () => {
    expect(sortieAVenir(null, "inconnue", auj)).toBe(true);
    expect(sortieAVenir(null, null, auj)).toBe(false);
  });
});

describe("jeuAVenir", () => {
  const auj = "2026-11-25";
  const metroid = jeu({
    JAP: sortie({ date: "2027-01-28", precision: "jour" }),
    PAL: sortie({ date: null, precision: "inconnue" }),
  });
  it("sur « Tous » : toutes les versions annoncées sont à venir", () => {
    expect(jeuAVenir(metroid, "TOUS", auj)).toBe(true);
  });
  it("sur un marché : la version de ce marché ; un marché sans annonce n'est pas à venir", () => {
    expect(jeuAVenir(metroid, "JAP", auj)).toBe(true);
    expect(jeuAVenir(metroid, "US", auj)).toBe(false);
  });
  it("un jeu sorti dans une région n'est plus à venir sur « Tous »", () => {
    const xeno = jeu({
      JAP: sortie({ date: "2026-11-20", precision: "jour" }),
      PAL: sortie({ date: "2026-12-03", precision: "jour" }),
    });
    expect(jeuAVenir(xeno, "TOUS", auj)).toBe(false);
    expect(jeuAVenir(xeno, "PAL", auj)).toBe(true);
  });
});

describe("cleTriDate (ADR-20 point 3)", () => {
  it("jour et mois : la date ; saison et année : fin de l'année ; inconnue : tout à la fin", () => {
    expect(cleTriDate("2027-01-28", "jour")).toBe("2027-01-28");
    expect(cleTriDate("2027-01-01", "mois")).toBe("2027-01-01");
    expect(cleTriDate("2027-03-01", "saison")).toBe("2027-12-31");
    expect(cleTriDate("2027-12-31", "annee")).toBe("2027-12-31");
    expect(cleTriDate(null, "inconnue")).toBe("9999-12-31");
    expect(cleTriDate(null, null)).toBeNull();
  });
});

describe("aujourdhuiParis", () => {
  it("donne la date de Paris, même quand il est déjà demain à Paris en temps universel", () => {
    expect(aujourdhuiParis(new Date("2026-11-25T23:30:00Z"))).toBe(
      "2026-11-26",
    );
  });
});
