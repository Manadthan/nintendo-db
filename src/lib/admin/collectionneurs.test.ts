import { describe, expect, it } from "vitest";
import { listerCollectionneurs } from "@/lib/admin/collectionneurs";

describe("listerCollectionneurs (US-19)", () => {
  const profils = [
    {
      user_id: "p",
      pseudo: "proprietaire",
      role: "proprietaire",
      cree_le: "2026-11-16",
    },
    {
      user_id: "z",
      pseudo: "zelda-fan",
      role: "collectionneur",
      cree_le: "2026-11-23",
    },
    {
      user_id: "l",
      pseudo: "Lea",
      role: "collectionneur",
      cree_le: "2026-11-22",
    },
  ];
  const comptes = [
    { id: "p", email: "moi@exemple.fr" },
    { id: "l", email: "lea@exemple.fr" },
    { id: "z", email: null },
  ];
  const possessions = [
    { user_id: "l", game_id: "mk8" },
    { user_id: "l", game_id: "mk8" },
    { user_id: "l", game_id: "splatoon" },
    { user_id: "p", game_id: "mk8" },
  ];

  it("ne garde que les collectionneurs, triés par pseudo, avec leur e-mail", () => {
    const liste = listerCollectionneurs(profils, comptes, possessions);
    expect(liste.map((c) => [c.pseudo, c.email])).toEqual([
      ["Lea", "lea@exemple.fr"],
      ["zelda-fan", ""],
    ]);
  });

  it("compte les jeux distincts (deux versions d'un jeu = un jeu)", () => {
    const liste = listerCollectionneurs(profils, comptes, possessions);
    expect(liste.map((c) => c.jeux)).toEqual([2, 0]);
  });
});
