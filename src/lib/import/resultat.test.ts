import { describe, expect, it } from "vitest";
import { capturer, valeur } from "./resultat";

describe("capturer / valeur — erreurs lisibles en production (#53)", () => {
  it("rend la valeur d'une action réussie", async () => {
    const r = await capturer(async () => 42);
    expect(r).toEqual({ ok: true, valeur: 42 });
    expect(valeur(r)).toBe(42);
  });

  it("rend le message d'une erreur au lieu de la lancer (Next.js le masquerait)", async () => {
    const r = await capturer(async () => {
      throw new Error("GameTDB indisponible (HTTP 403)");
    });
    expect(r).toEqual({ ok: false, erreur: "GameTDB indisponible (HTTP 403)" });
    expect(() => valeur(r)).toThrow("GameTDB indisponible (HTTP 403)");
  });

  it("ajoute la cause d'un échec réseau (« fetch failed » seul ne dit rien)", async () => {
    const r = await capturer(async () => {
      throw new TypeError("fetch failed", {
        cause: Object.assign(new Error("connect ETIMEDOUT"), {
          code: "ETIMEDOUT",
        }),
      });
    });
    expect(r).toEqual({
      ok: false,
      erreur: "fetch failed (connect ETIMEDOUT)",
    });
  });

  it("suit les causes en chaîne", async () => {
    const r = await capturer(async () => {
      throw new Error("GameTDB injoignable", {
        cause: new TypeError("fetch failed", {
          cause: new Error("getaddrinfo ENOTFOUND www.gametdb.com"),
        }),
      });
    });
    expect(r).toEqual({
      ok: false,
      erreur:
        "GameTDB injoignable (fetch failed (getaddrinfo ENOTFOUND www.gametdb.com))",
    });
  });
});
