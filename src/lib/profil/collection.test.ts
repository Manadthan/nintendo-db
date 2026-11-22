import { describe, expect, it } from "vitest";
import { ensemble } from "@/lib/collection/collection";
import {
  derniersAjouts,
  resumeCollection,
  type LigneAjout,
} from "@/lib/profil/collection";
import type { JeuStat } from "@/lib/statistiques/statistiques";

const jeu = (id: string, console: string): JeuStat => ({
  id,
  titre: id,
  console: { slug: console, nom: console.toUpperCase() },
  metacritic: null,
  sorties: ["JAP", "US", "PAL"],
  sansJaquette: [],
  sansCode: [],
  firstParty: true,
});

describe("resumeCollection (US-22)", () => {
  const jeux = [
    jeu("a", "n64"),
    jeu("b", "n64"),
    jeu("c", "gb"),
    jeu("d", "wii"),
  ];
  const consoles = [
    { slug: "n64", nom: "N64" },
    { slug: "gb", nom: "GB" },
    { slug: "wii", nom: "WII" },
  ];
  const possessions = ensemble([
    { game_id: "a", region: "JAP" },
    { game_id: "a", region: "PAL" },
    { game_id: "c", region: "US" },
  ]);

  it("compte les jeux (une version suffit) et les versions possédées", () => {
    const r = resumeCollection(jeux, consoles, possessions);
    expect(r.jeux).toBe(2);
    expect(r.versions).toBe(3);
    expect(r.regions).toEqual({ JAP: 1, US: 1, PAL: 1 });
  });

  it("ne garde que les consoles où un jeu est possédé, dans l'ordre des consoles", () => {
    const r = resumeCollection(jeux, consoles, possessions);
    expect(
      r.consoles.map((c) => [c.slug, c.possedes, c.total, c.pourcent]),
    ).toEqual([
      ["n64", 1, 2, 50],
      ["gb", 1, 1, 100],
    ]);
  });

  it("collection vide : tout à zéro", () => {
    const r = resumeCollection(jeux, consoles, ensemble([]));
    expect([r.jeux, r.versions, r.consoles.length]).toEqual([0, 0, 0]);
  });
});

describe("derniersAjouts (US-22)", () => {
  const ligne = (
    region: LigneAjout["region"],
    titres: Partial<Record<string, string>>,
    jaquette: string | null,
  ): LigneAjout => ({
    region,
    cree_le: "2026-11-22T10:00:00Z",
    games: {
      slug: "yoshi-s-story",
      consoles: { slug: "n64", nom: "Nintendo 64" },
      releases: Object.entries(titres).map(([r, titre]) => ({
        region: r as LigneAjout["region"],
        titre: titre ?? null,
        jaquette_path: r === region ? jaquette : null,
      })),
    },
  });

  it("donne le titre, la jaquette et la fiche de la version ajoutée", () => {
    const [a] = derniersAjouts(
      [
        ligne(
          "PAL",
          { US: "Yoshi's Story", PAL: "Yoshi's Story (PAL)" },
          "00000000-0000-4000-8000-000000000001/pal-v1",
        ),
      ],
      "https://x.supabase.co",
    );
    expect(a!.titre).toBe("Yoshi's Story (PAL)");
    expect(a!.href).toBe("/jeux/n64/yoshi-s-story");
    expect(a!.jaquetteSrcset).toContain(
      "https://x.supabase.co/storage/v1/object/public/jaquettes/00000000-0000-4000-8000-000000000001/pal-v1-300.webp 300w",
    );
  });

  it("sans titre ni jaquette pour la région : titre d'une autre région, vignette neutre", () => {
    const [a] = derniersAjouts(
      [ligne("JAP", { US: "Yoshi's Story" }, null)],
      "https://x",
    );
    expect(a!.titre).toBe("Yoshi's Story");
    expect(a!.jaquetteSrcset).toBeNull();
  });
});
