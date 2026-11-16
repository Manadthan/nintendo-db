import { describe, expect, it } from "vitest";
import { lireIgdbEnv } from "./env";

describe("lireIgdbEnv", () => {
  it("renvoie les identifiants IGDB", () => {
    expect(
      lireIgdbEnv({ IGDB_CLIENT_ID: " id ", IGDB_CLIENT_SECRET: "secret" }),
    ).toEqual({
      clientId: "id",
      clientSecret: "secret",
    });
  });

  it("nomme les variables manquantes, sans jamais afficher de valeur", () => {
    expect(() => lireIgdbEnv({ IGDB_CLIENT_ID: "id" })).toThrow(
      /IGDB_CLIENT_SECRET/,
    );
    expect(() => lireIgdbEnv({ IGDB_CLIENT_ID: "id" })).not.toThrow(/id,/);
  });
});
