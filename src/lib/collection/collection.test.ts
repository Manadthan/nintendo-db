import { describe, expect, it } from "vitest";
import { trier } from "@/lib/catalogue/catalogue";
import type { JeuCatalogue } from "@/lib/catalogue/types";

import { versionsAmiibo } from "@/lib/amiibo/catalogue";
import { versionsGuides } from "@/lib/guides/catalogue";
import {
  avecAmiibo,
  avecGuide,
  avecVersion,
  cleVersion,
  ensemble,
  filtrerCollection,
  possede,
  possedeAmiibo,
  possedeGuide,
} from "./collection";

describe("ma collection (US-16)", () => {
  const possessions = ensemble([
    { game_id: "splatoon", region: "PAL" },
    { game_id: "splatoon", region: "JAP" },
  ]);

  it("une version possédée se reconnaît par son jeu et sa région", () => {
    expect(possede(possessions, "splatoon", "PAL")).toBe(true);
    expect(possede(possessions, "splatoon", "US")).toBe(false);
    expect(possede(possessions, "mario-kart-8", "PAL")).toBe(false);
  });

  it("cocher et décocher rendent un nouvel ensemble, sans toucher l'ancien", () => {
    const avec = avecVersion(
      possessions,
      { gameId: "splatoon", region: "US" },
      true,
    );
    expect(possede(avec, "splatoon", "US")).toBe(true);
    expect(possede(possessions, "splatoon", "US")).toBe(false);
    const sans = avecVersion(
      avec,
      { gameId: "splatoon", region: "PAL" },
      false,
    );
    expect([...sans].sort()).toEqual([
      cleVersion("splatoon", "JAP"),
      cleVersion("splatoon", "US"),
    ]);
  });
});

const sortie = (date: string | null) => ({
  sortie: date !== null,
  titre: date ? "Titre" : null,
  titreRomanise: null,
  date,
  precision: date ? ("jour" as const) : null,
  jaquette: null,
});
const jeu = (id: string, console: string): JeuCatalogue => ({
  id,
  slug: id,
  console: { slug: console, nom: console.toUpperCase() },
  developpeur: null,
  editeur: "Nintendo",
  genres: [],
  series: [],
  metacritic: null,
  sorties: {
    JAP: sortie("2014-01-01"),
    US: sortie("2014-01-02"),
    PAL: sortie("2014-01-03"),
  },
});
const JEUX = [
  jeu("mk8", "wii-u"),
  jeu("splatoon", "wii-u"),
  jeu("melee", "gamecube"),
];
// Possédés : Splatoon en version japonaise seulement, Melee en PAL.
const POSSESSIONS = ensemble([
  { game_id: "splatoon", region: "JAP" },
  { game_id: "melee", region: "PAL" },
]);
const slugs = (v: { jeu: { slug: string } }[]) =>
  v.map((x) => x.jeu.slug).sort();

describe("filtre Collection et compteurs (US-16)", () => {
  it("marché « Tous » : un jeu est possédé si une de ses versions l'est", () => {
    const versions = trier(JEUX, "anciens", "TOUS");
    expect(
      slugs(filtrerCollection(versions, "possedes", POSSESSIONS, "TOUS")),
    ).toEqual(["melee", "splatoon"]);
    expect(
      slugs(filtrerCollection(versions, "manquants", POSSESSIONS, "TOUS")),
    ).toEqual(["mk8"]);
    expect(filtrerCollection(versions, null, POSSESSIONS, "TOUS")).toHaveLength(
      3,
    );
  });

  it("marché PAL : seule la version européenne compte (Splatoon JAP ne suffit pas)", () => {
    const versions = trier(JEUX, "anciens", "PAL");
    expect(
      slugs(filtrerCollection(versions, "possedes", POSSESSIONS, "PAL")),
    ).toEqual(["melee"]);
  });
});

describe("amiibo (US-30)", () => {
  const amiibo = (id: string, slug: string) => ({
    id,
    slug,
    nom: slug,
    nomJap: null,
    type: "figurine" as const,
    serieAmiibo: null,
    series: [],
    image: null,
    sorties: { PAL: { date: "2025-06-05", precision: "jour" as const } },
    consoles: [],
  });
  const possessions = ensemble(
    [{ game_id: "id-sidon", region: "PAL" }],
    [{ amiibo_id: "id-sidon" }],
  );

  it("une case par amiibo, distincte des versions d'un jeu au même identifiant", () => {
    expect(possedeAmiibo(possessions, "id-sidon")).toBe(true);
    expect(possede(possessions, "id-sidon", "PAL")).toBe(true);
    const sans = avecAmiibo(possessions, "id-sidon", false);
    expect(possedeAmiibo(sans, "id-sidon")).toBe(false);
    expect(possede(sans, "id-sidon", "PAL")).toBe(true);
    expect(possedeAmiibo(avecAmiibo(sans, "id-tulin", true), "id-tulin")).toBe(
      true,
    );
  });

  it("le filtre Collection s'applique aussi aux amiibo (choix du 26/11)", () => {
    const versions = versionsAmiibo(
      [amiibo("id-sidon", "sidon"), amiibo("id-tulin", "tulin")],
      "PAL",
    );
    const noms = (l: typeof versions) => l.map((v) => v.amiibo?.slug);
    expect(
      noms(filtrerCollection(versions, "possedes", possessions, "PAL")),
    ).toEqual(["sidon"]);
    expect(
      noms(filtrerCollection(versions, "manquants", possessions, "TOUS")),
    ).toEqual(["tulin"]);
  });
});

describe("guides possédés", () => {
  const guide = (id: string, isbn: string) => ({
    id,
    isbn,
    titre: `Guide ${isbn}`,
    editeur: "KADOKAWA",
    date: "2023-11-01",
    precision: "mois" as const,
    couverture: null,
    jeux: [jeu("mk8", "wii-u")],
  });
  const possessions = ensemble(
    [{ game_id: "id-g1", region: "JAP" }],
    [{ amiibo_id: "id-g1" }],
    [{ guide_id: "id-g1" }],
  );

  it("une case par guide, distincte des jeux et des amiibo au même identifiant", () => {
    expect(possedeGuide(possessions, "id-g1")).toBe(true);
    expect(possedeAmiibo(possessions, "id-g1")).toBe(true);
    expect(possede(possessions, "id-g1", "JAP")).toBe(true);
    const sans = avecGuide(possessions, "id-g1", false);
    expect(possedeGuide(sans, "id-g1")).toBe(false);
    expect(possedeAmiibo(sans, "id-g1")).toBe(true);
    expect(possede(sans, "id-g1", "JAP")).toBe(true);
    expect(possedeGuide(avecGuide(sans, "id-g2", true), "id-g2")).toBe(true);
  });

  it("le filtre Collection s'applique aussi aux guides", () => {
    const versions = versionsGuides([
      guide("id-g1", "9784000000017"),
      guide("id-g2", "9784000000024"),
    ]);
    const isbns = (l: typeof versions) => l.map((v) => v.guide?.isbn);
    expect(
      isbns(filtrerCollection(versions, "possedes", possessions, "TOUS")),
    ).toEqual(["9784000000017"]);
    expect(
      isbns(filtrerCollection(versions, "manquants", possessions, "JAP")),
    ).toEqual(["9784000000024"]);
  });
});
