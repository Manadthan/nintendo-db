import { describe, expect, it } from "vitest";
import {
  PAGE_ACCUEIL,
  PAGE_ADMIN,
  PAGE_CONNEXION,
  redirectionAdmin,
} from "@/lib/auth/routes";

describe("redirectionAdmin (US-09, ADR-16)", () => {
  it("envoie un visiteur non connecté vers la connexion pour toute page d'administration", () => {
    expect(redirectionAdmin("/admin", "anonyme")).toBe(PAGE_CONNEXION);
    expect(redirectionAdmin("/admin/import", "anonyme")).toBe(PAGE_CONNEXION);
  });

  it("laisse un visiteur non connecté sur la page de connexion", () => {
    expect(redirectionAdmin("/admin/connexion", "anonyme")).toBeNull();
  });

  it("ne confond pas la connexion avec une page qui commence pareil", () => {
    expect(redirectionAdmin("/admin/connexion-bis", "anonyme")).toBe(
      PAGE_CONNEXION,
    );
  });

  it("laisse passer le propriétaire connecté", () => {
    expect(redirectionAdmin("/admin", "proprietaire")).toBeNull();
    expect(redirectionAdmin("/admin/import", "proprietaire")).toBeNull();
  });

  it("renvoie vers l'administration le propriétaire déjà connecté qui ouvre la connexion", () => {
    expect(redirectionAdmin("/admin/connexion", "proprietaire")).toBe(
      PAGE_ADMIN,
    );
  });

  it("ferme l'administration à un collectionneur invité, connexion comprise", () => {
    for (const chemin of ["/admin", "/admin/jeux", "/admin/connexion"])
      expect(redirectionAdmin(chemin, "collectionneur")).toBe(PAGE_ACCUEIL);
  });

  it("ne touche jamais aux pages publiques", () => {
    for (const chemin of [
      "/",
      "/consoles/wii-u",
      "/jeux/wii-u/mario-kart-8",
      "/administrateur",
    ]) {
      for (const compte of [
        "anonyme",
        "collectionneur",
        "proprietaire",
      ] as const)
        expect(redirectionAdmin(chemin, compte)).toBeNull();
    }
  });
});
