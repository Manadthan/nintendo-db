import { describe, expect, it, vi } from "vitest";
import {
  avecReessais,
  decrireErreurStockage,
  telechargerAvecReessais,
} from "./reessais";

describe("avecReessais (relais, #92)", () => {
  it("réussit au 2ᵉ essai après une erreur passagère", async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error("<none>"))
      .mockResolvedValueOnce("déposé");
    await expect(avecReessais(action, { attente: 1 })).resolves.toBe("déposé");
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("abandonne après 3 essais, en le disant", async () => {
    const action = vi
      .fn()
      .mockRejectedValue(new Error("wii/wiitdb.xml : refusé"));
    await expect(avecReessais(action, { attente: 1 })).rejects.toThrow(
      "wii/wiitdb.xml : refusé (après 3 essais)",
    );
    expect(action).toHaveBeenCalledTimes(3);
  });
});

describe("decrireErreurStockage", () => {
  it("dit qu'il n'y a pas de message, et donne le code HTTP s'il est connu", () => {
    expect(
      decrireErreurStockage({ message: "", originalError: { status: 502 } }),
    ).toBe("erreur sans message (HTTP 502)");
    expect(
      decrireErreurStockage({
        message: "Payload too large",
        statusCode: "413",
      }),
    ).toBe("Payload too large (HTTP 413)");
    expect(decrireErreurStockage({ message: "refusé" })).toBe("refusé");
  });
});

describe("telechargerAvecReessais (relais, délai de GameTDB du 18/11/2026)", () => {
  const delai = () =>
    Promise.reject(
      new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      ),
    );
  const reponse = (status: number, octets = [1, 2, 3]) =>
    Promise.resolve(new Response(new Uint8Array(octets), { status }));

  it("réessaie après un délai dépassé, puis rend le fichier", async () => {
    let appels = 0;
    const lire = () => (++appels === 1 ? delai() : reponse(200));
    await expect(
      telechargerAvecReessais("https://x/base.zip", { lire, attente: 1 }),
    ).resolves.toEqual(new Uint8Array([1, 2, 3]));
    expect(appels).toBe(2);
  });

  it("un fichier absent (404) rend null tout de suite, sans réessai", async () => {
    let appels = 0;
    const lire = () => (appels++, reponse(404));
    await expect(
      telechargerAvecReessais("https://x/scan.jpg", { lire, attente: 1 }),
    ).resolves.toBeNull();
    expect(appels).toBe(1);
  });

  it("une erreur serveur (503) est réessayée", async () => {
    let appels = 0;
    const lire = () => (++appels < 3 ? reponse(503) : reponse(200));
    await expect(
      telechargerAvecReessais("https://x/scan.jpg", { lire, attente: 1 }),
    ).resolves.not.toBeNull();
  });

  it("après tous les essais, l'erreur nomme l'adresse et le nombre d'essais", async () => {
    await expect(
      telechargerAvecReessais("https://x/base.zip", {
        lire: delai,
        attente: 1,
      }),
    ).rejects.toThrow(/https:\/\/x\/base\.zip.*après 3 essais/);
  });
});
