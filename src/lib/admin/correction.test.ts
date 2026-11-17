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
});
