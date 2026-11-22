import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  enEuros,
  estPertinente,
  lienVentes,
  lireAnnonces,
  lireTauxBce,
  mediane,
  motsDuTitre,
  prixRegion,
  requete,
} from "./prix";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");
const browse = JSON.parse(fixture("browse-super-mario-galaxy-us.json"));
const taux = lireTauxBce(fixture("eurofxref-daily.xml"));

describe("lireTauxBce", () => {
  it("lit les taux du dollar et de la livre, l'euro vaut 1", () => {
    expect(taux).toEqual({ EUR: 1, USD: 1.08, GBP: 0.85 });
  });

  it("renvoie l'euro seul pour un document illisible", () => {
    expect(lireTauxBce("<html>erreur</html>")).toEqual({ EUR: 1 });
  });
});

describe("enEuros", () => {
  it("convertit dollars et livres, garde les euros", () => {
    expect(enEuros(10.8, "USD", taux)).toBeCloseTo(10);
    expect(enEuros(8.5, "GBP", taux)).toBeCloseTo(10);
    expect(enEuros(12, "EUR", taux)).toBe(12);
  });

  it("renvoie null pour une devise sans taux", () => {
    expect(enEuros(1000, "JPY", taux)).toBeNull();
  });
});

describe("mediane", () => {
  it("prend la valeur du milieu, ou la moyenne des deux du milieu", () => {
    expect(mediane([3, 1, 2])).toBe(2);
    expect(mediane([4, 1, 3, 2])).toBe(2.5);
  });

  it("n'est pas tirée par un prix extrême (annonce scellée à 6 000 $)", () => {
    expect(mediane([20, 22, 25, 6000, 18])).toBe(22);
  });

  it("renvoie null sans valeur", () => {
    expect(mediane([])).toBeNull();
  });
});

describe("lireAnnonces", () => {
  it("garde titre, prix et devise, ignore une annonce sans prix", () => {
    const annonces = lireAnnonces(browse);
    expect(annonces).toHaveLength(12);
    expect(annonces[0]).toEqual({
      titre: "Super Mario Galaxy (Nintendo Wii, 2007) CIB Complete w/ Manual",
      prix: 19.47,
      devise: "USD",
    });
  });

  it("renvoie une liste vide pour une réponse sans annonces", () => {
    expect(lireAnnonces({ total: 0 })).toEqual([]);
    expect(lireAnnonces(null)).toEqual([]);
  });
});

describe("motsDuTitre", () => {
  it("garde les mots de plus de 2 lettres et ceux avec un chiffre", () => {
    expect(motsDuTitre("The Legend of Zelda: Ocarina of Time 3D")).toEqual([
      "the",
      "legend",
      "zelda",
      "ocarina",
      "time",
      "3d",
    ]);
    expect(motsDuTitre("Pokémon Stadium 2")).toEqual([
      "pokemon",
      "stadium",
      "2",
    ]);
  });
});

describe("estPertinente", () => {
  const titre = "Super Mario Galaxy";

  it("accepte le jeu, complet ou seul, neuf ou d'occasion", () => {
    expect(
      estPertinente(
        "Super Mario Galaxy (Nintendo Wii, 2007) CIB Complete w/ Manual",
        titre,
        "US",
      ),
    ).toBe(true);
    expect(
      estPertinente(
        "Super Mario Galaxy Nintendo Wii Disc Only Tested",
        titre,
        "US",
      ),
    ).toBe(true);
    expect(
      estPertinente("Super Mario Galaxy Wii Brand New Sealed", titre, "US"),
    ).toBe(true);
  });

  it("écarte une suite absente du titre, mais garde la suite cherchée", () => {
    expect(
      estPertinente("Super Mario Galaxy 2 Nintendo Wii Complete", titre, "US"),
    ).toBe(false);
    expect(
      estPertinente(
        "Super Mario Galaxy 2 Nintendo Wii Complete",
        "Super Mario Galaxy 2",
        "US",
      ),
    ).toBe(true);
  });

  it("écarte le manuel vendu seul, mais garde le jeu complet avec son manuel", () => {
    expect(
      estPertinente("Super Mario Galaxy Wii Manual Only", titre, "US"),
    ).toBe(false);
    expect(
      estPertinente("Super Mario Galaxy Wii CIB w/ Manual", titre, "US"),
    ).toBe(true);
  });

  it("écarte les lots, guides et boîtes vides", () => {
    expect(
      estPertinente(
        "Wii Game Lot Super Mario Galaxy Mario Kart Wii Sports",
        titre,
        "US",
      ),
    ).toBe(false);
    expect(
      estPertinente(
        "Super Mario Galaxy Prima Official Game Guide Wii",
        titre,
        "US",
      ),
    ).toBe(false);
    expect(
      estPertinente(
        "Super Mario Galaxy Nintendo Wii Case Only No Game",
        titre,
        "US",
      ),
    ).toBe(false);
  });

  it("écarte une annonce à laquelle il manque un mot du titre", () => {
    expect(estPertinente("Mario Galaxy Wii", titre, "US")).toBe(false);
  });

  it("JAP : exige une mention du Japon", () => {
    expect(
      estPertinente(
        "Super Mario Galaxy Wii Japanese Import NTSC-J",
        titre,
        "JAP",
      ),
    ).toBe(true);
    expect(
      estPertinente("Super Mario Galaxy Nintendo Wii Game", titre, "JAP"),
    ).toBe(false);
  });

  it("US : écarte les versions japonaises et PAL", () => {
    expect(
      estPertinente(
        "Super Mario Galaxy Wii Japanese Import NTSC-J",
        titre,
        "US",
      ),
    ).toBe(false);
    expect(
      estPertinente("Super Mario Galaxy Wii PAL UK Version", titre, "US"),
    ).toBe(false);
  });

  it("PAL : accepte une annonce sans mention de région, écarte la japonaise", () => {
    expect(
      estPertinente(
        "Super Mario Galaxy Nintendo Wii Jeu Complet",
        titre,
        "PAL",
      ),
    ).toBe(true);
    expect(
      estPertinente("Super Mario Galaxy Wii PAL UK Version", titre, "PAL"),
    ).toBe(true);
    expect(
      estPertinente(
        "Super Mario Galaxy Wii Japanese Import NTSC-J",
        titre,
        "PAL",
      ),
    ).toBe(false);
  });

  it("compare sans accents ni ponctuation", () => {
    expect(
      estPertinente(
        "POKEMON STADIUM 2 - N64 cartridge",
        "Pokémon Stadium 2",
        "US",
      ),
    ).toBe(true);
  });
});

describe("prixRegion", () => {
  const annonces = lireAnnonces(browse);

  it("US : médiane des 6 annonces pertinentes, en euros arrondis", () => {
    // 10,98 · 17,99 · 18,50 · 19,47 · 21,00 · 49,95 $ → médiane 18,985 $ → 17,58 € → 18 €
    expect(
      prixRegion(annonces, "Super Mario Galaxy", "wii", "US", taux),
    ).toEqual({
      etat: "prix",
      euros: 18,
      annonces: 6,
      marches: ["EBAY_US"],
      lien: lienVentes("Super Mario Galaxy", "wii", "US"),
    });
  });

  it("JAP : une seule annonce, pas assez pour un prix", () => {
    expect(
      prixRegion(annonces, "Super Mario Galaxy", "wii", "JAP", taux),
    ).toMatchObject({
      etat: "peu",
      annonces: 1,
    });
  });

  it("PAL : réunit les marchés France et Royaume-Uni", () => {
    const pal = [
      { titre: "Super Mario Galaxy Wii PAL FR", prix: 15, devise: "EUR" },
      { titre: "Super Mario Galaxy Wii complet", prix: 17, devise: "EUR" },
      { titre: "Super Mario Galaxy Nintendo Wii", prix: 20, devise: "EUR" },
      { titre: "Super Mario Galaxy Wii PAL UK", prix: 8.5, devise: "GBP" },
      { titre: "Super Mario Galaxy Wii Game", prix: 12.75, devise: "GBP" },
    ];
    // 15, 17, 20, 10, 15 € → médiane 15 €
    expect(
      prixRegion(pal, "Super Mario Galaxy", "wii", "PAL", taux),
    ).toMatchObject({
      etat: "prix",
      euros: 15,
      annonces: 5,
      marches: ["EBAY_FR", "EBAY_GB"],
    });
  });

  it("ignore une annonce dans une devise sans taux", () => {
    const jpy = Array.from({ length: 5 }, () => ({
      titre: "Super Mario Galaxy Wii",
      prix: 3000,
      devise: "JPY",
    }));
    expect(
      prixRegion(jpy, "Super Mario Galaxy", "wii", "US", taux),
    ).toMatchObject({ etat: "peu", annonces: 0 });
  });
});

describe("requete et lienVentes", () => {
  it("ajoute la console, et « japanese » pour la version JAP", () => {
    expect(requete("Super Mario Galaxy", "wii", "US")).toBe(
      "Super Mario Galaxy Wii",
    );
    expect(requete("Advance Wars", "gba", "JAP")).toBe(
      "Advance Wars Game Boy Advance japanese",
    );
  });

  it("ouvre les objets vendus sur ebay.com (JAP, US) ou ebay.fr (PAL)", () => {
    const us = new URL(lienVentes("Super Mario Galaxy", "wii", "US"));
    expect(us.origin).toBe("https://www.ebay.com");
    expect(us.pathname).toBe("/sch/i.html");
    expect(Object.fromEntries(us.searchParams)).toEqual({
      _nkw: "Super Mario Galaxy Wii",
      _sacat: "139973",
      LH_Sold: "1",
      LH_Complete: "1",
    });
    expect(new URL(lienVentes("Super Mario Galaxy", "wii", "PAL")).origin).toBe(
      "https://www.ebay.fr",
    );
    expect(
      new URL(lienVentes("Super Mario Galaxy", "wii", "JAP")).searchParams.get(
        "_nkw",
      ),
    ).toBe("Super Mario Galaxy Wii japanese");
  });
});
