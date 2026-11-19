import { describe, expect, it } from "vitest";
import { versJeuFiche, type LigneFiche } from "@/lib/fiche/fiche";
import {
  donneesStructurees,
  entreesSitemap,
  imageDuSrcset,
  jsonPourScript,
  metadonneesFiche,
  reglesRobots,
} from "./referencement";

const ID = "20000000-0000-0000-0000-000000000001";
const BASE = "https://exemple.supabase.co";
const JAQUETTE = `${BASE}/storage/v1/object/public/jaquettes/${ID}/pal-mi3x9k`;

const release = (
  region: "JAP" | "US" | "PAL",
  titre: string | null,
  date: string | null,
  extra = {},
) => ({
  region,
  sortie: date !== null,
  titre,
  titre_romanise: null,
  date_sortie: date,
  precision_date: date ? ("jour" as const) : null,
  editeur: date ? "Nintendo" : null,
  code_produit: null,
  jaquette_path: null,
  jaquette_source: null,
  ...extra,
});

const ligne: LigneFiche = {
  id: ID,
  slug: "wii-karaoke-u",
  developpeur: "Xing",
  franchise: null,
  genre: "Musique, Karaoké",
  wikipedia_url: null,
  metacritic_note: null,
  metacritic_url: null,
  consoles: { slug: "wii-u", nom: "Wii U" },
  releases: [
    release("JAP", "Wii カラオケ U", "2012-12-08"),
    release("US", null, null),
    release("PAL", "Wii Karaoke U", "2013-10-04", {
      jaquette_path: `${ID}/pal-mi3x9k`,
      jaquette_source: "gametdb",
    }),
  ],
};
const KARAOKE = versJeuFiche(ligne, BASE);

describe("plan du site et robots", () => {
  it("liste l'accueil, À propos et chaque fiche, en adresses absolues", () => {
    expect(
      entreesSitemap([{ console: "wii-u", jeu: "splatoon" }]).map((e) => e.url),
    ).toEqual([
      "https://nintendo-db.vercel.app/",
      "https://nintendo-db.vercel.app/a-propos",
      "https://nintendo-db.vercel.app/jeux/wii-u/splatoon",
    ]);
  });

  it("exclut l'administration et indique le plan du site", () => {
    expect(reglesRobots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/admin" },
      sitemap: "https://nintendo-db.vercel.app/sitemap.xml",
    });
  });
});

describe("imageDuSrcset", () => {
  it("donne l'adresse d'une largeur, ou null", () => {
    const srcset = KARAOKE.sorties.PAL.jaquetteSrcset;
    expect(imageDuSrcset(srcset, 600)).toBe(`${JAQUETTE}-600.webp`);
    expect(imageDuSrcset(srcset, 1200)).toBeNull();
    expect(imageDuSrcset(null, 600)).toBeNull();
  });
});

describe("metadonneesFiche", () => {
  const meta = metadonneesFiche(KARAOKE);

  it("titre, description et adresse canonique de la fiche", () => {
    expect(meta.title).toBe("Wii Karaoke U · Wii U · Nintendo DB");
    expect(meta.description).toContain("Wii Karaoke U sur Wii U");
    expect(meta.alternates?.canonical).toBe("/jeux/wii-u/wii-karaoke-u");
  });

  it("aperçu de partage avec la jaquette affichée par le catalogue (600 px)", () => {
    expect(meta.openGraph).toMatchObject({
      siteName: "Nintendo DB",
      locale: "fr_FR",
      url: "/jeux/wii-u/wii-karaoke-u",
      images: [
        {
          url: `${JAQUETTE}-600.webp`,
          alt: "Jaquette de Wii Karaoke U",
        },
      ],
    });
  });

  it("sans jaquette, pas d'image d'aperçu", () => {
    const sansJaquette = versJeuFiche(
      {
        ...ligne,
        releases: ligne.releases.map((r) => ({ ...r, jaquette_path: null })),
      },
      BASE,
    );
    expect(metadonneesFiche(sansJaquette).openGraph).not.toHaveProperty(
      "images",
    );
  });
});

describe("donneesStructurees (schema.org VideoGame)", () => {
  it("décrit le jeu : titres, console, éditeur, première sortie, genres, jaquette", () => {
    expect(donneesStructurees(KARAOKE)).toEqual({
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: "Wii Karaoke U",
      alternateName: ["Wii カラオケ U"],
      url: "https://nintendo-db.vercel.app/jeux/wii-u/wii-karaoke-u",
      gamePlatform: "Wii U",
      publisher: { "@type": "Organization", name: "Nintendo" },
      datePublished: "2012-12-08",
      genre: ["Musique", "Karaoké"],
      image: `${JAQUETTE}-768.webp`,
    });
  });

  it("garde une date imprécise telle quelle (année seule)", () => {
    const annee = versJeuFiche(
      {
        ...ligne,
        releases: [
          release("JAP", "Titre", "2014-01-01", { precision_date: "annee" }),
        ],
      },
      BASE,
    );
    expect(donneesStructurees(annee).datePublished).toBe("2014");
  });

  it("le JSON ne peut pas fermer la balise <script>", () => {
    expect(jsonPourScript({ name: "</script><b>" })).toBe(
      '{"name":"\\u003c/script>\\u003cb>"}',
    );
  });
});
