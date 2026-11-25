import { describe, expect, it } from "vitest";
import base from "./__fixtures__/amiiboapi-amiibo.json";
import jeuxApi from "./__fixtures__/amiiboapi-games_info.json";
import europe from "./__fixtures__/nintendo-eu-figures.json";
import japon from "./__fixtures__/nintendo-jp-amiibo.json";
import us from "./__fixtures__/nintendo-us-amiibo.json";
import {
  type Amiibo,
  type AmiiboApi,
  type JeuxApi,
  attribuerSlugs,
  completerAvecEurope,
  completerAvecJapon,
  completerAvecUs,
  editeurDeSerie,
  estCoffretDeCartes,
  imageNintendoUs,
  lireAmiiboApi,
  nomComparable,
  rattacherJeux,
  typeDepuisIdentifiant,
} from "./amiibo";

const api = lireAmiiboApi(base as AmiiboApi, jeuxApi as JeuxApi);
const trouver = (liste: readonly Amiibo[], nom: string, type?: string) =>
  liste.find((a) => a.nom === nom && (!type || a.type === type));
const date = (a: Amiibo | undefined, region: string) =>
  a?.sorties.find((s) => s.region === region);

describe("AmiiboAPI", () => {
  it("lit le type dans l'identifiant", () => {
    expect(typeDepuisIdentifiant("0x010a000004a40902")).toBe("figurine");
    expect(typeDepuisIdentifiant("0181000100440502")).toBe("carte");
    expect(typeDepuisIdentifiant("00800102035d0302")).toBe("peluche");
    expect(typeDepuisIdentifiant("00020003039dff02")).toBe("bracelet");
    expect(typeDepuisIdentifiant("0001000404401c02")).toBe("bloc");
    expect(typeDepuisIdentifiant("pas-un-identifiant")).toBeNull();
  });

  it("donne type, séries, personnage, dates et image", () => {
    const sidon = trouver(api, "Sidon");
    expect(sidon).toMatchObject({
      identifiant: "010a000004a40902",
      type: "figurine",
      serieAmiibo: "Legend Of Zelda",
      editeur: "Nintendo",
      origine: "amiiboapi",
    });
    expect(sidon?.image).toBe(
      "https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/images/icon_010a0000-04a40902.png",
    );
    expect(date(sidon, "PAL")).toEqual({
      region: "PAL",
      date: "2025-06-05",
      precision: "jour",
    });
  });

  it("ignore la date australienne et garde les régions sans date comme non sorties", () => {
    for (const a of api)
      expect(
        a.sorties.every((s) => ["JAP", "US", "PAL"].includes(s.region)),
      ).toBe(true);
  });

  it("donne les jeux compatibles par console, usage en anglais", () => {
    const jeux = trouver(api, "Sidon")?.jeux ?? [];
    expect(jeux.length).toBeGreaterThan(0);
    expect(jeux.some((j) => j.console === "Switch" && j.usage)).toBe(true);
    expect(
      jeux.every((j) => ["Switch", "Wii U", "3DS"].includes(j.console)),
    ).toBe(true);
  });

  it("donne l'éditeur des séries d'autres éditeurs", () => {
    expect(trouver(api, "Luke", "carte")?.editeur).toBe("Capcom");
    expect(editeurDeSerie("Yu-Gi-Oh!")).toBe("Konami");
    expect(editeurDeSerie("Shovel Knight")).toBe("Yacht Club Games");
    expect(editeurDeSerie("Super Smash Bros.")).toBe("Nintendo");
  });
});

describe("noms et slugs", () => {
  it("rapproche les noms écrits autrement d'une source à l'autre", () => {
    expect(nomComparable("Zelda and Loftwing")).toBe(
      nomComparable("Zelda & Loftwing"),
    );
    expect(nomComparable("Sylux - Metroid Prime™ 4: Beyond Series")).toBe(
      "sylux",
    );
  });

  it("donne un slug unique, avec la série en cas de doublon de nom", () => {
    const slugs = attribuerSlugs(api);
    expect(new Set(slugs.values()).size).toBe(api.length);
    expect(slugs.get("010a000004a40902")).toBe("sidon");
    expect(slugs.get("0181000100440502")).toBe("isabelle-animal-crossing");
    expect(slugs.get("01810000037d0002")).toBe("isabelle-super-smash-bros");
    for (const s of slugs.values())
      expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("départage par la fin de l'identifiant deux amiibo de même nom et même série", () => {
    const deux = [
      trouver(api, "Sidon")!,
      { ...trouver(api, "Sidon")!, identifiant: "010a000004a4ff02" },
    ];
    expect([...attribuerSlugs(deux).values()]).toEqual([
      "sidon-legend-of-zelda-0902",
      "sidon-legend-of-zelda-ff02",
    ]);
  });
});

describe("Nintendo US", () => {
  const avecUs = completerAvecUs(api, us);

  it("ajoute la boîte d'un amiibo déjà connu, sans le dupliquer", () => {
    expect(avecUs.filter((a) => a.nom === "Sidon")).toHaveLength(1);
    expect(trouver(avecUs, "Sidon")?.boite).toMatch(
      /^https:\/\/assets\.nintendo\.com\/image\/upload\/f_png,w_600\//,
    );
  });

  it("ajoute les amiibo de 2026 absents d'AmiiboAPI, avec leur date US", () => {
    const kirby = trouver(avecUs, "Sword Kirby & Dragoon");
    expect(kirby).toMatchObject({
      origine: "nintendo-us",
      type: "figurine",
      serieAmiibo: "Kirby Air Riders",
    });
    expect(kirby?.identifiant).toMatch(/^us:[a-z0-9-]{1,120}$/);
    expect(date(kirby, "US")).toEqual({
      region: "US",
      date: "2026-11-12",
      precision: "jour",
    });
  });

  it("garde l'année seule quand Nintendo US n'affiche que l'année", () => {
    expect(date(trouver(avecUs, "Young Zelda"), "US")).toEqual({
      region: "US",
      date: "2027-12-31",
      precision: "annee",
    });
  });

  it("retire la série ajoutée au nom et le ™", () => {
    expect(trouver(avecUs, "Sylux")).toBeDefined();
  });

  it("écarte les coffrets de cartes", () => {
    expect(estCoffretDeCartes("Animal Crossing Cards - Series 1")).toBe(true);
    expect(estCoffretDeCartes("STREET FIGHTER 6 amiibo Card Starter Set")).toBe(
      true,
    );
    expect(estCoffretDeCartes("Wolf Link")).toBe(false);
    expect(avecUs.some((a) => a.nom.includes("Cards"))).toBe(false);
  });

  it("encode les espaces des adresses Cloudinary", () => {
    expect(imageNintendoUs("amiibo/Kirby Air RIders/kirby")).toBe(
      "https://assets.nintendo.com/image/upload/f_png,w_600/amiibo/Kirby%20Air%20RIders/kirby",
    );
  });
});

describe("Nintendo Europe et Japon", () => {
  const tout = completerAvecJapon(
    completerAvecEurope(completerAvecUs(api, us), europe.response.docs),
    japon.result.items,
  );

  it("ajoute un amiibo vu seulement en Europe, éditeur repris du Japon", () => {
    const leon = trouver(tout, "Leon S. Kennedy");
    expect(leon).toMatchObject({ origine: "nintendo-eu", editeur: "Capcom" });
    expect(leon?.identifiant).toMatch(/^eu:[a-z0-9-]+$/);
    expect(date(leon, "PAL")).toEqual({
      region: "PAL",
      date: "2026-07-30",
      precision: "jour",
    });
  });

  it("ne remplace pas une date PAL d'AmiiboAPI", () => {
    expect(tout.filter((a) => a.nom === "Sidon")).toHaveLength(1);
    expect(
      trouver(tout, "Sidon")?.sorties.filter((s) => s.region === "PAL"),
    ).toHaveLength(1);
  });

  it("garde l'année seule quand Nintendo Europe n'affiche que l'année", () => {
    expect(
      date(trouver(tout, "Chef Kawasaki & Hop Star"), "PAL"),
    ).toMatchObject({ precision: "annee" });
  });

  it("rattache le Japon par le code de la figurine : nom et date JAP", () => {
    const leon = trouver(tout, "Leon S. Kennedy");
    expect(leon?.nomJap).toBe("レオン・S・ケネディ");
    expect(date(leon, "JAP")).toEqual({
      region: "JAP",
      date: "2026-07-30",
      precision: "jour",
    });
  });

  it("laisse sans date JAP deux amiibo de même série sortis le même jour", () => {
    const kirby = trouver(tout, "Sword Kirby & Dragoon");
    expect(kirby?.nomJap).toBeNull();
    expect(date(kirby, "JAP")).toBeUndefined();
  });

  it("donne la date JAP exacte quand l'Europe n'affiche que l'année", () => {
    const chef = trouver(tout, "Chef Kawasaki & Hop Star");
    expect(chef?.nomJap).toBe("コックカワサキ&ホップスター");
    expect(date(chef, "JAP")).toEqual({
      region: "JAP",
      date: "2026-09-03",
      precision: "jour",
    });
  });
});

describe("jeux compatibles", () => {
  const catalogue = [
    {
      id: "totk",
      console: "switch",
      titres: ["The Legend of Zelda: Tears of the Kingdom", "ゼルダの伝説"],
    },
    { id: "mk8", console: "wii-u", titres: ["Mario Kart 8"] },
  ];

  it("rattache un jeu au titre identique sur la bonne console", () => {
    const [jeu] = rattacherJeux(
      [
        {
          titre: "The Legend of Zelda: Tears of the Kingdom",
          console: "Switch",
          usage: null,
        },
      ],
      catalogue,
    );
    expect(jeu?.gameId).toBe("totk");
  });

  it("ignore « The », les accents et « ™ »", () => {
    const [jeu] = rattacherJeux(
      [
        {
          titre: "Legend of Zelda™: Tears of the Kingdom",
          console: "Switch",
          usage: null,
        },
      ],
      catalogue,
    );
    expect(jeu?.gameId).toBe("totk");
  });

  it("laisse sans lien un jeu d'une autre console ou absent du catalogue", () => {
    const jeux = rattacherJeux(
      [
        { titre: "Mario Kart 8", console: "Switch", usage: null },
        {
          titre: "Conga Master Party!",
          console: "Switch",
          usage: "Unlock a special costume",
        },
      ],
      catalogue,
    );
    expect(jeux.map((j) => j.gameId)).toEqual([null, null]);
    expect(jeux[1]?.usage).toBe("Unlock a special costume");
  });
});
