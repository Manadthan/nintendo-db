import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lireDate, lireListeWikipedia, slugifier } from "./wikipedia";

const FIXTURE = readFileSync(join(__dirname, "__fixtures__/wii-u-wikipedia.html"), "utf8");
const jeux = lireListeWikipedia(FIXTURE);
const jeu = (slug: string) => jeux.find((j) => j.slug === slug);

describe("lireListeWikipedia — fixture « List of Wii U games » (révision 1380261790)", () => {
  it("retient les 50 jeux en boîte (†) dont Nintendo est éditeur dans au moins une région", () => {
    expect(jeux).toHaveLength(50);
  });

  it("lit les dates JAP / US / PAL, le développeur et l'éditeur de chaque région", () => {
    expect(jeu("mario-kart-8")).toMatchObject({
      titres: { US: "Mario Kart 8", PAL: "Mario Kart 8" },
      developpeur: "Nintendo EAD, Bandai Namco Studios",
      wikipediaUrl: "https://en.wikipedia.org/wiki/Mario_Kart_8",
      sorties: {
        JAP: { date: "2014-05-29", precision: "jour", editeur: "Nintendo" },
        US: { date: "2014-05-30", precision: "jour", editeur: "Nintendo" },
        PAL: { date: "2014-05-30", precision: "jour", editeur: "Nintendo" },
      },
    });
  });

  it("distingue les titres nord-américain et européen quand ils diffèrent", () => {
    expect(jeu("kirby-and-the-rainbow-paintbrush")?.titres).toEqual({
      US: "Kirby and the Rainbow Curse",
      PAL: "Kirby and the Rainbow Paintbrush",
    });
  });

  it("note « non sorti » une région marquée Unreleased", () => {
    expect(jeu("wii-karaoke-u")?.sorties.US).toBeNull();
    expect(jeu("wii-karaoke-u")?.sorties.PAL?.date).toBe("2013-10-04");
  });

  it("répartit les éditeurs par région (JP, NA, PAL/EU, WW)", () => {
    expect(jeu("hyrule-warriors")?.sorties).toMatchObject({
      JAP: { editeur: "Koei Tecmo" },
      US: { editeur: "Nintendo" },
      PAL: { editeur: "Nintendo" },
    });
  });

  it("garde un jeu dont Nintendo n'est éditeur que dans une région", () => {
    expect(jeu("rayman-legends")?.sorties).toMatchObject({ JAP: { editeur: "Nintendo" }, US: { editeur: "Ubisoft" } });
  });

  it("écarte les jeux d'autres éditeurs et les jeux sans boîte", () => {
    expect(jeu("007-legends")).toBeUndefined(); // Activision
    expect(jeu("ark-rush")).toBeUndefined(); // Nintendo, mais téléchargeable seulement
  });

  it("retrouve l'adresse des 4 jeux de départ (pas de doublon à l'import)", () => {
    for (const slug of ["mario-kart-8", "splatoon", "kirby-and-the-rainbow-paintbrush", "wii-karaoke-u"]) {
      expect(jeu(slug), slug).toBeDefined();
    }
  });

  it("donne des adresses uniques", () => {
    expect(new Set(jeux.map((j) => j.slug)).size).toBe(jeux.length);
  });
});

describe("lireListeWikipedia — forme inattendue (R6)", () => {
  it("échoue clairement sans tableau", () => {
    expect(() => lireListeWikipedia("<p>Rien</p>")).toThrow(/tableau/i);
  });

  it("échoue clairement si une colonne attendue manque", () => {
    const sansEurope = FIXTURE.replace(/Europe/g, "Ailleurs");
    expect(() => lireListeWikipedia(sansEurope)).toThrow(/Europe/);
  });
});

describe("lireDate", () => {
  it("lit une date complète, un mois ou une année", () => {
    expect(lireDate("November 18, 2012")).toEqual({ date: "2012-11-18", precision: "jour" });
    expect(lireDate("March 2013")).toEqual({ date: "2013-03-01", precision: "mois" });
    expect(lireDate("2013")).toEqual({ date: "2013-01-01", precision: "annee" });
  });

  it("renvoie null pour une région où le jeu n'est pas sorti", () => {
    expect(lireDate("Unreleased")).toBeNull();
    expect(lireDate("")).toBeNull();
  });

  it("échoue clairement sur un format inconnu plutôt que d'inventer une date", () => {
    expect(() => lireDate("Bientôt")).toThrow(/Bientôt/);
  });
});

describe("slugifier (ADR-06)", () => {
  it("fabrique une adresse en minuscules, chiffres et tirets", () => {
    expect(slugifier("The Legend of Zelda: Breath of the Wild")).toBe("the-legend-of-zelda-breath-of-the-wild");
    expect(slugifier("Yoshi's Woolly World")).toBe("yoshis-woolly-world");
    expect(slugifier("Mario & Sonic at the Rio 2016 Olympic Games")).toBe("mario-sonic-at-the-rio-2016-olympic-games");
    expect(slugifier("Tokyo Mirage Sessions ♯FE")).toBe("tokyo-mirage-sessions-fe");
    expect(slugifier("Pokkén Tournament")).toBe("pokken-tournament");
  });
});
