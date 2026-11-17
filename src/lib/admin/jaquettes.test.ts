import { describe, expect, it } from "vitest";
import {
  aRemplacer,
  regionDepuisAdresse,
  vignettesJaquettes,
  type LigneJeuJaquettes,
} from "./jaquettes";

const ID = "20000000-0000-0000-0000-000000000001";
const BASE = "https://exemple.supabase.co";
const jeux: LigneJeuJaquettes[] = [
  {
    slug: "zelda",
    releases: [
      {
        region: "PAL",
        sortie: true,
        titre: "Zelda",
        jaquette_path: `${ID}/pal-a1`,
        jaquette_source: "gametdb",
      },
      {
        region: "JAP",
        sortie: true,
        titre: "ゼルダ",
        jaquette_path: `${ID}/jap`,
        jaquette_source: "igdb",
      },
      {
        region: "US",
        sortie: false,
        titre: null,
        jaquette_path: null,
        jaquette_source: null,
      },
    ],
  },
  {
    slug: "bayonetta",
    releases: [
      {
        region: "JAP",
        sortie: true,
        titre: "Bayonetta",
        jaquette_path: null,
        jaquette_source: null,
      },
      {
        region: "US",
        sortie: true,
        titre: "Bayonetta",
        jaquette_path: `${ID}/us-b2`,
        jaquette_source: "url",
      },
    ],
  },
];

describe("page « Jaquettes » (US-12)", () => {
  it("une jaquette est à remplacer si elle manque ou n'est qu'une ancienne image IGDB", () => {
    expect(aRemplacer(null, null)).toBe(true);
    expect(aRemplacer("x", "igdb")).toBe(true);
    expect(aRemplacer("x", "gametdb")).toBe(false);
    expect(aRemplacer("x", "photo")).toBe(false);
  });

  it("montre toutes les sorties publiées, triées par titre puis région, avec leur source", () => {
    const v = vignettesJaquettes(jeux, "toutes", BASE);
    expect(v.map((x) => `${x.titre} ${x.region} ${x.source}`)).toEqual([
      "Bayonetta JAP null",
      "Bayonetta US url",
      "Zelda PAL gametdb",
      "ゼルダ JAP igdb",
    ]);
    expect(v[1]!.srcset).toContain(`/jaquettes/${ID}/us-b2-768.webp 768w`);
  });

  it("le filtre « à remplacer » ne garde que les jaquettes manquantes ou IGDB", () => {
    expect(
      vignettesJaquettes(jeux, "a-remplacer", BASE).map(
        (x) => `${x.slug} ${x.region}`,
      ),
    ).toEqual(["bayonetta JAP", "zelda JAP"]);
  });

  it("lit la région de l'adresse", () => {
    expect(regionDepuisAdresse("pal")).toBe("PAL");
    expect(regionDepuisAdresse("eu")).toBeNull();
  });
});
