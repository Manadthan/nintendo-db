import { describe, expect, it } from "vitest";
import type { PrecisionDate } from "@/lib/catalogue/types";
import type { Annonce } from "./annonces";
import {
  apercuAnnonces,
  cleAnnonce,
  regrouperAnnonces,
  type JeuCatalogue,
} from "./import-annonces";

// Annonces du 25/11/2026 (gametdb/annonces.json), Europe en anglais, écrites à la main.
const a = (
  region: Annonce["region"],
  titre: string,
  date: string | null,
  precision: Annonce["precision"],
  extra: Partial<Annonce> = {},
): Annonce => ({
  region,
  console: "switch-2",
  titre,
  date,
  precision,
  image: null,
  physique: null,
  idSource: `${region}-${titre}`,
  ...extra,
});

const METROID_JAP = a("JAP", "メトロイド ラヴェナス", "2027-01-28", "jour");
const METROID_PAL = a("PAL", "Metroid Ravenous", "2027-01-28", "jour");
const METROID_US = a("US", "Metroid Ravenous", "2027-01-28", "jour", {
  physique: true,
  image: "https://assets.nintendo.com/image/upload/f_png/q_auto/boite",
});
const GENESIS_JAP = a(
  "JAP",
  "Xenoblade Genesis（ゼノブレイド ジェネシス）",
  "2027-01-01",
  "annee",
);
const GENESIS_PAL = a("PAL", "Xenoblade Genesis", "2027-01-01", "annee");
const KIRBY_JAP = a(
  "JAP",
  "星のカービィ ワールドビヨンド",
  "2027-03-01",
  "saison",
);
const KIRBY_PAL = a("PAL", "Kirby and the World Beyond", "2027-01-01", "annee");
const WINDS_JAP = a(
  "JAP",
  "ポケットモンスター ウインド",
  "2027-01-01",
  "annee",
);
const WINDS_PAL = a("PAL", "Pokémon Winds", "2027-01-01", "annee");
const WAVES_PAL = a("PAL", "Pokémon Waves", "2027-01-01", "annee");

const titres = (jeux: ReturnType<typeof regrouperAnnonces>) =>
  jeux.map((j) => Object.keys(j.regions).sort().join("+") + " " + j.titre);

describe("regrouperAnnonces (US-33) : les régions d'un même jeu", () => {
  it("Europe et US au titre identique ; Japon au même jour ou au titre anglais cité", () => {
    const jeux = regrouperAnnonces([
      METROID_JAP,
      METROID_PAL,
      METROID_US,
      GENESIS_JAP,
      GENESIS_PAL,
    ]);
    expect(titres(jeux)).toEqual([
      "JAP+PAL+US Metroid Ravenous",
      "JAP+PAL Xenoblade Genesis",
    ]);
  });

  it("Japon sans indice : jeu à part, avec les jeux qu'il peut rejoindre", () => {
    const jeux = regrouperAnnonces([
      KIRBY_JAP,
      KIRBY_PAL,
      WINDS_PAL,
      WAVES_PAL,
    ]);
    expect(titres(jeux)).toEqual([
      "PAL Kirby and the World Beyond",
      "PAL Pokémon Waves",
      "PAL Pokémon Winds",
      "JAP 星のカービィ ワールドビヨンド",
    ]);
    const japon = jeux.find((j) => j.regions.JAP)!;
    expect(japon.candidats.map((c) => c.titre)).toEqual([
      "Kirby and the World Beyond",
      "Pokémon Waves",
      "Pokémon Winds",
    ]);
  });

  it("le choix « même jeu que » du propriétaire relie le Japon", () => {
    const jeux = regrouperAnnonces(
      [KIRBY_JAP, KIRBY_PAL, WINDS_JAP, WINDS_PAL],
      {
        [cleAnnonce(KIRBY_JAP)]: cleAnnonce(KIRBY_PAL),
        [cleAnnonce(WINDS_JAP)]: cleAnnonce(WINDS_PAL),
      },
    );
    expect(titres(jeux)).toEqual([
      "JAP+PAL Kirby and the World Beyond",
      "JAP+PAL Pokémon Winds",
    ]);
  });

  it("deux jeux le même jour : pas de rapprochement deviné", () => {
    const autre = a("PAL", "Autre jeu", "2027-01-28", "jour");
    const jeux = regrouperAnnonces([METROID_JAP, METROID_PAL, autre]);
    expect(jeux.filter((j) => j.regions.JAP && !j.regions.PAL)).toHaveLength(1);
  });

  it("jamais deux consoles dans un même jeu", () => {
    const switch1 = { ...METROID_US, console: "switch" as const };
    expect(regrouperAnnonces([METROID_PAL, switch1])).toHaveLength(2);
  });
});

const sortie = (
  titre: string,
  date: string | null,
  precision: PrecisionDate | null,
  verrous: string[] = [],
) => ({
  sortie: true,
  titre,
  date_sortie: date,
  precision_date: precision,
  verrous,
});

describe("apercuAnnonces (US-33) : nouveau, modifié, inchangé, écarté", () => {
  const KIRBY_EN_BASE: JeuCatalogue = {
    id: "g1",
    slug: "kirby-and-the-world-beyond",
    console: "switch-2",
    sorties: {
      PAL: sortie("Kirby and the World Beyond", "2027-01-01", "annee"),
    },
  };

  it("nouveau jeu : adresse du titre PAL, sorties annoncées, boîte US seule en jaquette", () => {
    const [ligne] = apercuAnnonces(
      regrouperAnnonces([METROID_JAP, METROID_PAL, METROID_US]),
      [],
      new Set(),
    );
    expect(ligne).toMatchObject({
      etat: "nouveau",
      slug: "metroid-ravenous",
      gameId: null,
      jaquettes: { US: METROID_US.image },
    });
    expect(ligne!.sorties.JAP).toEqual({
      sortie: true,
      titre: "メトロイド ラヴェナス",
      date_sortie: "2027-01-28",
      precision_date: "jour",
    });
  });

  it("jeu déjà au catalogue (même titre) : seule la date qui change, la région nouvelle", () => {
    const [ligne] = apercuAnnonces(
      regrouperAnnonces([KIRBY_JAP, KIRBY_PAL], {
        [cleAnnonce(KIRBY_JAP)]: cleAnnonce(KIRBY_PAL),
      }),
      [{ ...KIRBY_EN_BASE }],
      new Set(),
    );
    expect(ligne).toMatchObject({
      etat: "modifie",
      gameId: "g1",
      slug: "kirby-and-the-world-beyond",
      changements: ["JAP ajoutée"],
    });
    expect(ligne!.sorties.PAL).toBeUndefined();
  });

  it("une version japonaise déjà importée retrouve son jeu par son titre japonais (choix retenu)", () => {
    const enBase: JeuCatalogue = {
      ...KIRBY_EN_BASE,
      sorties: {
        ...KIRBY_EN_BASE.sorties,
        JAP: sortie("星のカービィ ワールドビヨンド", "2027-03-01", "saison"),
      },
    };
    const [ligne] = apercuAnnonces(
      regrouperAnnonces([KIRBY_JAP]),
      [enBase],
      new Set(),
    );
    expect(ligne).toMatchObject({ etat: "inchange", gameId: "g1" });
  });

  it("date précisée : modifiée ; date verrouillée (corrigée à la main) : jamais écrasée", () => {
    const precise = a(
      "PAL",
      "Kirby and the World Beyond",
      "2027-04-15",
      "jour",
    );
    const [modifie] = apercuAnnonces(
      regrouperAnnonces([precise]),
      [KIRBY_EN_BASE],
      new Set(),
    );
    expect(modifie).toMatchObject({
      etat: "modifie",
      changements: ["PAL date"],
    });
    expect(modifie!.sorties.PAL).toEqual({
      date_sortie: "2027-04-15",
      precision_date: "jour",
    });

    const verrouille: JeuCatalogue = {
      ...KIRBY_EN_BASE,
      sorties: {
        PAL: sortie("Kirby and the World Beyond", "2027-03-01", "mois", [
          "date_sortie",
          "precision_date",
        ]),
      },
    };
    const [garde] = apercuAnnonces(
      regrouperAnnonces([precise]),
      [verrouille],
      new Set(),
    );
    expect(garde).toMatchObject({ etat: "inchange", changements: [] });
  });

  it("jeu décoché « en boîte » à un import précédent : écarté avec la raison", () => {
    const [ligne] = apercuAnnonces(
      regrouperAnnonces([WINDS_PAL]),
      [],
      new Set(["switch-2|pokemon-winds"]),
    );
    expect(ligne).toMatchObject({
      etat: "ecarte",
      raison: "décoché « en boîte » à un import précédent",
    });
  });

  it("Japon seul : adresse tirée du titre japonais impossible → identifiant de Nintendo Japon", () => {
    const [ligne] = apercuAnnonces(
      regrouperAnnonces([{ ...WINDS_JAP, idSource: "70010000099999" }]),
      [],
      new Set(),
    );
    expect(ligne!.slug).toBe("jap-70010000099999");
  });

  it("adresse déjà prise sur la console : suffixe « -2 »", () => {
    const [ligne] = apercuAnnonces(
      regrouperAnnonces([GENESIS_PAL]),
      [{ id: "g9", slug: "xenoblade-genesis", console: "switch", sorties: {} }],
      new Set(),
    );
    expect(ligne!.slug).toBe("xenoblade-genesis");
    const [double] = apercuAnnonces(
      regrouperAnnonces([GENESIS_PAL]),
      [
        {
          id: "g9",
          slug: "xenoblade-genesis",
          console: "switch-2",
          sorties: { PAL: sortie("Autre titre", null, null) },
        },
      ],
      new Set(),
    );
    expect(double!.slug).toBe("xenoblade-genesis-2");
  });
});
