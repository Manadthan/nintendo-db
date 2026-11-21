import { describe, expect, it } from "vitest";
import { avecRecherche, correspond } from "./recherche";
import type { JeuCatalogue, SortieCatalogue } from "./types";

const sortie = (titre: string | null): SortieCatalogue => ({
  sortie: titre !== null,
  titre,
  titreRomanise: null,
  date: titre ? "2015-01-01" : null,
  precision: titre ? "jour" : null,
  jaquetteSrcset: null,
});

const KIRBY: JeuCatalogue = {
  id: "1",
  slug: "kirby",
  developpeur: "HAL Laboratory, Nintendo SPD",
  genres: [],
  series: [],
  metacritic: null,
  console: { slug: "wii-u", nom: "Wii U" },
  editeur: "Nintendo",
  sorties: {
    JAP: {
      ...sortie("タッチ! カービィ スーパーレインボー"),
      titreRomanise: "Touch! Kirby Super Rainbow",
    },
    US: sortie("Kirby and the Rainbow Curse"),
    PAL: sortie("Kirby and the Rainbow Paintbrush"),
  },
};

const POKKEN: JeuCatalogue = {
  ...KIRBY,
  id: "2",
  slug: "pokken",
  developpeur: "Bandai Namco Studios",
  genres: [],
  console: { slug: "wii-u", nom: "Wii U" },
  sorties: {
    JAP: sortie("ポッ拳"),
    US: sortie("Pokkén Tournament"),
    PAL: sortie("Pokkén Tournament"),
  },
};

describe("correspond (US-05)", () => {
  it("trouve un jeu par le titre de n'importe laquelle des 3 régions", () => {
    expect(correspond(KIRBY, "curse")).toBe(true); // titre US
    expect(correspond(KIRBY, "paintbrush")).toBe(true); // titre PAL
    expect(correspond(KIRBY, "カービィ")).toBe(true); // titre JAP
    expect(correspond(KIRBY, "super rainbow")).toBe(true); // forme romanisée
  });

  it("cherche aussi dans l'éditeur et le développeur", () => {
    expect(correspond(KIRBY, "hal")).toBe(true);
    expect(correspond(POKKEN, "bandai")).toBe(true);
    expect(correspond(KIRBY, "nintendo")).toBe(true);
  });

  it("ignore majuscules, accents et ponctuation", () => {
    expect(correspond(POKKEN, "pokken")).toBe(true);
    expect(correspond(POKKEN, "POKKÉN tournament!")).toBe(true);
  });

  it("exige que chaque mot apparaisse, dans n'importe quel ordre", () => {
    expect(correspond(KIRBY, "rainbow kirby")).toBe(true);
    expect(correspond(KIRBY, "kirby zelda")).toBe(false);
  });

  it("garde tous les jeux pour une recherche vide", () => {
    expect(correspond(KIRBY, "")).toBe(true);
    expect(correspond(KIRBY, "   ")).toBe(true);
  });
});

describe("avecRecherche", () => {
  it("met la recherche dans l'adresse, en gardant le marché", () => {
    expect(avecRecherche("?marche=us", "mario kart")).toBe(
      "?marche=us&q=mario+kart",
    );
    expect(avecRecherche("?marche=us&q=mario", "")).toBe("?marche=us");
    expect(avecRecherche("", "  ")).toBe("");
  });
});
