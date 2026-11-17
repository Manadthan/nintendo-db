import { describe, expect, it } from "vitest";
import {
  PAGE_ADMIN,
  PAGE_CONNEXION,
  redirectionAdmin,
} from "@/lib/auth/routes";

describe("redirectionAdmin (US-09)", () => {
  it("envoie un visiteur non connecté vers la connexion pour toute page d'administration", () => {
    expect(redirectionAdmin("/admin", false)).toBe(PAGE_CONNEXION);
    expect(redirectionAdmin("/admin/import", false)).toBe(PAGE_CONNEXION);
  });

  it("laisse un visiteur non connecté sur la page de connexion", () => {
    expect(redirectionAdmin("/admin/connexion", false)).toBeNull();
  });

  it("ne confond pas la connexion avec une page qui commence pareil", () => {
    expect(redirectionAdmin("/admin/connexion-bis", false)).toBe(
      PAGE_CONNEXION,
    );
  });

  it("laisse passer le propriétaire connecté", () => {
    expect(redirectionAdmin("/admin", true)).toBeNull();
    expect(redirectionAdmin("/admin/import", true)).toBeNull();
  });

  it("renvoie vers l'administration le propriétaire déjà connecté qui ouvre la connexion", () => {
    expect(redirectionAdmin("/admin/connexion", true)).toBe(PAGE_ADMIN);
  });

  it("ne touche jamais aux pages publiques", () => {
    for (const chemin of [
      "/",
      "/consoles/wii-u",
      "/jeux/wii-u/mario-kart-8",
      "/administrateur",
    ]) {
      expect(redirectionAdmin(chemin, false)).toBeNull();
      expect(redirectionAdmin(chemin, true)).toBeNull();
    }
  });
});
