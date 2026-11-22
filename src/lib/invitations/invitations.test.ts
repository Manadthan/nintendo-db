import { describe, expect, it } from "vitest";
import {
  etatInvitation,
  genererJeton,
  hacherJeton,
  jetonValide,
  lienInvitation,
  lireNom,
} from "@/lib/invitations/invitations";

describe("jeton d'invitation (US-19, ADR-16)", () => {
  it("est long, sûr dans une adresse et jamais deux fois le même", () => {
    const a = genererJeton();
    expect(jetonValide(a)).toBe(true);
    expect(a).not.toBe(genererJeton());
  });

  it("refuse une adresse fantaisiste", () => {
    for (const j of [
      "",
      "abc",
      "a".repeat(42),
      `${"a".repeat(42)}/`,
      "a".repeat(44),
    ])
      expect(jetonValide(j)).toBe(false);
  });

  it("n'est gardé que par son empreinte SHA-256", () => {
    expect(hacherJeton("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("donne un lien vers la page Bienvenue du site qui l'a créé", () => {
    expect(lienInvitation("https://nintendo-db.vercel.app/", "XYZ")).toBe(
      "https://nintendo-db.vercel.app/bienvenue/XYZ",
    );
  });
});

describe("état d'une invitation", () => {
  const maintenant = new Date("2026-11-22T12:00:00Z");
  it("en attente, expirée ou utilisée", () => {
    expect(
      etatInvitation(
        { expire_le: "2026-11-29T12:00:00Z", utilisee_le: null },
        maintenant,
      ),
    ).toBe("en-attente");
    expect(
      etatInvitation(
        { expire_le: "2026-11-22T12:00:00Z", utilisee_le: null },
        maintenant,
      ),
    ).toBe("expiree");
    expect(
      etatInvitation(
        {
          expire_le: "2026-11-20T12:00:00Z",
          utilisee_le: "2026-11-19T08:00:00Z",
        },
        maintenant,
      ),
    ).toBe("utilisee");
  });
});

describe("nom de l'invitation", () => {
  it("nettoie les espaces et exige 1 à 40 caractères", () => {
    expect(lireNom("  Léa   la  joueuse ")).toEqual({
      ok: true,
      nom: "Léa la joueuse",
    });
    expect(lireNom("   ").ok).toBe(false);
    expect(lireNom(null).ok).toBe(false);
    expect(lireNom("x".repeat(41)).ok).toBe(false);
  });
});
