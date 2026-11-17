import { describe, expect, it } from "vitest";
import { trier } from "./catalogue";
import {
  SANS_FILTRE,
  anneesProposees,
  avecFiltres,
  filtrer,
  filtresDepuisParametres,
  genresProposes,
  nombreActifs,
} from "./filtres";
import type { JeuCatalogue, SortieCatalogue } from "./types";

const sortie = (date: string | null): SortieCatalogue => ({
  sortie: date !== null,
  titre: date ? "Titre" : null,
  titreRomanise: null,
  date,
  precision: date ? "jour" : null,
  jaquetteSrcset: null,
});

const jeu = (
  slug: string,
  dates: [string | null, string | null, string | null],
  genres: string[],
): JeuCatalogue => ({
  id: slug,
  slug,
  developpeur: null,
  editeur: "Nintendo",
  genres,
  sorties: {
    JAP: sortie(dates[0]),
    US: sortie(dates[1]),
    PAL: sortie(dates[2]),
  },
});

const MK8 = jeu(
  "mario-kart-8",
  ["2014-05-29", "2014-05-30", "2014-05-30"],
  ["Course", "Party", "Karting"],
);
const KARAOKE = jeu(
  "wii-karaoke-u",
  ["2012-12-08", null, null],
  ["Musique", "Karaoké"],
);
const KIRBY = jeu(
  "kirby",
  ["2015-01-22", "2015-02-20", "2015-05-08"],
  ["Action", "Plates-formes"],
);
const SING = jeu("sing-party", [null, "2012-11-18", null], ["Musique"]);

const tous = trier([MK8, KARAOKE, KIRBY, SING], "anciens", "TOUS");
const slugs = (versions: ReturnType<typeof filtrer>) =>
  versions.map((v) => v.jeu.slug);

describe("filtrer (US-06)", () => {
  it("sans filtre, garde tout", () => {
    expect(filtrer(tous, SANS_FILTRE)).toHaveLength(4);
  });

  it("disponibilité : sorti dans les 3 régions", () => {
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, disponibilite: "TOUTES" })),
    ).toEqual(["mario-kart-8", "kirby"]);
  });

  it("disponibilité : exclusif à une région", () => {
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, disponibilite: "JAP" })),
    ).toEqual(["wii-karaoke-u"]);
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, disponibilite: "US" })),
    ).toEqual(["sing-party"]);
    expect(filtrer(tous, { ...SANS_FILTRE, disponibilite: "PAL" })).toEqual([]);
  });

  it("année : celle de la version affichée pour le marché choisi", () => {
    // Kirby : 2015 partout ; en « Tous », la version PAL (mai 2015).
    expect(slugs(filtrer(tous, { ...SANS_FILTRE, annee: "2015" }))).toEqual([
      "kirby",
    ]);
    expect(slugs(filtrer(tous, { ...SANS_FILTRE, annee: "2012" }))).toEqual([
      "sing-party",
      "wii-karaoke-u",
    ]);
  });

  it("genre : un des genres du jeu", () => {
    expect(slugs(filtrer(tous, { ...SANS_FILTRE, genre: "Musique" }))).toEqual([
      "sing-party",
      "wii-karaoke-u",
    ]);
  });

  it("combine les filtres", () => {
    expect(
      slugs(
        filtrer(tous, {
          disponibilite: "JAP",
          annee: "2012",
          genre: "Musique",
        }),
      ),
    ).toEqual(["wii-karaoke-u"]);
    expect(
      filtrer(tous, { disponibilite: "TOUTES", annee: null, genre: "Musique" }),
    ).toEqual([]);
  });
});

describe("choix proposés", () => {
  it("années des versions affichées, dans l'ordre", () => {
    expect(anneesProposees(tous)).toEqual(["2012", "2014", "2015"]);
  });

  it("genres des jeux affichés, par ordre alphabétique français, sans doublon", () => {
    expect(genresProposes(tous)).toEqual([
      "Action",
      "Course",
      "Karaoké",
      "Karting",
      "Musique",
      "Party",
      "Plates-formes",
    ]);
  });

  it("compte les filtres actifs", () => {
    expect(nombreActifs(SANS_FILTRE)).toBe(0);
    expect(
      nombreActifs({ ...SANS_FILTRE, annee: "2014", genre: "Party" }),
    ).toBe(2);
  });
});

describe("filtres dans l'adresse (vue filtrée partageable)", () => {
  it("écrit les filtres en gardant la recherche et le marché", () => {
    expect(
      avecFiltres("?q=mario&marche=jap", {
        disponibilite: "JAP",
        annee: "2014",
        genre: "Plates-formes 3D",
      }),
    ).toBe("?q=mario&marche=jap&dispo=jap&annee=2014&genre=Plates-formes+3D");
  });

  it("retire un filtre effacé, et ne laisse pas de « ? » vide", () => {
    expect(avecFiltres("?q=mario&genre=Party", SANS_FILTRE)).toBe("?q=mario");
    expect(avecFiltres("?annee=2014", SANS_FILTRE)).toBe("");
  });

  it("relit les filtres, et ignore les valeurs inconnues", () => {
    expect(
      filtresDepuisParametres(
        "?dispo=toutes&annee=2014&genre=Plates-formes+3D",
      ),
    ).toEqual({
      disponibilite: "TOUTES",
      annee: "2014",
      genre: "Plates-formes 3D",
    });
    expect(filtresDepuisParametres("?dispo=mars&annee=hier&genre=")).toEqual(
      SANS_FILTRE,
    );
  });
});
