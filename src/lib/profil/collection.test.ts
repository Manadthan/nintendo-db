import { describe, expect, it } from "vitest";
import { ensemble } from "@/lib/collection/collection";
import {
  derniersAjouts,
  jeuxParConsole,
  resumeCollection,
  syntheseProfil,
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

describe("jeuxParConsole (US-23)", () => {
  const jeuSlug = (id: string, console: string, titre: string) => ({
    ...jeu(id, console),
    titre,
    slug: id,
  });
  const jeux = [
    jeuSlug("zelda", "n64", "Zelda"),
    jeuSlug("mario", "n64", "Mario 64"),
    jeuSlug("tetris", "gb", "Tetris"),
    jeuSlug("wario", "wii", "Wario"),
  ];
  const consoles = [
    { slug: "gb", nom: "Game Boy" },
    { slug: "n64", nom: "Nintendo 64" },
    { slug: "wii", nom: "Wii" },
  ];

  it("liste les jeux possédés par console, consoles dans l'ordre, jeux par titre, avec le lien de la fiche", () => {
    const possessions = ensemble([
      { game_id: "zelda", region: "JAP" },
      { game_id: "mario", region: "PAL" },
      { game_id: "tetris", region: "US" },
    ]);
    expect(jeuxParConsole(jeux, consoles, possessions)).toEqual([
      {
        console: { slug: "gb", nom: "Game Boy" },
        jeux: [{ id: "tetris", titre: "Tetris", href: "/jeux/gb/tetris" }],
      },
      {
        console: { slug: "n64", nom: "Nintendo 64" },
        jeux: [
          { id: "mario", titre: "Mario 64", href: "/jeux/n64/mario" },
          { id: "zelda", titre: "Zelda", href: "/jeux/n64/zelda" },
        ],
      },
    ]);
  });
});

describe("amiibo dans le profil (US-30)", () => {
  const BASE = "https://exemple.supabase.co";
  const ID = "277927c3-29c7-415e-bcf4-378515375c0d";
  const version = (cree_le: string): LigneAjout => ({
    region: "PAL",
    cree_le,
    games: {
      slug: "splatoon",
      consoles: { slug: "wii-u", nom: "Wii U" },
      releases: [{ region: "PAL", titre: "Splatoon", jaquette_path: null }],
    },
  });
  const amiibo = (slug: string, cree_le: string) => ({
    cree_le,
    amiibo: { slug, nom: slug, image_path: `${ID}/figurine-abc` },
  });

  it("mêle versions et amiibo du plus récent au plus ancien, 6 au plus", () => {
    const ajouts = derniersAjouts(
      [version("2026-11-20T10:00:00Z"), version("2026-11-25T10:00:00Z")],
      BASE,
      [
        amiibo("sidon", "2026-11-26T10:00:00Z"),
        ...["a", "b", "c", "d", "e"].map((s, i) =>
          amiibo(s, `2026-11-2${i}T09:00:00Z`),
        ),
      ],
    );
    expect(ajouts).toHaveLength(6);
    expect(ajouts[0]).toMatchObject({
      titre: "sidon",
      region: null,
      console: null,
      href: "/amiibo/sidon",
    });
    expect(ajouts[0]?.jaquetteSrcset).toContain(
      `${BASE}/storage/v1/object/public/amiibo/${ID}/figurine-abc-300.webp 300w`,
    );
    expect(ajouts[1]).toMatchObject({ titre: "Splatoon", region: "PAL" });
    // La version du 20/11 est la plus ancienne : elle sort des 6.
    expect(ajouts.map((a) => a.titre)).not.toContain(undefined);
    expect(ajouts.filter((a) => a.region === "PAL")).toHaveLength(1);
  });

  it("le résumé porte la ligne « Amiibo : N / total »", () => {
    const { resume } = syntheseProfil([], [], ensemble([]), [], BASE, {
      possedes: 3,
      total: 954,
      ajouts: [],
    });
    expect(resume.amiibo).toEqual({ possedes: 3, total: 954 });
  });
});
