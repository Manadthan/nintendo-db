import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signOut } }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { seDeconnecter } = await import("./auth");

describe("seDeconnecter (US-09)", () => {
  beforeEach(() => signOut.mockClear());

  it("ferme la session de cet appareil seulement, pas celles des autres appareils (choix du 26/11/2026)", async () => {
    await seDeconnecter();
    // Par défaut, Supabase ferme TOUTES les sessions du compte (scope « global ») : se déconnecter de l'ordinateur
    // déconnectait aussi l'iPhone, et les tests e2e en parallèle (CI de #290).
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
