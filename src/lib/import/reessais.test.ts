import { describe, expect, it, vi } from "vitest";
import { avecReessais, decrireErreurStockage } from "./reessais";

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
