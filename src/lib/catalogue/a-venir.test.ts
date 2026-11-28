import { describe, expect, it } from "vitest";
import {
  aujourdhuiParis,
  cleTriDate,
  jeuAVenir,
  sortieAVenir,
  versionsAVenir,
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

describe("versionsAVenir : bande de l'accueil (US-32)", () => {
  const auj = "2026-11-25";
  const avecSlug = (slug: string, j: JeuCatalogue) => ({
    ...j,
    slug,
    id: slug,
  });
  const metroid = avecSlug(
    "metroid",
    jeu({
      JAP: sortie({
        titre: "メトロイド",
        date: "2027-01-28",
        precision: "jour",
        jaquette: "metroid/JAP-1",
      }),
      US: sortie({
        titre: "Metroid US",
        date: "2027-02-20",
        precision: "jour",
        jaquette: "metroid/US-1",
      }),
      PAL: sortie({
        date: "2027-02-25",
        precision: "jour",
        jaquette: "metroid/PAL-1",
      }),
    }),
  );
  const kirby = avecSlug(
    "kirby",
    jeu({
      PAL: sortie({ titre: "Kirby", date: "2027-03-01", precision: "saison" }),
    }),
  );
  const xeno = avecSlug(
    "xeno",
    jeu({
      PAL: sortie({
        titre: "Xenoblade",
        date: "2026-12-03",
        precision: "jour",
      }),
    }),
  );
  const sorti = avecSlug(
    "sorti",
    jeu({
      PAL: sortie({ titre: "Pikmin 4", date: "2023-07-21", precision: "jour" }),
    }),
  );

  it("la sortie la plus proche d'abord ; un jeu déjà sorti n'y est pas", () => {
    expect(
      versionsAVenir([kirby, sorti, metroid, xeno], "TOUS", auj).map(
        (v) => v.jeu.slug,
      ),
    ).toEqual(["xeno", "metroid", "kirby"]);
  });

  it("sur « Tous », titre et jaquette suivent PAL → US → JAP, et la date reste la plus proche (SPEC v1.57)", () => {
    const [pal] = versionsAVenir([metroid], "TOUS", auj);
    expect(pal!.region).toBe("PAL");
    expect(pal!.sortie.titre).toBe("Metroid Ravenous");
    expect(pal!.sortie.jaquette).toBe("metroid/PAL-1");
    expect(pal!.sortie.date).toBe("2027-01-28");
    expect(pal!.sortie.precision).toBe("jour");

    const sansPal = avecSlug(
      "sans-pal",
      jeu({
        JAP: sortie({
          titre: "ファイアーエムブレム",
          date: "2027-01-10",
          precision: "jour",
          jaquette: "fe/JAP-1",
        }),
        US: sortie({
          titre: "Fire Emblem US",
          date: "2027-03-15",
          precision: "jour",
          jaquette: "fe/US-1",
        }),
      }),
    );
    const [us] = versionsAVenir([sansPal], "TOUS", auj);
    expect(us!.region).toBe("US");
    expect(us!.sortie.titre).toBe("Fire Emblem US");
    expect(us!.sortie.jaquette).toBe("fe/US-1");
    expect(us!.sortie.date).toBe("2027-01-10");

    const japSeul = avecSlug(
      "jap-seul",
      jeu({
        JAP: sortie({
          titre: "マザー",
          titreRomanise: "Mother",
          date: "2027-04-01",
          precision: "jour",
        }),
      }),
    );
    const [jap] = versionsAVenir([japSeul], "TOUS", auj);
    expect(jap!.region).toBe("JAP");
    expect(jap!.sortie.titreRomanise).toBe("Mother");
    expect(jap!.sortie.date).toBe("2027-04-01");
  });

  it("sur « Tous », à date égale (même clé de tri), garde PAL avant US avant JAP", () => {
    const simultane = avecSlug(
      "simultane",
      jeu({
        JAP: sortie({
          titre: "ゼルダ",
          date: "2027-12-31",
          precision: "annee",
        }),
        PAL: sortie({
          titre: "Zelda",
          date: "2027-03-01",
          precision: "saison",
        }),
      }),
    );
    const [v] = versionsAVenir([simultane], "TOUS", auj);
    expect(v!.region).toBe("PAL");
    expect(v!.sortie.titre).toBe("Zelda");
    expect(v!.sortie.precision).toBe("saison");
    expect(v!.sortie.date).toBe("2027-03-01");
  });

  it("sur un marché, seulement les jeux annoncés sur ce marché, dans leur version et à leur date", () => {
    expect(
      versionsAVenir([metroid, kirby], "JAP", auj).map((v) => v.jeu.slug),
    ).toEqual(["metroid"]);
    const [pal] = versionsAVenir([metroid], "PAL", auj);
    expect(pal!.region).toBe("PAL");
    expect(pal!.sortie.date).toBe("2027-02-25");
  });

  it("à date égale au Japon, départage sur le titre romanisé (SPEC v1.56)", () => {
    const zelda = avecSlug(
      "zelda",
      jeu({
        JAP: sortie({
          titre: "あいうえお",
          titreRomanise: "Zelda",
          date: "2027-01-28",
          precision: "jour",
        }),
      }),
    );
    const animal = avecSlug(
      "animal",
      jeu({
        JAP: sortie({
          titre: "んんん",
          titreRomanise: "Animal Crossing",
          date: "2027-01-28",
          precision: "jour",
        }),
      }),
    );
    expect(
      versionsAVenir([zelda, animal], "JAP", auj).map((v) => v.jeu.slug),
    ).toEqual(["animal", "zelda"]);
  });
});
