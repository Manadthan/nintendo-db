import { describe, expect, it } from "vitest";
import captures from "./__fixtures__/captures.json";
import recherche from "./__fixtures__/recherche.json";
import {
  adresseReduite,
  choisirCaptures,
  comparable,
  lienRawg,
  plateformeRawg,
  PLATEFORMES_RAWG,
  rapprocher,
} from "./rawg";

const jeux = recherche.results;

describe("comparable", () => {
  it("retire un suffixe d'année ou de console et « The » en tête", () => {
    expect(comparable("Adventures of Lolo (1989)")).toBe("adventures of lolo");
    expect(comparable("1080° Snowboarding (N64)")).toBe("1080 snowboarding");
    expect(comparable("The Bugs Bunny Crazy Castle 3")).toBe(
      "bugs bunny crazy castle 3",
    );
  });
  it("garde les autres parenthèses", () => {
    expect(comparable("Heisei Shin Onigashima (Part 1)")).toBe(
      "heisei shin onigashima part 1",
    );
  });
});

describe("rapprocher (étude du 22/11)", () => {
  it("accepte le titre identique sur la bonne console", () => {
    expect(
      rapprocher(["Pikmin 2"], jeux, PLATEFORMES_RAWG.gamecube)?.slug,
    ).toBe("pikmin-2");
    expect(
      rapprocher(["Game & Watch Gallery 2"], jeux, PLATEFORMES_RAWG.gbc)?.slug,
    ).toBe("game-watch-gallery-2");
  });
  it("accepte les suffixes « (année) », « (console) » et « The »", () => {
    expect(
      rapprocher(["1080° Snowboarding"], jeux, PLATEFORMES_RAWG.n64)?.id,
    ).toBe(5002);
    expect(
      rapprocher(["Adventures of Lolo"], jeux, PLATEFORMES_RAWG.gb)?.id,
    ).toBe(5003);
    expect(
      rapprocher(["Bugs Bunny: Crazy Castle 3"], jeux, PLATEFORMES_RAWG.gbc)
        ?.id,
    ).toBe(5004);
  });
  it("refuse un autre jeu, même premier résultat", () => {
    expect(
      rapprocher(["Pikmin 1+2"], jeux, PLATEFORMES_RAWG.switch),
    ).toBeNull();
    expect(
      rapprocher(["Magical World 2"], jeux, PLATEFORMES_RAWG["3ds"]),
    ).toBeNull();
    expect(
      rapprocher(
        ["Famicom Mini: Super Mario Bros. 2"],
        jeux,
        PLATEFORMES_RAWG.gba,
      ),
    ).toBeNull();
    expect(
      rapprocher(["Pokémon White Version 2"], jeux, PLATEFORMES_RAWG.ds),
    ).toBeNull();
  });
  it("refuse le bon titre sur une autre console", () => {
    expect(rapprocher(["Pikmin 2"], jeux, PLATEFORMES_RAWG.switch)).toBeNull();
  });
  it("essaie chacun de nos titres (US, PAL, romanisé)", () => {
    expect(
      rapprocher(
        ["Pikmin 2 (US inconnu)", "Pikmin 2"],
        jeux,
        PLATEFORMES_RAWG.wii,
      )?.id,
    ).toBe(5001);
  });
  it("Virtual Boy et Switch 2 n'ont pas de plateforme RAWG", () => {
    expect(plateformeRawg("vb")).toBeUndefined();
    expect(plateformeRawg("switch-2")).toBeUndefined();
    expect(plateformeRawg("nes")).toBe(49);
  });
});

describe("choisirCaptures", () => {
  const choisies = choisirCaptures(captures.results);
  it("écarte les captures supprimées, cachées ou hors de media.rawg.io, et en garde 6 au plus", () => {
    expect(choisies).toHaveLength(6);
    expect(choisies.map((c) => c.url)).not.toContain(
      "https://exemple.com/autre.jpg",
    );
    expect(choisies.map((c) => c.url)).not.toContain(
      "https://media.rawg.io/media/screenshots/b2/b2c3d4.jpg",
    );
  });
  it("numérote de 1 à 6 dans l'ordre de RAWG", () => {
    expect(choisies.map((c) => c.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(choisies[0]).toEqual({
      position: 1,
      url: "https://media.rawg.io/media/screenshots/a1/a1b2c3.jpg",
      largeur: 1280,
      hauteur: 720,
    });
  });
  it("aucune capture : liste vide", () => {
    expect(choisirCaptures([])).toEqual([]);
  });
});

describe("adresses", () => {
  it("version réduite par RAWG", () => {
    expect(
      adresseReduite(
        "https://media.rawg.io/media/screenshots/a1/a1b2c3.jpg",
        640,
      ),
    ).toBe(
      "https://media.rawg.io/media/resize/640/-/screenshots/a1/a1b2c3.jpg",
    );
  });
  it("page du jeu chez RAWG", () => {
    expect(lienRawg("pikmin-2")).toBe("https://rawg.io/games/pikmin-2");
  });
});
