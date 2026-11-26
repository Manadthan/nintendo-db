import { describe, expect, it } from "vitest";
import type { LigneJeu } from "@/lib/catalogue/lignes";
import {
  consolesDuGuide,
  donneesGuide,
  estIsbn13,
  libelleParution,
  metadonneesGuide,
  versGuidePage,
  type LigneGuide,
} from "./page";

// Page du guide (US-27, ADR-19 point 5) : ligne écrite à la main d'après la planche Switch de l'étude (§1 septdecies).

const jeu = (
  slug: string,
  consoleSlug: string,
  nom: string,
  titre: string,
  date: string,
): LigneJeu => ({
  id: slug,
  slug,
  developpeur: null,
  genre: null,
  series: [],
  metacritic_note: null,
  consoles: { slug: consoleSlug, nom },
  releases: [
    {
      region: "PAL",
      sortie: true,
      titre,
      titre_romanise: null,
      date_sortie: date,
      precision_date: "jour",
      editeur: "Nintendo",
      jaquette_path: null,
    },
  ],
});

const PIKMIN: LigneGuide = {
  isbn: "9784047336926",
  titre: "PIKMIN4パーフェクトガイド",
  editeur: "KADOKAWA Game Linkage",
  date_parution: "2023-11-01",
  precision_date: "mois",
  pages: 367,
  couverture: null,
  google_books_id: "abcDEF12345_",
  ndl_url: "https://ndlsearch.ndl.go.jp/books/R100000002-I000000000001",
  guides_jeux: [
    { games: jeu("pikmin-4", "switch", "Switch", "Pikmin 4", "2023-07-21") },
  ],
};

describe("page du guide", () => {
  it("n'accepte dans l'adresse qu'un ISBN à 13 chiffres", () => {
    expect(estIsbn13("9784047336926")).toBe(true);
    expect(estIsbn13("4047336923")).toBe(false);
    expect(estIsbn13("978404733692x")).toBe(false);
  });

  it("montre le jeu couvert avec son titre, sa console et son année", () => {
    const guide = versGuidePage(PIKMIN);
    expect(guide.jeux).toEqual([
      expect.objectContaining({
        slug: "pikmin-4",
        console: { slug: "switch", nom: "Switch" },
        titre: "Pikmin 4",
        annee: "2023",
      }),
    ]);
    expect(libelleParution(guide)).toBe("Paru en novembre 2023");
  });

  it("un guide de plusieurs jeux les classe par titre, consoles sans doublon", () => {
    const guide = versGuidePage({
      ...PIKMIN,
      guides_jeux: [
        {
          games: jeu(
            "b",
            "3ds",
            "3DS",
            "Fire Emblem Fates: Conquest",
            "2016-05-20",
          ),
        },
        {
          games: jeu(
            "a",
            "3ds",
            "3DS",
            "Fire Emblem Fates: Birthright",
            "2016-05-20",
          ),
        },
        { games: null },
      ],
    });
    expect(guide.jeux.map((j) => j.slug)).toEqual(["a", "b"]);
    expect(consolesDuGuide(guide)).toEqual([{ slug: "3ds", nom: "3DS" }]);
  });

  it("donne aux moteurs un livre schema.org avec ISBN, date au mois et jeux couverts", () => {
    const guide = versGuidePage(PIKMIN);
    expect(donneesGuide(guide)).toEqual({
      "@context": "https://schema.org",
      "@type": "Book",
      name: "PIKMIN4パーフェクトガイド",
      isbn: "9784047336926",
      inLanguage: "ja",
      url: "https://nintendo-db.vercel.app/guides/9784047336926",
      publisher: { "@type": "Organization", name: "KADOKAWA Game Linkage" },
      datePublished: "2023-11",
      numberOfPages: 367,
      image:
        "https://books.google.com/books/content?id=abcDEF12345_&printsec=frontcover&img=1&zoom=1&fife=w800-h1200",
      about: [
        {
          "@type": "VideoGame",
          name: "Pikmin 4",
          gamePlatform: "Switch",
          url: "https://nintendo-db.vercel.app/jeux/switch/pikmin-4",
        },
      ],
    });
    const meta = metadonneesGuide(guide);
    expect(meta.title).toBe("PIKMIN4パーフェクトガイド · Guide · Nintendo DB");
    expect(meta.alternates?.canonical).toBe("/guides/9784047336926");
    expect(meta.description).toContain("Pikmin 4 (Switch)");
  });

  it("sans date, couverture ni pages : rien d'inventé", () => {
    const guide = versGuidePage({
      ...PIKMIN,
      date_parution: null,
      precision_date: null,
      pages: null,
      google_books_id: null,
    });
    expect(libelleParution(guide)).toBe("Date de parution inconnue");
    const donnees = donneesGuide(guide);
    expect(donnees).not.toHaveProperty("datePublished");
    expect(donnees).not.toHaveProperty("image");
    expect(donnees).not.toHaveProperty("numberOfPages");
    expect(metadonneesGuide(guide).openGraph).not.toHaveProperty("images");
  });

  it("la copie Amazon passe avant Google Books pour l'image (ADR-19 point 2 révisé)", () => {
    const guide = versGuidePage({
      ...PIKMIN,
      couverture: "9784047336926-1.webp",
    });
    expect(guide.couverture).toEqual({
      source: "amazon",
      chemin: "9784047336926-1.webp",
    });
    expect(guide.googleBooksId).toBe("abcDEF12345_");
  });
});
