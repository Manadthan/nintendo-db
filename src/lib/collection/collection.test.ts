import { describe, expect, it } from "vitest";
import { trier } from "@/lib/catalogue/catalogue";
import type { JeuCatalogue } from "@/lib/catalogue/types";

import {
  avecVersion,
  cleVersion,
  compteurs,
  ensemble,
  filtrerCollection,
  possede,
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
  jaquetteSrcset: null,
});
const jeu = (id: string, console: string): JeuCatalogue => ({
  id,
  slug: id,
  console: { slug: console, nom: console.toUpperCase() },
  developpeur: null,
  editeur: "Nintendo",
  genres: [],
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
const CONSOLES = [
  { slug: "gamecube", nom: "GameCube" },
  { slug: "wii-u", nom: "Wii U" },
  { slug: "switch", nom: "Switch" },
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

  it("compteur par console, sans les consoles sans jeu affiché", () => {
    expect(
      compteurs(trier(JEUX, "anciens", "TOUS"), CONSOLES, POSSESSIONS, "TOUS"),
    ).toEqual([
      { slug: "gamecube", nom: "GameCube", possedes: 1, total: 1 },
      { slug: "wii-u", nom: "Wii U", possedes: 1, total: 2 },
    ]);
  });
});
