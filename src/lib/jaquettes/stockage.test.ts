import { describe, expect, it } from "vitest";
import {
  baseJaquette,
  cheminJaquette,
  srcsetJaquette,
  urlJaquette,
} from "./stockage";

const JEU = "20000000-0000-0000-0000-000000000001";
const BASE = "https://exemple.supabase.co";

describe("baseJaquette, cheminJaquette (ADR-04, #60)", () => {
  it("range les jaquettes par jeu, région, version et taille", () => {
    const base = baseJaquette(JEU, "PAL", "mi3x9k");
    expect(base).toBe(`${JEU}/pal-mi3x9k`);
    expect(cheminJaquette(base, 600)).toBe(`${JEU}/pal-mi3x9k-600.webp`);
  });

  it("lit encore les jaquettes copiées avant les versions", () => {
    expect(cheminJaquette(`${JEU}/jap`, 300)).toBe(`${JEU}/jap-300.webp`);
  });

  it("refuse un chemin fabriqué (identifiant, région ou version douteux)", () => {
    expect(() => baseJaquette("../autre", "US", "a1")).toThrow();
    expect(() => baseJaquette(JEU, "US", "../x")).toThrow();
    expect(() => cheminJaquette("../autre/pal", 300)).toThrow();
    expect(() => cheminJaquette(`${JEU}/eu`, 300)).toThrow();
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
    expect(srcsetJaquette(`${JEU}/pal`, BASE)).toBe(
      `${BASE}/storage/v1/object/public/jaquettes/${JEU}/pal-300.webp 300w, ` +
        `${BASE}/storage/v1/object/public/jaquettes/${JEU}/pal-600.webp 600w, ` +
        `${BASE}/storage/v1/object/public/jaquettes/${JEU}/pal-768.webp 768w`,
    );
  });
});
