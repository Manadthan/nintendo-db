import { describe, expect, it } from "vitest";
import {
  disponibilite,
  formaterDate,
  grouperParAnnee,
  trancheNote,
  trier,
  versionAffichee,
} from "./catalogue";
import type { JeuCatalogue, SortieCatalogue } from "./types";

const sortie = (
  titre: string,
  date: string | null,
  extra: Partial<SortieCatalogue> = {},
): SortieCatalogue => ({
  sortie: date !== null,
  titre: date !== null ? titre : null,
  titreRomanise: null,
  date,
  precision: date ? "jour" : null,
  jaquetteSrcset: null,
  ...extra,
});

const jeu = (
  slug: string,
  jap: string | null,
  us: string | null,
  pal: string | null,
  titre = slug,
): JeuCatalogue => ({
  id: slug,
  slug,
  console: { slug: "wii-u", nom: "Wii U" },
  developpeur: null,
  editeur: "Nintendo",
  genres: [],
  metacritic: null,
  sorties: {
    JAP: sortie(`${titre} (JAP)`, jap),
    US: sortie(`${titre} (US)`, us),
    PAL: sortie(`${titre} (PAL)`, pal),
  },
});

const MK8 = jeu(
  "mario-kart-8",
  "2014-05-29",
  "2014-05-30",
  "2014-05-30",
  "Mario Kart 8",
);
const KARAOKE = jeu(
  "wii-karaoke-u",
  "2012-12-08",
  null,
  "2013-10-04",
  "Wii Karaoke U",
);
const SING = jeu("sing-party", null, "2012-11-18", "2013-01-18", "Sing Party");
const JAP_SEUL = jeu("jap-seul", "2014-04-03", null, null, "Jap seul");

describe("versionAffichee (US-03)", () => {
  it("affiche la version PAL avec « Tous »", () => {
    expect(versionAffichee(MK8, "TOUS")?.region).toBe("PAL");
  });

  it("se rabat sur US, puis JAP, pour un jeu non sorti en Europe", () => {
    expect(
      versionAffichee(jeu("x", "2014-01-01", "2014-02-01", null), "TOUS")
        ?.region,
    ).toBe("US");
    expect(versionAffichee(JAP_SEUL, "TOUS")?.region).toBe("JAP");
  });

  it("affiche la version du marché choisi, ou rien si le jeu n'y est pas sorti", () => {
    expect(versionAffichee(MK8, "JAP")?.region).toBe("JAP");
    expect(versionAffichee(KARAOKE, "US")).toBeNull();
  });
});

describe("disponibilite (US-02)", () => {
  it("indique, dans l'ordre JAP · US · PAL, les régions où le jeu est sorti", () => {
    expect(disponibilite(KARAOKE)).toEqual([
      { region: "JAP", sorti: true },
      { region: "US", sorti: false },
      { region: "PAL", sorti: true },
    ]);
  });
});

describe("formaterDate", () => {
  it("écrit la date en français selon sa précision", () => {
    expect(formaterDate("2014-05-30", "jour")).toBe("30 mai 2014");
    expect(formaterDate("2015-01-01", "jour")).toBe("1er janvier 2015");
    expect(formaterDate("2013-10-01", "mois")).toBe("octobre 2013");
    expect(formaterDate("2012-01-01", "annee")).toBe("2012");
  });

  it("affiche « — » pour une date inconnue (jamais inventée)", () => {
    expect(formaterDate(null, null)).toBe("—");
  });
});

describe("trier et grouperParAnnee (US-02)", () => {
  const jeux = [MK8, KARAOKE, SING, JAP_SEUL];

  it("trie du plus ancien au plus récent par défaut, sur la date de la version affichée", () => {
    expect(trier(jeux, "anciens", "TOUS").map((v) => v.jeu.slug)).toEqual([
      "sing-party", // PAL 18/01/2013
      "wii-karaoke-u", // PAL 04/10/2013
      "jap-seul", // JAP 03/04/2014
      "mario-kart-8", // PAL 30/05/2014
    ]);
  });

  it("trie du plus récent au plus ancien", () => {
    expect(trier(jeux, "recents", "TOUS").map((v) => v.jeu.slug)[0]).toBe(
      "mario-kart-8",
    );
  });

  it("trie de A à Z sur le titre affiché, sans tenir compte des accents", () => {
    const accent = jeu("eclair", null, null, "2014-01-01", "Éclair");
    expect(
      trier([MK8, accent, SING], "az", "TOUS").map((v) => v.jeu.slug),
    ).toEqual(["eclair", "mario-kart-8", "sing-party"]);
  });

  it("ne garde que les jeux sortis sur le marché choisi", () => {
    expect(trier(jeux, "anciens", "US").map((v) => v.jeu.slug)).toEqual([
      "sing-party",
      "mario-kart-8",
    ]);
  });

  it("regroupe par année en tri par date, sans groupe en tri alphabétique", () => {
    const groupes = grouperParAnnee(trier(jeux, "anciens", "TOUS"), "anciens");
    expect(groupes.map((g) => [g.titre, g.versions.length])).toEqual([
      ["2013", 2],
      ["2014", 2],
    ]);
    expect(
      grouperParAnnee(trier(jeux, "az", "TOUS"), "az").map((g) => g.titre),
    ).toEqual([null]);
  });
});

describe("tri par note Metacritic (US-17, SPEC v1.21)", () => {
  const note = (slug: string, metacritic: number | null) => ({
    ...jeu(slug, "2015-01-01", "2015-01-01", "2015-01-01"),
    metacritic,
  });
  const jeux = [
    note("sans-b", null),
    note("moyen", 62),
    note("sans-a", null),
    note("chef", 96),
    note("bon", 81),
    note("zelda", 81),
  ];

  it("de la meilleure à la moins bonne ; à égalité par titre ; sans note à la fin, par titre", () => {
    expect(trier(jeux, "note", "TOUS").map((v) => v.jeu.slug)).toEqual([
      "chef",
      "bon",
      "zelda",
      "moyen",
      "sans-a",
      "sans-b",
    ]);
  });

  it("groupes par tranche, aux seuils des couleurs Metacritic", () => {
    expect(
      grouperParAnnee(trier(jeux, "note", "TOUS"), "note").map((g) => [
        g.titre,
        g.versions.length,
      ]),
    ).toEqual([
      ["90 et plus", 1],
      ["75 à 89", 2],
      ["50 à 74", 1],
      ["Sans note", 2],
    ]);
    expect([90, 89, 75, 74, 50, 49, 0].map(trancheNote)).toEqual([
      "90 et plus",
      "75 à 89",
      "75 à 89",
      "50 à 74",
      "50 à 74",
      "Moins de 50",
      "Moins de 50",
    ]);
  });
});
