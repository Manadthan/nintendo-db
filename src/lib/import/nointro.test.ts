import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { construireJeu } from "./donnees";
import { boitesDuJeu, indexerBoites, lireIndexXml } from "./libretro";
import { indexerSeries, lireNoIntro, seriesDuJeu } from "./nointro";
import { lireListeCartouches } from "./wikipedia-cartouches";

// Séries No-Intro (étape 15, SPEC v1.19, DESIGN ADR-10) : fichiers de libretro-database du 19/11/2026, réduits.
const f = (n: string) =>
  readFileSync(join(__dirname, "__fixtures__", n), "utf8");
const console_ = (slug: "n64" | "gba") => ({
  series: indexerSeries(lireNoIntro(f(`${slug}-nointro.dat`))),
  boites: indexerBoites(lireIndexXml(f(`${slug}-libretro.xml`))),
  jeux: lireListeCartouches(f(`${slug}-wikipedia.html`)).jeux,
  source: sourceConsole(slug),
});
const N64 = console_("n64");
const GBA = console_("gba");
const toutes = { JAP: true, US: true, PAL: true };
const titres = (t: string) => ({ US: t, PAL: t });

describe("séries No-Intro", () => {
  it("lit nom et série, sans démo, prototype ni réédition", () => {
    const cartouches = lireNoIntro(f("n64-nointro.dat"));
    expect(cartouches).toContainEqual({
      nom: "Zelda no Densetsu - Mujura no Kamen (Japan)",
      serie: "NZSJ",
    });
    expect(cartouches.map((c) => c.nom).join("\n")).not.toMatch(
      /\((?:Debug|Proto|Beta|Demo)\)|GameCube/,
    );
  });

  it("relie les 3 régions d'un jeu par la base de sa série (Majora's Mask)", () => {
    expect(
      seriesDuJeu(
        N64.series,
        titres("The Legend of Zelda: Majora's Mask"),
        toutes,
      ),
    ).toEqual({
      series: { JAP: "NZSJ", US: "NZSE", PAL: "NZSP" },
      japonaise: "Zelda no Densetsu - Mujura no Kamen (Japan)",
    });
  });

  it("rien pour une région non sortie", () => {
    expect(
      seriesDuJeu(N64.series, titres("Super Mario 64"), {
        JAP: false,
        US: true,
        PAL: false,
      }),
    ).toEqual({ series: { US: "NSME" }, japonaise: null });
  });

  it("titre japonais romanisé autrement : « ō » = « ou »", () => {
    const { series } = seriesDuJeu(
      N64.series,
      titres("Dōbutsu no Mori"),
      toutes,
    );
    expect(series.JAP).toBe("NAFJ"); // « Doubutsu no Mori (Japan) »
  });

  it("cartouche commune Japon + USA (lettre A) ; sous-titre européen ignoré en dernier recours", () => {
    expect(
      seriesDuJeu(N64.series, titres("1080° Snowboarding"), toutes).series,
    ).toEqual({ JAP: "NTEA", US: "NTEA", PAL: "NTEP" });
    expect(
      seriesDuJeu(N64.series, titres("Wave Race 64"), toutes).series.PAL,
    ).toBe("NWRP");
  });

  it("cartouche « USA, Europe » : même série en US et en Europe faute d'une série européenne", () => {
    const gba = lireNoIntro(f("gba-nointro.dat")).find(
      (c) => /\(USA, Europe\)/.test(c.nom) && /^Kirby/.test(c.nom),
    );
    if (!gba) return;
    const { series } = seriesDuJeu(
      GBA.series,
      titres(gba.nom.replace(/ \(.*$/, "")),
      { JAP: false, US: true, PAL: true },
    );
    expect(series.US).toBeDefined();
    expect(series.PAL).toBeDefined();
  });
});

describe("codes produit et boîtes japonaises (fixtures du 19/11/2026)", () => {
  it("code produit = préfixe de la console + série, sans suffixe de pays", () => {
    const zelda = N64.jeux.find((j) => /Majora/.test(j.titres.US))!;
    const { series } = seriesDuJeu(N64.series, zelda.titres, toutes);
    const { releases } = construireJeu(
      { ...zelda, codes: series },
      N64.source.prefixeCode,
    );
    expect(releases.JAP.code_produit).toBe("NUS-NZSJ");
    expect(releases.US.code_produit).toBe("NUS-NZSE");
    expect(releases.PAL.code_produit).toBe("NUS-NZSP");
    expect(N64.source.prefixeCode).toBe("NUS-");
    expect(GBA.source.prefixeCode).toBe("AGB-");
  });

  it("boîte japonaise nommée en japonais retrouvée par la série (Majora's Mask, Minish Cap)", () => {
    const boite = (c: typeof N64, titre: string) =>
      boitesDuJeu(
        c.boites,
        titres(titre),
        toutes,
        seriesDuJeu(c.series, titres(titre), toutes).japonaise,
      ).JAP;
    expect(boite(N64, "The Legend of Zelda: Majora's Mask")).toBe(
      "Zelda no Densetsu - Mujura no Kamen (Japan)",
    );
    expect(boite(GBA, "The Legend of Zelda: The Minish Cap")).toBe(
      "Zelda no Densetsu - Fushigi no Boushi (Japan)",
    );
  });

  it("couverture mesurée à l'étude : boîtes japonaises et codes US", () => {
    const mesure = (c: typeof N64) => {
      let jap = 0;
      let us = 0;
      for (const j of c.jeux) {
        const sorties = {
          JAP: !!j.sorties.JAP,
          US: !!j.sorties.US,
          PAL: !!j.sorties.PAL,
        };
        const t = seriesDuJeu(c.series, j.titres, sorties);
        if (boitesDuJeu(c.boites, j.titres, sorties, t.japonaise).JAP) jap++;
        if (t.series.US) us++;
      }
      return { jap, us };
    };
    const n64 = mesure(N64);
    const gba = mesure(GBA);
    expect(n64.jap).toBeGreaterThanOrEqual(37);
    expect(n64.us).toBeGreaterThanOrEqual(49);
    expect(gba.jap).toBeGreaterThanOrEqual(76);
    expect(gba.us).toBeGreaterThanOrEqual(55);
  });
});
