import { describe, expect, it } from "vitest";
import {
  cheminAmiibo,
  donneesAmiibo,
  estSlugAmiibo,
  identifiantLisible,
  libelleSortieAmiibo,
  metadonneesAmiibo,
  regionAmiiboParDefaut,
  baseImageValide,
  srcsetAmiibo,
  versAmiiboDuJeu,
  versAmiiboFiche,
  type LigneAmiibo,
} from "./fiche";

// Fiche de l'amiibo (US-29, ADR-21 point 6) : ligne écrite à la main d'après Sidon en base le 25/11 (identifiant,
// chemins d'images et jeux compatibles réels, liste raccourcie).

const BASE_URL = "https://exemple.supabase.co/";
const ID = "277927c3-29c7-415e-bcf4-378515375c0d";

const sidon: LigneAmiibo = {
  slug: "sidon",
  identifiant: "010a000004a40902",
  nom: "Sidon",
  nom_jap: null,
  type: "figurine",
  serie_amiibo: "Legend Of Zelda",
  serie_jeux: "The Legend of Zelda",
  personnage: "Sidon",
  editeur: "Nintendo",
  image_path: `${ID}/figurine-mwwkmxti`,
  boite_path: `${ID}/boite-mwwkmxti`,
  amiibo_sorties: [
    { region: "US", date_sortie: "2025-06-05", precision_date: "jour" },
    { region: "JAP", date_sortie: "2025-06-05", precision_date: "jour" },
  ],
  amiibo_jeux: [
    {
      titre_jeu: "Conga Master Party!",
      console: "Switch",
      usage: "Unlock a special costume",
      games: null,
    },
    {
      titre_jeu: "The Legend of Zelda: Tears of the Kingdom",
      console: "Switch",
      usage: "Receive materials and a weapon or rare item",
      games: {
        slug: "the-legend-of-zelda-tears-of-the-kingdom",
        consoles: { slug: "switch" },
      },
    },
    {
      titre_jeu: "Mario Kart 8 Deluxe",
      console: "Switch",
      usage: "Unlock a Legend of Zelda-themed Mii racing suit",
      games: { slug: "mario-kart-8-deluxe", consoles: { slug: "switch" } },
    },
  ],
};

describe("versAmiiboFiche", () => {
  const fiche = versAmiiboFiche(sidon);

  it("donne les trois régions : pas de ligne = pas sorti", () => {
    expect(fiche.sorties).toEqual({
      JAP: { sortie: true, date: "2025-06-05", precision: "jour" },
      US: { sortie: true, date: "2025-06-05", precision: "jour" },
      PAL: { sortie: false, date: null, precision: null },
    });
  });

  it("garde les chemins de la figurine et de la boîte", () => {
    expect(fiche.image).toBe(`${ID}/figurine-mwwkmxti`);
    expect(fiche.boite).toBe(`${ID}/boite-mwwkmxti`);
  });

  it("met d'abord les jeux du catalogue, avec un lien, puis les autres sans lien", () => {
    expect(fiche.jeux.map((j) => [j.titre, j.fiche])).toEqual([
      ["Mario Kart 8 Deluxe", "/jeux/switch/mario-kart-8-deluxe"],
      [
        "The Legend of Zelda: Tears of the Kingdom",
        "/jeux/switch/the-legend-of-zelda-tears-of-the-kingdom",
      ],
      ["Conga Master Party!", null],
    ]);
  });

  it("n'a pas d'image sans chemin, ni avec un chemin d'une autre forme", () => {
    const sans = versAmiiboFiche({
      ...sidon,
      image_path: null,
      boite_path: "../jaquettes/x",
    });
    expect(sans.image).toBeNull();
    expect(sans.boite).toBeNull();
  });
});

describe("images", () => {
  it("refuse un chemin qui sortirait du dossier de l'amiibo", () => {
    expect(baseImageValide(`${ID}/../x`)).toBeNull();
    expect(baseImageValide(`${ID}/photo-abc`)).toBeNull();
  });

  it("construit les adresses 300 et 600 du bucket public", () => {
    expect(srcsetAmiibo(`${ID}/figurine-mwwkmxti`, BASE_URL)).toBe(
      `https://exemple.supabase.co/storage/v1/object/public/amiibo/${ID}/figurine-mwwkmxti-300.webp 300w, ` +
        `https://exemple.supabase.co/storage/v1/object/public/amiibo/${ID}/figurine-mwwkmxti-600.webp 600w`,
    );
  });
});

describe("regionAmiiboParDefaut", () => {
  const { sorties } = versAmiiboFiche(sidon);

  it("ouvre le marché choisi s'il y est sorti", () => {
    expect(regionAmiiboParDefaut(sorties, "JAP")).toBe("JAP");
  });

  it("sinon la première région sortie : PAL, US, puis JAP", () => {
    expect(regionAmiiboParDefaut(sorties, "PAL")).toBe("US");
    expect(regionAmiiboParDefaut(sorties, "TOUS")).toBe("US");
  });

  it("PAL quand il n'est sorti nulle part", () => {
    const aucune = versAmiiboFiche({ ...sidon, amiibo_sorties: [] }).sorties;
    expect(regionAmiiboParDefaut(aucune, "JAP")).toBe("PAL");
  });
});

describe("libelleSortieAmiibo", () => {
  const jour = "2026-11-26";
  it("écrit la date selon sa précision, ou l'absence de sortie", () => {
    const l = (
      date: string | null,
      precision: Parameters<typeof libelleSortieAmiibo>[0]["precision"],
      sortie = true,
    ) => libelleSortieAmiibo({ sortie, date, precision }, jour);
    expect(l("2025-06-05", "jour")).toBe("Sorti le 5 juin 2025");
    expect(l("2014-12-01", "mois")).toBe("Sorti en décembre 2014");
    expect(l("2027-03-01", "saison")).toBe("Sortie prévue : Printemps 2027");
    expect(l(null, "inconnue")).toBe("Date de sortie à venir");
    expect(l(null, null, false)).toBe("Non sorti dans cette région");
  });
});

describe("adresse et identifiant", () => {
  it("accepte seulement un slug de la forme de la base", () => {
    expect(cheminAmiibo("sidon")).toBe("/amiibo/sidon");
    expect(estSlugAmiibo("mario-super-mario-bros")).toBe(true);
    expect(estSlugAmiibo("Sidon")).toBe(false);
    expect(estSlugAmiibo("a--b")).toBe(false);
  });

  it("écrit l'identifiant AmiiboAPI en deux blocs majuscules, laisse les autres tels quels", () => {
    expect(identifiantLisible("010a000004a40902")).toBe("010A0000 04A40902");
    expect(identifiantLisible("us:pikmin-4")).toBe("us:pikmin-4");
  });
});

describe("référencement", () => {
  const fiche = versAmiiboFiche(sidon);

  it("donne titre, description et adresse canonique", () => {
    const m = metadonneesAmiibo(fiche, BASE_URL);
    expect(m.title).toBe("Sidon · Amiibo · Nintendo DB");
    expect(m.description).toBe(
      "Amiibo Sidon (figurine, série Legend Of Zelda) : dates de sortie au Japon, en Amérique du Nord et en Europe, et 3 jeux compatibles.",
    );
    expect(m.alternates?.canonical).toBe("/amiibo/sidon");
  });

  it("décrit un Product avec la première sortie et les jeux du catalogue seulement", () => {
    const d = donneesAmiibo(fiche, BASE_URL);
    expect(d).toMatchObject({
      "@type": "Product",
      name: "amiibo Sidon",
      url: "https://nintendo-db.vercel.app/amiibo/sidon",
      releaseDate: "2025-06-05",
      image: `https://exemple.supabase.co/storage/v1/object/public/amiibo/${ID}/figurine-mwwkmxti-600.webp`,
    });
    expect(d.isRelatedTo).toHaveLength(2);
  });
});

describe("versAmiiboDuJeu", () => {
  const amiibo = (slug: string, nom: string, dates: (string | null)[]) => ({
    amiibo: {
      slug,
      nom,
      image_path: `${ID}/figurine-abc`,
      amiibo_sorties: dates.map((date_sortie) => ({ date_sortie })),
    },
  });

  it("classe par première sortie puis par nom, sans doublon, sans date à la fin", () => {
    const liste = versAmiiboDuJeu([
      amiibo("tulin", "Tulin", ["2025-06-05"]),
      amiibo("sans-date", "Sans date", [null]),
      amiibo("sidon", "Sidon", ["2025-07-01", "2025-06-05"]),
      amiibo("tulin", "Tulin", ["2025-06-05"]),
      { amiibo: null },
      amiibo("link", "Link", ["2017-03-03"]),
    ]);
    expect(liste.map((a) => a.slug)).toEqual([
      "link",
      "sidon",
      "tulin",
      "sans-date",
    ]);
    expect(liste[0]?.image).toBe(`${ID}/figurine-abc`);
  });
});
