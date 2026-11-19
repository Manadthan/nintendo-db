import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  adresseBoite,
  boitesDuJeu,
  cibleDuLien,
  cleTitre,
  indexerBoites,
  lireIndexXml,
} from "./libretro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// Boîtes libretro-thumbnails (étape 14, SPEC v1.18) : index du 19/11/2026 et listes Wikipédia des fixtures.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const N64 = indexerBoites(lireIndexXml(f("n64-libretro.xml")));
const GBA = indexerBoites(lireIndexXml(f("gba-libretro.xml")));
const toutes = { JAP: true, US: true, PAL: true };

describe("boîtes libretro-thumbnails (étape 14)", () => {
  it("rapproche « The Legend of Zelda: … » et « Legend of Zelda, The - … »", () => {
    expect(cleTitre("The Legend of Zelda: Ocarina of Time")).toBe(
      cleTitre("Legend of Zelda, The - Ocarina of Time"),
    );
  });

  it("une boîte par région, sans Virtual Console, démo ni version GameCube", () => {
    expect(
      boitesDuJeu(N64, { US: "Super Mario 64", PAL: "Super Mario 64" }, toutes),
    ).toEqual({
      US: "Super Mario 64 (USA)",
      PAL: "Super Mario 64 (Europe) (En,Fr,De)",
      JAP: "Super Mario 64 (Japan)",
    });
    const zelda = boitesDuJeu(
      N64,
      {
        US: "The Legend of Zelda: Ocarina of Time",
        PAL: "The Legend of Zelda: Ocarina of Time",
      },
      toutes,
    );
    expect(zelda.PAL).toBe(
      "Legend of Zelda, The - Ocarina of Time (Europe) (En,Fr,De)",
    );
    expect(Object.values(zelda).join(" ")).not.toMatch(/GameCube|Beta|Debug/);
    expect(
      boitesDuJeu(GBA, { US: "Metroid Fusion", PAL: "Metroid Fusion" }, toutes)
        .US,
    ).toBe("Metroid Fusion (USA)");
  });

  it("jamais un lien symbolique (« … - SymbolicLink » : un texte, pas une image ; Majora's Mask, #129)", () => {
    const mm = boitesDuJeu(
      N64,
      {
        US: "The Legend of Zelda: Majora's Mask",
        PAL: "The Legend of Zelda: Majora's Mask",
      },
      toutes,
    );
    expect(mm.US).toBe("Legend of Zelda, The - Majora's Mask (USA)");
    for (const jeu of [N64, GBA])
      for (const boites of jeu.values())
        for (const b of Object.values(boites))
          expect(b.nom).not.toMatch(/SymbolicLink/);
  });

  it("rien pour une région non sortie", () => {
    expect(
      boitesDuJeu(
        N64,
        { US: "Super Mario 64", PAL: "Super Mario 64" },
        { JAP: false, US: true, PAL: false },
      ),
    ).toEqual({ US: "Super Mario 64 (USA)" });
  });

  it("adresse sur raw.githubusercontent.com, nom encodé", () => {
    expect(adresseBoite("Nintendo_-_Nintendo_64", "Super Mario 64 (USA)")).toBe(
      "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Nintendo_64/master/Named_Boxarts/Super%20Mario%2064%20(USA).png",
    );
  });

  it("couverture sur les listes Wikipédia : la plupart des jeux N64 et GBA ont au moins une boîte", () => {
    for (const [liste, index, minimum] of [
      ["n64-wikipedia.html", N64, 48],
      ["gba-wikipedia.html", GBA, 80],
    ] as const) {
      const jeux = lireListeCartouches(f(liste)).jeux;
      const avec = jeux.filter(
        (j) =>
          Object.keys(
            boitesDuJeu(index, j.titres, {
              JAP: !!j.sorties.JAP,
              US: !!j.sorties.US,
              PAL: !!j.sorties.PAL,
            }),
          ).length > 0,
      );
      expect(avec.length).toBeGreaterThanOrEqual(minimum);
    }
  });
});

describe("liens Git de libretro-thumbnails (Pokémon Crystal, #143)", () => {
  // « Pokemon - Crystal Version (USA, Europe) (Rev 1).png » : un lien Git, servi comme le texte de sa cible.
  const texte = (t: string) => new TextEncoder().encode(t);

  it("un fichier qui n'est que le nom d'une autre boîte est un lien : on en lit la cible", () => {
    expect(cibleDuLien(texte("Pokemon - Crystal Version (USA).png"))).toBe(
      "Pokemon - Crystal Version (USA)",
    );
    expect(cibleDuLien(texte("../Named_Boxarts/Tetris DX (World).png"))).toBe(
      "Tetris DX (World)",
    );
  });

  it("une vraie image PNG n'est pas un lien", () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(cibleDuLien(png)).toBeNull();
  });
});

describe("noms libretro (Virtual Boy, étape 19)", () => {
  it("« & » est écrit « _ » dans les noms de fichiers libretro", () => {
    expect(cleTitre("T_E Virtual Golf")).toBe(cleTitre("T&E Virtual Golf"));
  });

  it("une boîte « (Japan, USA) » est la boîte américaine : pas pour le Japon", () => {
    const index = indexerBoites([
      "Mario's Tennis (Japan, USA)",
      "Red Alarm (Japan)",
      "Red Alarm (USA)",
    ]);
    const toutes = { JAP: true, US: true, PAL: false };
    expect(
      boitesDuJeu(
        index,
        { US: "Mario's Tennis", PAL: "Mario's Tennis" },
        toutes,
      ),
    ).toEqual({
      US: "Mario's Tennis (Japan, USA)",
    });
    expect(
      boitesDuJeu(index, { US: "Red Alarm", PAL: "Red Alarm" }, toutes).JAP,
    ).toBe("Red Alarm (Japan)");
  });
});

describe("boîtes japonaises de la Super Nintendo (étape 20)", () => {
  const index = indexerBoites([
    "Super Mario World (USA)",
    "Super Mario World - Super Mario Bros. 4 (Japan)",
    "Chou Makaimura (Japan)",
  ]);
  const toutes = { JAP: true, US: true, PAL: false };

  it("boîte japonaise trouvée sous un titre japonais de Wikipédia", () => {
    expect(
      boitesDuJeu(
        index,
        { US: "Super Mario World", PAL: "Super Mario World" },
        toutes,
        null,
        ["Super Mario World: Super Mario Bros. 4"],
      ).JAP,
    ).toBe("Super Mario World - Super Mario Bros. 4 (Japan)");
  });

  it("« ō » romanisé « ou » chez libretro (« Chō Makaimura » = « Chou Makaimura »)", () => {
    expect(cleTitre("Chō Makaimura")).toBe(cleTitre("Chou Makaimura"));
  });
});
