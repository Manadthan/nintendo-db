import { describe, expect, it } from "vitest";
import type { AmiiboCatalogue } from "@/lib/amiibo/catalogue";
import type { JeuCatalogue } from "@/lib/catalogue/types";
import { ensemble } from "@/lib/collection/collection";
import type { GuideCatalogue } from "@/lib/guides/catalogue";
import { calculerSuivi, verifierJetonSuivi } from "./suivi";

const BASE_SUPABASE = "https://exemple.supabase.co";
const ID_SPLATOON = "00000000-0000-0000-0000-000000000001";
const ID_MK8 = "00000000-0000-0000-0000-000000000002";
const ID_ZELDA = "00000000-0000-0000-0000-000000000003";
const ID_GUIDE = "00000000-0000-0000-0000-000000000010";
const ID_AMIIBO = "00000000-0000-0000-0000-000000000020";

const CONSOLES = [
  { slug: "wii-u", nom: "Wii U" },
  { slug: "switch", nom: "Switch" },
];

const JEUX: JeuCatalogue[] = [
  {
    id: ID_SPLATOON,
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
        titre: "スプラトゥーン",
        titreRomanise: "Splatoon",
        date: "2015-05-28",
        precision: "jour",
        jaquette: `${ID_SPLATOON}/jap-a1`,
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
        jaquette: `${ID_SPLATOON}/pal-v1`,
      },
    },
  },
  {
    id: ID_MK8,
    slug: "mario-kart-8",
    console: { slug: "wii-u", nom: "Wii U" },
    developpeur: "Nintendo EAD",
    editeur: "Nintendo",
    genres: ["Course"],
    series: ["Mario"],
    metacritic: 88,
    sorties: {
      JAP: {
        sortie: true,
        titre: "マリオカート8",
        titreRomanise: "Mario Kart 8",
        date: "2014-05-29",
        precision: "jour",
        jaquette: null,
      },
      US: {
        sortie: true,
        titre: "Mario Kart 8",
        titreRomanise: null,
        date: "2014-05-30",
        precision: "jour",
        jaquette: null,
      },
      PAL: {
        sortie: true,
        titre: "Mario Kart 8",
        titreRomanise: null,
        date: "2014-05-30",
        precision: "jour",
        jaquette: null,
      },
    },
  },
  {
    id: ID_ZELDA,
    slug: "zelda-totk",
    console: { slug: "switch", nom: "Switch" },
    developpeur: "Nintendo EPD",
    editeur: "Nintendo",
    genres: ["Aventure"],
    series: ["Zelda"],
    metacritic: 96,
    sorties: {
      JAP: {
        sortie: true,
        titre: "ゼルダの伝説",
        titreRomanise: "Zelda",
        date: "2023-05-12",
        precision: "jour",
        jaquette: null,
      },
      US: {
        sortie: false,
        titre: null,
        titreRomanise: null,
        date: null,
        precision: null,
        jaquette: null,
      },
      PAL: {
        sortie: true,
        titre: "The Legend of Zelda: Tears of the Kingdom",
        titreRomanise: null,
        date: "2023-05-12",
        precision: "jour",
        jaquette: `${ID_ZELDA}/pal-b2`,
      },
    },
  },
];

const GUIDES: GuideCatalogue[] = [
  {
    id: ID_GUIDE,
    isbn: "9784047336926",
    titre: "スプラトゥーン パーフェクトガイド",
    editeur: "KADOKAWA",
    date: "2015-07-01",
    precision: "mois",
    couverture: { source: "amazon", chemin: "9784047336926-1.webp" },
    jeux: [ID_SPLATOON],
  },
];

const AMIIBO: AmiiboCatalogue[] = [
  {
    id: ID_AMIIBO,
    slug: "inkling-girl",
    nom: "Inkling Girl",
    nomJap: "ガール",
    type: "figurine",
    serieAmiibo: "Splatoon",
    series: ["Splatoon"],
    image: `${ID_AMIIBO}/figurine-a1`,
    sorties: { PAL: { date: "2015-05-29", precision: "jour" } },
    consoles: ["wii-u"],
  },
];

describe("verifierJetonSuivi", () => {
  it("accepte uniquement le jeton Bearer exact", () => {
    expect(verifierJetonSuivi("Bearer secret-123", "secret-123")).toBe(true);
    expect(verifierJetonSuivi("bearer secret-123", "secret-123")).toBe(true);
    expect(verifierJetonSuivi("Bearer mauvais", "secret-123")).toBe(false);
    expect(verifierJetonSuivi("Bearer secret-12", "secret-123")).toBe(false);
    expect(verifierJetonSuivi("Basic secret-123", "secret-123")).toBe(false);
    expect(verifierJetonSuivi(null, "secret-123")).toBe(false);
    expect(verifierJetonSuivi("Bearer secret-123", "")).toBe(false);
    expect(verifierJetonSuivi("Bearer secret-123", undefined)).toBe(false);
  });
});

describe("calculerSuivi", () => {
  const possessions = ensemble(
    [
      { game_id: ID_SPLATOON, region: "PAL" },
      { game_id: ID_MK8, region: "JAP" },
    ],
    [{ amiibo_id: ID_AMIIBO }],
    [{ guide_id: ID_GUIDE }],
  );

  it("calcule possédés, total, couverture, titre et retire ?collection=", () => {
    const res = calculerSuivi({
      search: "?console=wii-u&marche=pal&collection=manquants",
      jeux: JEUX,
      consoles: CONSOLES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });

    // MK8 n'a pas de jaquette : masqué par défaut (SPEC v1.55), inclus avec ?sans-image=1.
    expect(res).toEqual({
      source: "nintendo-db",
      owned: 1,
      total: 1,
      coverUrl: `${BASE_SUPABASE}/storage/v1/object/public/jaquettes/${ID_SPLATOON}/pal-v1-300.webp`,
      suggestedTitle: "Wii U · Europe",
      url: "https://nintendo-db.vercel.app/?console=wii-u&marche=pal",
    });

    const avecSansImage = calculerSuivi({
      search: "?console=wii-u&marche=pal&sans-image=1",
      jeux: JEUX,
      consoles: CONSOLES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(avecSansImage.owned).toBe(1);
    expect(avecSansImage.total).toBe(2);
    expect(avecSansImage.url).toBe(
      "https://nintendo-db.vercel.app/?console=wii-u&marche=pal&sans-image=1",
    );
  });

  it("prend en compte les guides possédés et leur couverture quand ?voir=guides", () => {
    const res = calculerSuivi({
      search: "?voir=guides&console=wii-u",
      jeux: JEUX,
      consoles: CONSOLES,
      guides: GUIDES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });

    expect(res).toEqual({
      source: "nintendo-db",
      owned: 1,
      total: 1,
      coverUrl: `${BASE_SUPABASE}/storage/v1/object/public/guides/9784047336926-1.webp`,
      suggestedTitle: "Guides · Wii U",
      url: "https://nintendo-db.vercel.app/?voir=guides&console=wii-u",
    });
  });

  it("prend en compte les amiibo possédés et leur image quand ?voir=amiibo", () => {
    const res = calculerSuivi({
      search: "?voir=amiibo&marche=pal",
      jeux: JEUX,
      consoles: CONSOLES,
      amiibo: AMIIBO,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });

    expect(res).toEqual({
      source: "nintendo-db",
      owned: 1,
      total: 1,
      coverUrl: `${BASE_SUPABASE}/storage/v1/object/public/amiibo/${ID_AMIIBO}/figurine-a1-300.webp`,
      suggestedTitle: "Amiibo · Europe",
      url: "https://nintendo-db.vercel.app/?voir=amiibo&marche=pal",
    });
  });

  it("applique ?type= uniquement quand ?voir=amiibo est actif et l'inclut dans le titre", () => {
    const figurines = calculerSuivi({
      search: "?voir=amiibo&type=figurine",
      jeux: JEUX,
      consoles: CONSOLES,
      amiibo: AMIIBO,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(figurines.owned).toBe(1);
    expect(figurines.total).toBe(1);
    expect(figurines.suggestedTitle).toBe("Amiibo · Figurine");

    const cartes = calculerSuivi({
      search: "?voir=jeux,amiibo&type=carte",
      jeux: JEUX,
      consoles: CONSOLES,
      amiibo: AMIIBO,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(cartes.owned).toBe(0);
    expect(cartes.total).toBe(0);

    // Sans « Amiibo » coché, ?type= est ignoré comme dans le catalogue.
    const sansAmiibo = calculerSuivi({
      search: "?type=figurine",
      jeux: JEUX,
      consoles: CONSOLES,
      amiibo: AMIIBO,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(sansAmiibo.total).toBe(2);
    expect(sansAmiibo.suggestedTitle).toBe("Nintendo DB");
  });

  it("masque par défaut les jeux à venir et les inclut avec ?avenir=1 (SPEC v1.55)", () => {
    const ID_FUTUR = "00000000-0000-0000-0000-000000000004";
    const futur: JeuCatalogue = {
      ...JEUX[2]!,
      id: ID_FUTUR,
      slug: "metroid-futur",
      sorties: {
        JAP: {
          sortie: false,
          titre: null,
          titreRomanise: null,
          date: null,
          precision: null,
          jaquette: null,
        },
        US: {
          sortie: false,
          titre: null,
          titreRomanise: null,
          date: null,
          precision: null,
          jaquette: null,
        },
        PAL: {
          sortie: true,
          titre: "Metroid Futur",
          titreRomanise: null,
          date: "2027-06-01",
          precision: "jour",
          jaquette: `${ID_FUTUR}/pal-1`,
        },
      },
    };
    const jeux = [...JEUX, futur];
    const parDefaut = calculerSuivi({
      search: "?console=switch",
      jeux,
      consoles: CONSOLES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(parDefaut.total).toBe(1);

    const avecAVenir = calculerSuivi({
      search: "?console=switch&avenir=1",
      jeux,
      consoles: CONSOLES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(avecAVenir.total).toBe(2);
    expect(avecAVenir.url).toBe(
      "https://nintendo-db.vercel.app/?console=switch&avenir=1",
    );
  });

  it("retombe sur « Nintendo DB » sans filtre et gère l'absence de résultat", () => {
    const sansFiltre = calculerSuivi({
      search: "",
      jeux: JEUX,
      consoles: CONSOLES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(sansFiltre.suggestedTitle).toBe("Nintendo DB");
    expect(sansFiltre.owned).toBe(1);
    expect(sansFiltre.total).toBe(2);
    expect(sansFiltre.url).toBe("https://nintendo-db.vercel.app/");

    const vide = calculerSuivi({
      search: "?q=inexistant",
      jeux: JEUX,
      consoles: CONSOLES,
      possessions,
      baseUrlSupabase: BASE_SUPABASE,
      aujourdhui: "2026-11-28",
    });
    expect(vide.owned).toBe(0);
    expect(vide.total).toBe(0);
    expect(vide.coverUrl).toBeNull();
    expect(vide.suggestedTitle).toBe("inexistant");
  });
});
