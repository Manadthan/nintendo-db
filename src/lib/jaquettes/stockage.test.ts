import { describe, expect, it } from "vitest";
import { cheminJaquette, srcsetJaquette, urlJaquette } from "./stockage";

const JEU = "20000000-0000-0000-0000-000000000001";
const BASE = "https://exemple.supabase.co";

describe("cheminJaquette", () => {
  it("range les jaquettes par jeu, puis par région et taille (ADR-04)", () => {
    expect(cheminJaquette(JEU, "PAL", 600)).toBe(`${JEU}/pal-600.webp`);
    expect(cheminJaquette(JEU, "JAP", 300)).toBe(`${JEU}/jap-300.webp`);
  });

  it("refuse un identifiant de jeu qui n'est pas un UUID (pas de chemin fabriqué)", () => {
    expect(() => cheminJaquette("../autre", "US", 300)).toThrow();
    expect(() => cheminJaquette("", "US", 300)).toThrow();
  });
});

describe("urlJaquette", () => {
  it("donne l'adresse publique de l'image dans le bucket jaquettes", () => {
    expect(urlJaquette(`${JEU}/us-600.webp`, BASE)).toBe(
      `${BASE}/storage/v1/object/public/jaquettes/${JEU}/us-600.webp`,
    );
  });

  it("ignore une barre oblique finale dans l'adresse de Supabase", () => {
    expect(urlJaquette(`${JEU}/us-600.webp`, `${BASE}/`)).toBe(
      `${BASE}/storage/v1/object/public/jaquettes/${JEU}/us-600.webp`,
    );
  });
});

describe("srcsetJaquette", () => {
  it("propose les deux tailles, la grande pour l'écran Retina", () => {
    expect(srcsetJaquette(JEU, "PAL", BASE)).toBe(
      `${BASE}/storage/v1/object/public/jaquettes/${JEU}/pal-300.webp 300w, ` +
        `${BASE}/storage/v1/object/public/jaquettes/${JEU}/pal-600.webp 600w`,
    );
  });
});
