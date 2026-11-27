import { describe, expect, it } from "vitest";
import { trier } from "@/lib/catalogue/catalogue";
import {
  filtrer,
  SANS_FILTRE,
  seriesProposees,
  typesAmiiboProposes,
} from "@/lib/catalogue/filtres";
import { contientMots, motsRecherche } from "@/lib/catalogue/recherche";
import type { JeuCatalogue } from "@/lib/catalogue/types";
import {
  seriesAmiibo,
  texteRechercheAmiibo,
  versAmiiboCatalogue,
  versionsAmiibo,
  type LigneAmiiboCatalogue,
} from "./catalogue";

// Amiibo dans le catalogue (US-29, ADR-21 point 5) : lignes écrites à la main d'après la base du 25/11 (Sidon, Ryu de
// Street Fighter 6, une carte Animal Crossing sortie au Japon seulement), liste raccourcie.

const ID = "277927c3-29c7-415e-bcf4-378515375c0d";

const ligne = (
  slug: string,
  nom: string,
  serieJeux: string | null,
  serieAmiibo: string | null,
  sorties: [string, string][],
  consoles: (string | null)[],
  type: LigneAmiiboCatalogue["type"] = "figurine",
): LigneAmiiboCatalogue => ({
  id: `id-${slug}`,
  slug,
  nom,
  nom_jap: null,
  type,
  serie_amiibo: serieAmiibo,
  serie_jeux: serieJeux,
  image_path: `${ID}/figurine-mwwkmxti`,
  amiibo_sorties: sorties.map(([region, date_sortie]) => ({
    region: region as "JAP" | "US" | "PAL",
    date_sortie,
    precision_date: "jour",
  })),
  amiibo_jeux: consoles.map((c) => ({
    games: c ? { consoles: { slug: c } } : null,
  })),
});

const LIGNES = [
  ligne(
    "sidon",
    "Sidon",
    "The Legend of Zelda",
    "Legend Of Zelda",
    [
      ["JAP", "2025-06-05"],
      ["US", "2025-06-05"],
      ["PAL", "2025-06-05"],
    ],
    ["switch", "switch", "3ds", null],
  ),
  ligne(
    "ryu-street-fighter-6",
    "Ryu",
    "Street Fighter",
    "Street Fighter 6",
    [
      ["US", "2025-12-05"],
      ["PAL", "2025-12-05"],
    ],
    [null],
    "carte",
  ),
  ligne(
    "isabelle-japon",
    "Isabelle",
    "Animal Crossing",
    "Animal Crossing",
    [["JAP", "2015-07-30"]],
    ["3ds"],
    "carte",
  ),
];

const AMIIBO = versAmiiboCatalogue(LIGNES);

describe("seriesAmiibo", () => {
  it("ramène la série aux noms de nos jeux, avec Super Smash Bros. lu dans la série amiibo", () => {
    expect(seriesAmiibo("Super Mario", "Super Smash Bros.")).toEqual([
      "Mario",
      "Super Smash Bros.",
    ]);
    expect(seriesAmiibo("Pokemon", "Pokemon")).toEqual(["Pokémon"]);
    expect(seriesAmiibo("Earthbound", "Super Smash Bros.")).toEqual([
      "Mother",
      "Super Smash Bros.",
    ]);
  });

  it("garde le nom d'une série que nos jeux n'ont pas", () => {
    expect(seriesAmiibo("Street Fighter", "Street Fighter 6")).toEqual([
      "Street Fighter",
    ]);
    expect(seriesAmiibo(null, null)).toEqual([]);
  });
});

describe("versAmiiboCatalogue", () => {
  it("envoie les sorties par région, les consoles des jeux du catalogue sans doublon, trié par slug", () => {
    expect(AMIIBO.map((a) => a.slug)).toEqual([
      "isabelle-japon",
      "ryu-street-fighter-6",
      "sidon",
    ]);
    const sidon = AMIIBO.find((a) => a.slug === "sidon")!;
    expect(sidon.consoles).toEqual(["3ds", "switch"]);
    expect(sidon.sorties.PAL).toEqual({
      date: "2025-06-05",
      precision: "jour",
    });
    expect(sidon.image).toBe(`${ID}/figurine-mwwkmxti`);
    expect(AMIIBO.find((a) => a.slug === "ryu-street-fighter-6")).toMatchObject(
      { sorties: { US: expect.anything() }, consoles: [] },
    );
  });
});

describe("versionsAmiibo", () => {
  it("cache un amiibo non sorti sur le marché choisi", () => {
    expect(versionsAmiibo(AMIIBO, "JAP").map((v) => v.amiibo?.slug)).toEqual([
      "isabelle-japon",
      "sidon",
    ]);
    expect(versionsAmiibo(AMIIBO, "PAL").map((v) => v.amiibo?.slug)).toEqual([
      "ryu-street-fighter-6",
      "sidon",
    ]);
  });

  it("avec « Tous », montre la date PAL, sinon US, sinon JAP", () => {
    const tous = versionsAmiibo(AMIIBO, "TOUS");
    expect(tous.map((v) => [v.amiibo?.slug, v.region])).toEqual([
      ["isabelle-japon", "JAP"],
      ["ryu-street-fighter-6", "PAL"],
      ["sidon", "PAL"],
    ]);
    expect(tous[0]?.sortie).toMatchObject({
      titre: "Isabelle",
      date: "2015-07-30",
    });
    // Jamais une possession de jeu, jamais de note.
    expect(tous[0]?.jeu).toMatchObject({
      id: "amiibo:isabelle-japon",
      metacritic: null,
      genres: [],
    });
  });
});

describe("filtres et recherche", () => {
  const tous = versionsAmiibo(AMIIBO, "TOUS");
  const slugs = (versions: typeof tous) => versions.map((v) => v.amiibo?.slug);

  it("Console : l'amiibo lu par au moins un jeu de cette console", () => {
    expect(slugs(filtrer(tous, { ...SANS_FILTRE, console: "3ds" }))).toEqual([
      "isabelle-japon",
      "sidon",
    ]);
    expect(slugs(filtrer(tous, { ...SANS_FILTRE, console: "wii-u" }))).toEqual(
      [],
    );
  });

  it("Genre et Développeur cachent les amiibo ; Série et Année s'appliquent", () => {
    expect(filtrer(tous, { ...SANS_FILTRE, genre: "Action" })).toEqual([]);
    expect(
      filtrer(tous, { ...SANS_FILTRE, developpeur: "Nintendo EPD" }),
    ).toEqual([]);
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, serie: "Street Fighter" })),
    ).toEqual(["ryu-street-fighter-6"]);
    expect(slugs(filtrer(tous, { ...SANS_FILTRE, annee: "2015" }))).toEqual([
      "isabelle-japon",
    ]);
    expect(seriesProposees(tous).map((s) => s.nom)).toEqual([
      "Animal Crossing",
      "Street Fighter",
      "The Legend of Zelda",
    ]);
  });

  it("Type d'amiibo (SPEC v1.54) : garde le type choisi, cache les jeux et propose les types présents", () => {
    const jeuTest: JeuCatalogue = {
      id: "jeu-splatoon",
      slug: "splatoon",
      console: { slug: "wii-u", nom: "Wii U" },
      developpeur: "Nintendo EAD",
      editeur: "Nintendo",
      genres: ["Tir"],
      series: ["Splatoon"],
      metacritic: 81,
      sorties: {
        JAP: {
          sortie: true,
          titre: "Splatoon",
          titreRomanise: null,
          date: "2015-05-28",
          precision: "jour",
          jaquette: null,
        },
        US: {
          sortie: true,
          titre: "Splatoon",
          titreRomanise: null,
          date: "2015-05-29",
          precision: "jour",
          jaquette: null,
        },
        PAL: {
          sortie: true,
          titre: "Splatoon",
          titreRomanise: null,
          date: "2015-05-29",
          precision: "jour",
          jaquette: null,
        },
      },
    };
    const meles = [...trier([jeuTest], "anciens", "TOUS"), ...tous];
    expect(
      slugs(filtrer(meles, { ...SANS_FILTRE, typeAmiibo: "figurine" })),
    ).toEqual(["sidon"]);
    expect(
      slugs(filtrer(meles, { ...SANS_FILTRE, typeAmiibo: "carte" })),
    ).toEqual(["isabelle-japon", "ryu-street-fighter-6"]);
    expect(filtrer(meles, { ...SANS_FILTRE, typeAmiibo: "peluche" })).toEqual(
      [],
    );
    expect(typesAmiiboProposes(meles)).toEqual([
      { valeur: "figurine", libelle: "Figurine", nombre: 1 },
      { valeur: "carte", libelle: "Carte", nombre: 2 },
    ]);
  });

  it("cherche dans le nom, la série amiibo et les séries de jeux", () => {
    const sidon = AMIIBO.find((a) => a.slug === "sidon")!;
    const texte = texteRechercheAmiibo(sidon);
    expect(contientMots(texte, motsRecherche("sidon"))).toBe(true);
    expect(contientMots(texte, motsRecherche("zelda"))).toBe(true);
    expect(contientMots(texte, motsRecherche("mario"))).toBe(false);
  });
});
