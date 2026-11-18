import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "@/lib/import/consoles";
import { lireGameTdb, regrouperGameTdb } from "@/lib/import/gametdb";
import { appliquerGameTdb } from "@/lib/import/physique";
import { lireListeWikipedia } from "@/lib/import/wikipedia";
import { lireListeSwitch2 } from "@/lib/import/wikipedia-switch-2";
import {
  estFirstParty,
  nomStudio,
  regrouperStudios,
  studios,
} from "./developpeurs";

describe("studios d'un jeu (filtre Développeur, #89)", () => {
  it("sépare plusieurs studios et retire les mentions juridiques", () => {
    expect(studios("Nintendo EAD Tokyo, 1-Up Studio")).toEqual([
      "Nintendo EAD Tokyo",
      "1-Up Studio",
    ]);
    expect(studios("Game Freak, Inc.")).toEqual(["Game Freak"]);
    expect(studios("KOEI TECMO GAMES CO., LTD.")).toEqual(["Koei Tecmo"]);
    expect(studios("Good-Feel Co. Ltd.")).toEqual(["Good-Feel"]);
    expect(studios("Level-5 & Capcom")).toEqual(["Level-5", "Capcom"]);
    expect(studios(null)).toEqual([]);
  });

  it("ramène les variantes connues à un seul nom", () => {
    for (const v of ["LEVEL-5", "Level 5", "Level-5"])
      expect(nomStudio(v)).toBe("Level-5");
    for (const v of ["Nd Cube", "NdCUBE Co.", "NDcube"])
      expect(nomStudio(v)).toBe("NDcube");
    expect(nomStudio("Nintendo Software Technology (NST)")).toBe(
      "Nintendo Software Technology",
    );
    expect(nomStudio("INTELLIGENT SYSTEMS")).toBe("Intelligent Systems");
  });

  it("first party : divisions de Nintendo et filiales détenues, pas les studios indépendants", () => {
    for (const s of [
      "Nintendo",
      "Nintendo EAD",
      "Nintendo EPD",
      "Nintendo Cube",
      "Retro Studios",
      "Monolith Soft",
      "NDcube",
    ])
      expect(estFirstParty(s)).toBe(true);
    for (const s of [
      "HAL Laboratory",
      "Intelligent Systems",
      "Game Freak",
      "Nintendogs",
    ])
      expect(estFirstParty(s)).toBe(false);
  });
});

describe("studios sur les données réelles (fixtures des 6 consoles)", () => {
  const f = (n: string) =>
    readFileSync(join(__dirname, "../import/__fixtures__", n), "utf8");
  const champs = [
    ...appliquerGameTdb(
      lireListeWikipedia(f("wii-u-wikipedia.html")),
      regrouperGameTdb(lireGameTdb(f("wiiutdb.xml"))),
    ).jeux,
    ...(
      [
        ["wii", "wiitdb.xml"],
        ["ds", "dstdb.xml"],
        ["3ds", "3dstdb.xml"],
        ["switch", "switchtdb.xml"],
      ] as const
    ).flatMap(([c, x]) => {
      const s = sourceConsole(c);
      return appliquerGameTdb(
        [],
        regrouperGameTdb(lireGameTdb(f(x), s.estDisque), s.longueurBase),
      ).jeux;
    }),
    ...lireListeSwitch2(f("switch-2-wikipedia.html")).jeux,
  ].map((j) => j.developpeur);
  const tous = champs.flatMap(studios);
  const proposes = regrouperStudios(champs.map(studios));

  it("aucune mention juridique seule ni doublon de casse dans la liste", () => {
    const distincts = new Set(proposes.map((p) => p.nom));
    for (const s of distincts) {
      expect(s).not.toMatch(/^(inc|ltd|co)\.?$/i);
      expect(s).not.toMatch(/\b(inc|ltd)\.?$/i);
    }
    const parCle = new Map<string, Set<string>>();
    for (const s of distincts) {
      const cle = s.toLowerCase().replace(/[^a-z0-9]/g, "");
      parCle.set(cle, (parCle.get(cle) ?? new Set()).add(s));
    }
    expect([...parCle.values()].filter((v) => v.size > 1)).toEqual([]);
    expect(distincts.size).toBeLessThan(130);
  });

  it("Game Freak regroupe ses 3 graphies", () => {
    expect(
      tous.filter((s) => s === "Game Freak").length,
    ).toBeGreaterThanOrEqual(27);
  });
});
