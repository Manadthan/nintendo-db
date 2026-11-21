import { describe, expect, it } from "vitest";
import {
  lireSaisie,
  preparerCorrection,
  type JeuCorrigeable,
  type SortieCorrigeable,
} from "./correction";

const sortie = (extra: Partial<SortieCorrigeable> = {}): SortieCorrigeable => ({
  sortie: true,
  titre: "Splatoon",
  titre_romanise: null,
  date_sortie: "2015-05-29",
  precision_date: "jour",
  code_produit: "WUP-P-AGMP",
  editeur: "Nintendo",
  ...extra,
});
const avant: JeuCorrigeable = {
  developpeur: "Nintendo EAD",
  series: ["Splatoon"],
  metacritic_note: null,
  metacritic_url: null,
  releases: {
    JAP: sortie({ titre: "スプラトゥーン" }),
    US: sortie(),
    PAL: sortie(),
  },
};
const sansVerrou = {
  game: [],
  releases: { JAP: [], US: [], PAL: ["editeur"] },
};

describe("preparerCorrection (US-11)", () => {
  it("n'écrit que les champs modifiés, et les verrouille contre l'import", () => {
    const apres = structuredClone(avant);
    apres.releases.PAL.code_produit = "WUP-P-AGMP-EUR";
    apres.developpeur = "Nintendo EPD";
    const r = preparerCorrection(avant, apres, sansVerrou);
    expect(r).toEqual({
      ok: true,
      correction: {
        game: { developpeur: "Nintendo EPD", verrous: ["developpeur"] },
        releases: {
          PAL: {
            code_produit: "WUP-P-AGMP-EUR",
            verrous: ["editeur", "code_produit"],
          },
        },
      },
    });
  });

  it("corrige les séries et les verrouille (SPEC v1.37)", () => {
    const apres = structuredClone(avant);
    apres.series = ["Mario", "Splatoon"];
    const r = preparerCorrection(avant, apres, sansVerrou);
    expect(r.ok && r.correction.game).toEqual({
      series: ["Mario", "Splatoon"],
      verrous: ["series"],
    });
  });

  it("lit les séries saisies, séparées par des virgules", () => {
    const f = new FormData();
    f.set("series", " Mario, Dr. Mario ,");
    expect(lireSaisie(f).series).toEqual(["Dr. Mario", "Mario"]);
  });

  it("sans modification, n'écrit rien de plus", () => {
    expect(
      preparerCorrection(avant, structuredClone(avant), sansVerrou),
    ).toEqual({
      ok: true,
      correction: { game: { verrous: [] }, releases: {} },
    });
  });

  it("refuse une version sortie sans titre, et une date invalide", () => {
    const apres = structuredClone(avant);
    apres.releases.US.titre = null;
    apres.releases.PAL.date_sortie = "2015-02-30";
    const r = preparerCorrection(avant, apres, sansVerrou);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.erreurs).toEqual([
      "US : le titre est obligatoire pour une version sortie.",
      "PAL : date invalide (attendu AAAA-MM-JJ).",
    ]);
  });

  it("lit la saisie du formulaire, champs vides = inconnus", () => {
    const f = new FormData();
    f.set("developpeur", " Nintendo EAD ");
    f.set("PAL.sortie", "on");
    f.set("PAL.titre", "Splatoon");
    f.set("PAL.date_sortie", "2015-05-29");
    f.set("PAL.precision_date", "jour");
    f.set("PAL.code_produit", "");
    const s = lireSaisie(f);
    expect(s.developpeur).toBe("Nintendo EAD");
    expect(s.releases.PAL).toMatchObject({
      sortie: true,
      titre: "Splatoon",
      code_produit: null,
    });
    expect(s.releases.US.sortie).toBe(false);
  });

  it("note Metacritic saisie à la main : écrite et verrouillée ; hors de 0 à 100 ou mauvaise adresse, refusée", () => {
    const apres = structuredClone(avant);
    apres.metacritic_note = 81;
    apres.metacritic_url = "https://www.metacritic.com/game/splatoon/";
    expect(preparerCorrection(avant, apres, sansVerrou)).toMatchObject({
      ok: true,
      correction: {
        game: {
          metacritic_note: 81,
          metacritic_url: "https://www.metacritic.com/game/splatoon/",
          verrous: ["metacritic_note", "metacritic_url"],
        },
      },
    });
    const faux = structuredClone(avant);
    faux.metacritic_note = 120;
    faux.metacritic_url = "https://exemple.fr/splatoon";
    const r = preparerCorrection(avant, faux, sansVerrou);
    expect(!r.ok && r.erreurs).toEqual([
      "Note Metacritic : un nombre entier de 0 à 100.",
      "Page Metacritic : une adresse commençant par https://www.metacritic.com/.",
    ]);
  });

  it("lit la note saisie ; un texte non numérique est refusé", () => {
    const f = new FormData();
    f.set("metacritic_note", " 81 ");
    expect(lireSaisie(f).metacritic_note).toBe(81);
    f.set("metacritic_note", "bien");
    const apres = lireSaisie(f);
    expect(
      preparerCorrection(
        avant,
        { ...avant, metacritic_note: apres.metacritic_note },
        sansVerrou,
      ).ok,
    ).toBe(false);
  });
});
