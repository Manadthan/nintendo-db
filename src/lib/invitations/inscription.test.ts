import { describe, expect, it } from "vitest";
import { lireInscription } from "@/lib/invitations/inscription";

const formulaire = (champs: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.set(k, v);
  return f;
};

describe("lireInscription (US-20)", () => {
  it("accepte un formulaire complet, e-mail en minuscules", () => {
    expect(
      lireInscription(
        formulaire({
          avatar: "tortue",
          email: " Lea@Exemple.fr ",
          password: "12345678",
          pseudo: "Lea-64",
        }),
      ),
    ).toEqual({
      ok: true,
      valeur: {
        email: "lea@exemple.fr",
        motDePasse: "12345678",
        pseudo: "Lea-64",
        avatar: "tortue",
      },
    });
  });

  it("donne la manette à qui n'a pas choisi d'avatar (ou un avatar inconnu)", () => {
    const r = lireInscription(
      formulaire({
        email: "a@b.fr",
        password: "12345678",
        pseudo: "abc",
        avatar: "mario",
      }),
    );
    expect(r.ok && r.valeur.avatar).toBe("manette");
  });

  it("liste toutes les erreurs d'un coup", () => {
    const r = lireInscription(
      formulaire({ email: "lea", password: "court", pseudo: "Léa" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs).toHaveLength(3);
  });

  it("applique la règle du pseudo de la base", () => {
    for (const pseudo of ["ab", "x".repeat(21), "Léa", "lea fan", "lea_fan"])
      expect(
        lireInscription(
          formulaire({ email: "a@b.fr", password: "12345678", pseudo }),
        ).ok,
      ).toBe(false);
    for (const pseudo of ["abc", "x".repeat(20), "Zelda-64"])
      expect(
        lireInscription(
          formulaire({ email: "a@b.fr", password: "12345678", pseudo }),
        ).ok,
      ).toBe(true);
  });
});
