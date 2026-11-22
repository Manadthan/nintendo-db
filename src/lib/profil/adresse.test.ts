import { describe, expect, it } from "vitest";
import { cheminPublic } from "@/lib/profil/adresse";

describe("cheminPublic (US-23)", () => {
  it("donne une seule adresse par profil, en minuscules", () => {
    expect(cheminPublic("Lea-64")).toBe("/collectionneurs/lea-64");
    expect(cheminPublic("lea-64")).toBe(cheminPublic("LEA-64"));
  });
});
