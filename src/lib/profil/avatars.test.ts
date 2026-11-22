import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AVATARS, avatarOuDefaut, estAvatar } from "@/lib/profil/avatars";

describe("avatars (US-22)", () => {
  it("sont exactement ceux que la base accepte (migration 0024)", () => {
    const migration = readFileSync(
      "supabase/migrations/0024_roles.sql",
      "utf8",
    );
    const liste = migration.match(/check \(avatar in \(([^)]*)\)\)/)?.[1] ?? "";
    const enBase = [...liste.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(AVATARS.map((a) => a.id)).toEqual(enBase);
  });

  it("reconnaît un avatar, et remplace un inconnu par la manette", () => {
    expect(estAvatar("tortue")).toBe(true);
    expect(estAvatar("mario")).toBe(false);
    expect(avatarOuDefaut("de")).toBe("de");
    expect(avatarOuDefaut(null)).toBe("manette");
  });
});
