import { describe, expect, it } from "vitest";
import {
  completer,
  lireSeries,
  serieWikidata,
  SERIES,
  seriesDuTitre,
  simplifier,
} from "./series";

describe("simplifier", () => {
  it("retire accents, apostrophes et ponctuation", () => {
    expect(simplifier("Pokémon Mystery Dungeon: Gates")).toBe("pokemon mystery dungeon gates");
    expect(simplifier("Luigi’s Mansion")).toBe("luigis mansion");
    expect(simplifier("F-Zero GX")).toBe("f zero gx");
  });
});

describe("seriesDuTitre", () => {
  it("trouve la série et ses parentes", () => {
    expect(seriesDuTitre(["Dr. Mario"])).toEqual(["Dr. Mario", "Mario"]);
    expect(seriesDuTitre(["Mario Kart 8 Deluxe"])).toEqual(["Mario", "Mario Kart"]);
    expect(seriesDuTitre(["Captain Toad: Treasure Tracker"])).toEqual(["Captain Toad", "Mario"]);
    expect(seriesDuTitre(["Hyrule Warriors: Definitive Edition"])).toEqual([
      "Hyrule Warriors",
      "The Legend of Zelda",
    ]);
  });

  it("lit les titres de toutes les régions, y compris japonais", () => {
    expect(seriesDuTitre([null, "Star Fox 64", "Lylat Wars"])).toEqual(["Star Fox"]);
    expect(seriesDuTitre(["どうぶつの森"])).toEqual(["Animal Crossing"]);
    expect(seriesDuTitre(["Mario Slam Basketball"])).toEqual(["Mario"]);
  });

  it("ne confond pas des mots voisins", () => {
    expect(seriesDuTitre(["Wario Land 4"])).toEqual(["Wario"]);
    expect(seriesDuTitre(["Steel Diver"])).toEqual([]);
    expect(seriesDuTitre(["Brothers in Arms"])).toEqual([]);
    expect(seriesDuTitre(["Arms"])).toEqual(["Arms"]);
    expect(seriesDuTitre(["Mother 3"])).toEqual(["Mother"]);
    expect(seriesDuTitre(["Mother's Day"])).toEqual([]);
  });
});

describe("serieWikidata", () => {
  it("ramène les noms Wikidata aux noms de référence", () => {
    expect(serieWikidata("The Legend of Zelda")).toEqual({ nom: "The Legend of Zelda", connue: true });
    expect(serieWikidata("Megaman")).toEqual({ nom: "Mega Man", connue: true });
    expect(serieWikidata("Yoshi platform series")).toEqual({ nom: "Yoshi", connue: true });
    expect(serieWikidata("Mario Kart")).toEqual({ nom: "Mario Kart", connue: true });
    expect(serieWikidata("Nintendo Wars")).toEqual({ nom: "Advance Wars", connue: true });
    expect(serieWikidata("1080°")).toEqual({ nom: "1080°", connue: true });
    expect(serieWikidata("Professeur Layton")).toEqual({ nom: "Professeur Layton", connue: true });
  });

  it("garde une série hors liste, ignore consoles et éléments sans libellé", () => {
    expect(serieWikidata("Cruis'n")).toEqual({ nom: "Cruis'n", connue: false });
    expect(serieWikidata("Wii")).toBeNull();
    expect(serieWikidata("Q4802838")).toBeNull();
  });
});

describe("completer et lireSeries", () => {
  it("ajoute les parentes, sans doublons, triées", () => {
    expect(completer(["Mario Kart", "Mario", "Dr. Mario"])).toEqual(["Dr. Mario", "Mario", "Mario Kart"]);
  });

  it("lit une saisie séparée par des virgules", () => {
    expect(lireSeries(" Mario ,Dr.  Mario,, Mario ")).toEqual(["Dr. Mario", "Mario"]);
    expect(lireSeries("")).toEqual([]);
  });

  it("chaque parente existe dans la liste et chaque nom est unique", () => {
    const noms = SERIES.map((s) => s.nom);
    expect(new Set(noms).size).toBe(noms.length);
    for (const s of SERIES) if (s.parent) expect(noms).toContain(s.parent);
  });
});
