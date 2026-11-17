import { describe, expect, it } from "vitest";
import { lireNouveauJeu, slugDisponible } from "./nouveau";

const saisie = (champs: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.set(k, v);
  return f;
};

describe("ajouter un jeu (US-11)", () => {
  it("tire l'adresse du titre, sans doublon", () => {
    expect(slugDisponible("Pikmin 3", new Set())).toBe("pikmin-3");
    expect(slugDisponible("Pikmin 3", new Set(["pikmin-3"]))).toBe(
      "pikmin-3-2",
    );
    expect(slugDisponible("ゼルダ", new Set())).toBe("jeu");
  });

  it("accepte un titre et les régions cochées", () => {
    expect(
      lireNouveauJeu(
        saisie({ titre: " Pikmin 3 ", "region.PAL": "on", "region.JAP": "on" }),
        new Set(),
      ),
    ).toEqual({
      ok: true,
      jeu: { slug: "pikmin-3", titre: "Pikmin 3", regions: ["JAP", "PAL"] },
    });
  });

  it("refuse un titre vide ou aucune région", () => {
    expect(
      lireNouveauJeu(saisie({ "region.PAL": "on" }), new Set()),
    ).toMatchObject({ ok: false });
    expect(
      lireNouveauJeu(saisie({ titre: "Pikmin 3" }), new Set()),
    ).toMatchObject({
      ok: false,
      erreur: expect.stringContaining("au moins une région"),
    });
  });
});
