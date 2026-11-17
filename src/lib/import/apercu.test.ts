import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decouperEnLots,
  preparerApercu,
  resumer,
  resumerEnregistrement,
} from "./apercu";
import { lireListeWikipediaDetaillee } from "./wikipedia";

const liste = lireListeWikipediaDetaillee(
  readFileSync(join(__dirname, "__fixtures__/wii-u-wikipedia.html"), "utf8"),
);
const DEPART = [
  "mario-kart-8",
  "splatoon",
  "kirby-and-the-rainbow-paintbrush",
  "wii-karaoke-u",
];

describe("preparerApercu (US-10)", () => {
  const apercu = preparerApercu(liste, new Set(DEPART));

  it("propose d'ajouter les nouveaux jeux et de mettre à jour ceux déjà en base, sans doublon", () => {
    expect(apercu.lignes).toHaveLength(50);
    expect(
      apercu.lignes
        .filter((l) => l.action === "mettre-a-jour")
        .map((l) => l.slug)
        .sort(),
    ).toEqual([...DEPART].sort());
    expect(apercu.lignes.filter((l) => l.action === "ajouter")).toHaveLength(
      46,
    );
  });

  it("garde pour chaque jeu son titre, ses titres régionaux et ses régions de sortie", () => {
    expect(apercu.lignes.find((l) => l.slug === "wii-karaoke-u")).toMatchObject(
      {
        titre: "Wii Karaoke U",
        titres: { US: "Wii Karaoke U", PAL: "Wii Karaoke U" },
        regions: { JAP: true, US: false, PAL: true },
      },
    );
  });

  it("garde les jeux écartés et leur raison", () => {
    expect(apercu.ignores.telechargeables).toContain("Ark Rush");
    expect(apercu.ignores.autresEditeurs).toBeGreaterThan(700);
  });
});

describe("resumer", () => {
  it("compte ajoutés, mis à jour et ignorés, et les rapprochements IGDB à vérifier", () => {
    const apercu = preparerApercu(liste, new Set(DEPART));
    const rapprochements = {
      "mario-kart-8": "sur",
      "wii-karaoke-u": "a-verifier",
      splatoon: "introuvable",
    } as const;
    expect(resumer(apercu, rapprochements)).toEqual({
      ajoutes: 46,
      misAJour: 4,
      ignores:
        apercu.ignores.autresEditeurs + apercu.ignores.telechargeables.length,
      aVerifier: 2,
    });
  });
});

describe("decouperEnLots", () => {
  it("découpe en lots de 10 (ADR-03), le dernier pouvant être plus court", () => {
    const lots = decouperEnLots(
      Array.from({ length: 23 }, (_, i) => i),
      10,
    );
    expect(lots.map((l) => l.length)).toEqual([10, 10, 3]);
    expect(decouperEnLots([], 10)).toEqual([]);
  });
});

describe("resumerEnregistrement (US-10)", () => {
  it("compte ajoutés, mis à jour, erreurs et jaquettes ; liste les jaquettes de secours et les corrections gardées", () => {
    expect(
      resumerEnregistrement([
        {
          slug: "a",
          titre: "Splatoon",
          statut: "mis-a-jour",
          jaquettes: 3,
          secours: ["PAL"],
          ecarts: [],
        },
        {
          slug: "b",
          titre: "Pikmin 3",
          statut: "ajoute",
          jaquettes: 2,
          secours: [],
          ecarts: ["PAL titre : « X » gardé (import : « Y »)"],
        },
        {
          slug: "c",
          titre: "NES Remix",
          statut: "erreur",
          jaquettes: 0,
          secours: [],
          ecarts: [],
          erreur: "IGDB indisponible",
        },
      ]),
    ).toEqual({
      ajoutes: 1,
      misAJour: 1,
      erreurs: [{ titre: "NES Remix", erreur: "IGDB indisponible" }],
      jaquettes: 5,
      secours: ["Splatoon (PAL)"],
      ecarts: ["Pikmin 3 — PAL titre : « X » gardé (import : « Y »)"],
    });
  });
});
