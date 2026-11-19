import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  articlesParTitre,
  lireNoteMetacritic,
  pageMetacritic,
  titreArticle,
} from "./metacritic";

// Encadrés des articles Wikipédia du 19/11/2026 (fixture réduite, scripts/fixture-metacritic.mjs).
const { articles } = JSON.parse(
  readFileSync(
    join(__dirname, "__fixtures__/metacritic-wikipedia.json"),
    "utf8",
  ),
) as { articles: Record<string, string> };
const note = (titre: string, console_: string) =>
  lireNoteMetacritic(articles[titre]!, console_);

describe("note Metacritic lue dans Wikipédia (US-17)", () => {
  it("note étiquetée par console : celle de la console du jeu", () => {
    expect(
      note("Super Smash Bros. for Nintendo 3DS and Wii U", "wii-u"),
    ).toMatchObject({ statut: "note", note: 92 });
    expect(
      note("Super Smash Bros. for Nintendo 3DS and Wii U", "3ds"),
    ).toMatchObject({ statut: "note", note: 85 });
    expect(
      note("Paper Mario: The Thousand-Year Door", "gamecube"),
    ).toMatchObject({ statut: "note", note: 87 });
    expect(note("Paper Mario: The Thousand-Year Door", "switch")).toMatchObject(
      { statut: "note", note: 88 },
    );
    expect(note("Luigi's Mansion", "gamecube")).toMatchObject({
      statut: "note",
      note: 78,
    });
    expect(note("Xenoblade Chronicles X", "switch-2")).toMatchObject({
      statut: "note",
      note: 79,
    });
  });

  it("notes d'autres consoles seulement : pas de note (Mario Kart 8 Wii U, l'article ne note que la Switch)", () => {
    expect(note("Mario Kart 8", "wii-u")).toMatchObject({
      statut: "sans-note",
    });
    expect(
      note("The Legend of Zelda: Twilight Princess", "gamecube"),
    ).toMatchObject({ statut: "sans-note" });
  });

  it("note unique rattachée par son adresse Metacritic, son étiquette ou l'article d'une seule console", () => {
    expect(note("Splatoon (video game)", "wii-u")).toEqual({
      statut: "note",
      note: 81,
      url: "https://www.metacritic.com/game/splatoon/",
    });
    expect(note("Mario Party 8", "wii")).toMatchObject({
      statut: "note",
      note: 62,
    });
    expect(note("Pikmin (video game)", "gamecube")).toMatchObject({
      statut: "note",
      note: 89,
    });
    // Plusieurs notes sur une ligne, chacune avec sa console : 89 (GC), 77 (Wii), 82 (NS).
    expect(note("Pikmin (video game)", "wii")).toMatchObject({
      statut: "note",
      note: 77,
    });
    expect(note("Pikmin (video game)", "switch")).toMatchObject({
      statut: "note",
      note: 82,
    });
    expect(note("Pikmin (video game)", "wii-u")).toMatchObject({
      statut: "sans-note",
    });
    expect(note("New Super Mario Bros.", "ds")).toMatchObject({
      statut: "note",
      note: 89,
    });
  });

  it("note sans console dans un article sur plusieurs consoles : ambiguë (Metroid Prime : 97 GameCube, 94 Switch)", () => {
    expect(note("Metroid Prime", "switch")).toMatchObject({ statut: "ambigu" });
    expect(note("Metroid Prime", "gamecube")).toMatchObject({
      statut: "ambigu",
    });
  });

  it("pas d'encadré de critiques : pas de note", () => {
    expect(note("Rayman Legends", "wii-u")).toMatchObject({
      statut: "sans-note",
    });
  });

  it("page Metacritic : https, sans « critic-reviews » ni paramètres", () => {
    expect(
      pageMetacritic(
        "https://www.metacritic.com/game/pikmin/critic-reviews/?platform=gamecube",
      ),
    ).toBe("https://www.metacritic.com/game/pikmin/");
    expect(
      pageMetacritic(
        "http://www.metacritic.com/games/platforms/ds/newsupermariobros",
      ),
    ).toBe("https://www.metacritic.com/games/platforms/ds/newsupermariobros/");
    expect(pageMetacritic("https://exemple.fr/jeu")).toBeNull();
  });
});

describe("article à lire (US-17)", () => {
  it("adresse Wikipédia connue, sinon titre US, PAL, puis romanisé", () => {
    expect(
      titreArticle({
        wikipediaUrl: "https://en.wikipedia.org/wiki/Splatoon_(video_game)",
        titres: { US: "Splatoon", PAL: "Splatoon", romanise: null },
      }),
    ).toBe("Splatoon (video game)");
    expect(
      titreArticle({
        wikipediaUrl: null,
        titres: { US: null, PAL: null, romanise: "Doubutsu Banchou" },
      }),
    ).toBe("Doubutsu Banchou");
  });

  it("suit normalisation et redirections de l'API ; article absent → null", () => {
    const lire = articlesParTitre({
      query: {
        normalized: [{ from: "doubutsu Banchou", to: "Doubutsu Banchou" }],
        redirects: [
          { from: "Doubutsu Banchou", to: "Cubivore: Survival of the Fittest" },
        ],
        pages: [
          {
            title: "Cubivore: Survival of the Fittest",
            revisions: [{ slots: { main: { content: "| MC = 71/100" } } }],
          },
          { title: "Jeu inconnu", missing: true },
        ],
      },
    });
    expect(lire("doubutsu Banchou")).toBe("| MC = 71/100");
    expect(lire("Jeu inconnu")).toBeNull();
  });
});
