import { describe, expect, it } from "vitest";
import { ensemble } from "@/lib/collection/collection";
import {
  maCollection,
  notesMetacritic,
  parRegion,
  type JeuStat,
} from "./statistiques";

// Statistiques (US-18, SPEC v1.20) sur 4 jeux d'exemple.
const GC = { slug: "gamecube", nom: "GameCube" };
const WIIU = { slug: "wii-u", nom: "Wii U" };
const N64 = { slug: "n64", nom: "Nintendo 64" };
const jeu = (
  id: string,
  titre: string,
  console: JeuStat["console"],
  metacritic: number | null,
): JeuStat => ({
  id,
  titre,
  console,
  metacritic,
  sorties: ["JAP", "US", "PAL"],
});
const JEUX = [
  jeu("melee", "Super Smash Bros. Melee", GC, 92),
  jeu("prime", "Metroid Prime", GC, 97),
  jeu("splatoon", "Splatoon", WIIU, 81),
  jeu("mk8", "Mario Kart 8", WIIU, null),
];
// Melee en JAP et PAL, Splatoon en PAL : 2 jeux possédés, 3 versions.
const POSSESSIONS = ensemble([
  { game_id: "melee", region: "JAP" },
  { game_id: "melee", region: "PAL" },
  { game_id: "splatoon", region: "PAL" },
]);

describe("statistiques (US-18)", () => {
  it("ma collection : un jeu compte dès une version, par console dans l'ordre, consoles vides omises", () => {
    expect(maCollection(JEUX, [N64, GC, WIIU], POSSESSIONS)).toEqual({
      total: { possedes: 2, total: 4, pourcent: 50 },
      consoles: [
        { ...GC, possedes: 1, total: 2, pourcent: 50 },
        { ...WIIU, possedes: 1, total: 2, pourcent: 50 },
      ],
    });
  });

  it("collection vide : 0 %, sans division par zéro", () => {
    expect(maCollection([], [GC], ensemble([])).total).toEqual({
      possedes: 0,
      total: 0,
      pourcent: 0,
    });
  });

  it("par région : un jeu possédé en JAP et PAL compte dans les deux", () => {
    expect(parRegion(JEUX, POSSESSIONS)).toEqual({ JAP: 1, US: 0, PAL: 2 });
  });

  it("Metacritic : moyenne des possédés notés, mieux notés possédés et manquants", () => {
    const notes = notesMetacritic(JEUX, POSSESSIONS);
    expect(notes.moyenne).toBe(87); // (92 + 81) / 2 = 86,5
    expect(notes.meilleursPossedes.map((j) => j.id)).toEqual([
      "melee",
      "splatoon",
    ]);
    // Mario Kart 8, sans note, n'apparaît nulle part.
    expect(notes.meilleursManquants).toEqual([
      { id: "prime", titre: "Metroid Prime", console: "GameCube", note: 97 },
    ]);
  });

  it("Metacritic sans jeu possédé noté : pas de moyenne", () => {
    expect(notesMetacritic(JEUX, ensemble([])).moyenne).toBeNull();
  });
});
