import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decouperEnLots,
  preparerApercu,
  resumer,
  resumerEnregistrement,
} from "./apercu";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import { lireListeWikipediaDetaillee } from "./wikipedia";

const lire = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");
const wikipedia = lireListeWikipediaDetaillee(lire("wii-u-wikipedia.html"));
const liste = {
  ...wikipedia,
  ...appliquerGameTdb(
    wikipedia.jeux,
    regrouperGameTdb(lireGameTdb(lire("wiiutdb.xml"))),
  ),
};
const DEPART = [
  "mario-kart-8",
  "splatoon",
  "kirby-and-the-rainbow-paintbrush",
  "wii-karaoke-u",
];
// Jeu en base qui n'a plus de boîte Nintendo : à supprimer.
const EN_BASE = [...DEPART, "shovel-knight"];

describe("preparerApercu (US-10)", () => {
  const apercu = preparerApercu(liste, new Set(EN_BASE));

  it("propose d'ajouter les nouveaux jeux et de mettre à jour ceux déjà en base, sans doublon", () => {
    expect(apercu.lignes).toHaveLength(48);
    expect(
      apercu.lignes
        .filter((l) => l.action === "mettre-a-jour")
        .map((l) => l.slug)
        .sort(),
    ).toEqual([...DEPART].sort());
    expect(apercu.lignes.filter((l) => l.action === "ajouter")).toHaveLength(
      44,
    );
  });

  it("garde pour chaque jeu son titre, ses titres régionaux et ses régions de sortie", () => {
    expect(apercu.lignes.find((l) => l.slug === "wii-karaoke-u")).toMatchObject(
      {
        titre: "Wii Karaoke U",
        titres: { US: "Wii Karaoke U", PAL: "Wii Karaoke U" },
        // Wikipédia indique aussi PAL, mais seulement en téléchargement : seule la boîte japonaise compte.
        regions: { JAP: true, US: false, PAL: false },
      },
    );
  });

  it("garde les jeux écartés et leur raison", () => {
    expect(apercu.ignores.telechargeables).toContain("Ark Rush");
    expect(apercu.ignores.autresEditeurs).toBeGreaterThan(700);
    expect(apercu.ecartes.map((e) => e.titre)).toContain("NES Remix");
  });

  it("liste les jeux en base qui ne sont plus retenus, à supprimer", () => {
    expect(apercu.aSupprimer).toEqual(["shovel-knight"]);
  });
});

describe("resumer", () => {
  it("compte ajoutés, mis à jour, ignorés et jeux à supprimer", () => {
    const apercu = preparerApercu(liste, new Set([...DEPART, "shovel-knight"]));
    expect(resumer(apercu)).toEqual({
      ajoutes: 44,
      misAJour: 4,
      ignores:
        apercu.ignores.autresEditeurs +
        apercu.ignores.telechargeables.length +
        apercu.ecartes.length,
      aSupprimer: 1,
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
  it("compte ajoutés, mis à jour, erreurs et jaquettes ; liste les régions sans scan, les corrections gardées et les suppressions", () => {
    expect(
      resumerEnregistrement(
        [
          {
            slug: "a",
            titre: "Splatoon",
            statut: "mis-a-jour",
            jaquettes: 3,
            sansScan: ["PAL"],
            ecarts: [],
          },
          {
            slug: "b",
            titre: "Pikmin 3",
            statut: "ajoute",
            jaquettes: 2,
            sansScan: [],
            ecarts: ["PAL titre : « X » gardé (import : « Y »)"],
          },
          {
            slug: "c",
            titre: "NES Remix",
            statut: "erreur",
            jaquettes: 0,
            sansScan: [],
            ecarts: [],
            erreur: "Scan illisible",
          },
        ],
        ["Shovel Knight"],
      ),
    ).toEqual({
      ajoutes: 1,
      misAJour: 1,
      erreurs: [{ titre: "NES Remix", erreur: "Scan illisible" }],
      jaquettes: 5,
      sansScan: ["Splatoon (PAL)"],
      ecarts: ["Pikmin 3 — PAL titre : « X » gardé (import : « Y »)"],
      supprimes: ["Shovel Knight"],
    });
  });
});
