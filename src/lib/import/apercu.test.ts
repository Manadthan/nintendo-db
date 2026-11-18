import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  appliquerComparaisons,
  decouperEnLots,
  estAVenir,
  lignesAEnregistrer,
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

  it("ne supprime jamais un jeu ajouté à la main (US-11)", () => {
    const avecManuel = preparerApercu(
      liste,
      new Set([...EN_BASE, "mon-jeu"]),
      new Set(["mon-jeu"]),
    );
    expect(avecManuel.aSupprimer).toEqual(["shovel-knight"]);
  });
});

describe("resumer", () => {
  it("compte ajoutés, mis à jour, ignorés et jeux à supprimer", () => {
    const apercu = preparerApercu(liste, new Set([...DEPART, "shovel-knight"]));
    expect(resumer(apercu)).toEqual({
      ajoutes: 44,
      misAJour: 4,
      inchanges: 0,
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

describe("import des nouveautés (SPEC v1.11)", () => {
  const apercu = appliquerComparaisons(
    preparerApercu(liste, new Set(EN_BASE)),
    (l) =>
      l.slug === "splatoon"
        ? { etat: "modifie", changements: ["PAL date_sortie"] }
        : l.action === "ajouter"
          ? { etat: "nouveau", changements: [] }
          : { etat: "inchange", changements: [] },
  );

  it("n'enregistre que les nouveaux et les modifiés, sauf « Tout réenregistrer »", () => {
    const choisis = lignesAEnregistrer(apercu, false);
    expect(choisis).toHaveLength(45);
    expect(choisis.map((l) => l.slug)).toContain("splatoon");
    expect(choisis.map((l) => l.slug)).not.toContain("mario-kart-8");
    expect(lignesAEnregistrer(apercu, true)).toHaveLength(48);
  });

  it("compte les inchangés à part", () => {
    expect(resumer(apercu)).toMatchObject({
      ajoutes: 44,
      misAJour: 1,
      inchanges: 3,
    });
  });
});

describe("jeux à venir (SPEC v1.11)", () => {
  const jeu = liste.jeux.find((j) => j.slug === "splatoon")!;
  const avecDates = (dates: (string | null)[]) =>
    ({
      ...jeu,
      sorties: {
        JAP: { date: dates[0], precision: "jour", editeur: null },
        US: { date: dates[1], precision: "jour", editeur: null },
        PAL:
          dates[2] === undefined
            ? null
            : { date: dates[2], precision: "annee", editeur: null },
      },
    }) as unknown as typeof jeu;

  it("toutes les dates connues sont futures : à venir", () => {
    expect(
      estAVenir(avecDates(["2027-01-01", null, "2027-01-01"]), "2026-11-18"),
    ).toBe(true);
  });

  it("une date passée suffit, et un jeu sans date est gardé", () => {
    expect(
      estAVenir(avecDates(["2026-11-01", "2027-03-01", null]), "2026-11-18"),
    ).toBe(false);
    expect(estAVenir(avecDates([null, null, null]), "2026-11-18")).toBe(false);
  });

  it("le jeu à venir est ignoré avec son titre, pas proposé à l'import", () => {
    const futur = {
      ...liste,
      jeux: [avecDates(["2027-01-01", null, "2027-01-01"])],
    };
    const a = preparerApercu(futur, new Set(), new Set(), "2026-11-18");
    expect(a.lignes).toEqual([]);
    expect(a.aVenir).toEqual([jeu.titres.PAL || jeu.titres.US]);
  });
});
