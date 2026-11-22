import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  calculerPrix,
  titreCherche,
  type JeuPrix,
  type Sources,
} from "./calcul";
import { lireAnnonces, lireTauxBce, type Annonce, type Marche } from "./prix";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");
const annoncesUs = lireAnnonces(
  JSON.parse(fixture("browse-super-mario-galaxy-us.json")),
);
const taux = lireTauxBce(fixture("eurofxref-daily.xml"));

const sortie = (titre: string | null, titreRomanise: string | null = null) => ({
  sortie: titre !== null,
  titre,
  titreRomanise,
});

const galaxy: JeuPrix = {
  console: "wii",
  sorties: {
    JAP: sortie("スーパーマリオギャラクシー", "Super Mario Galaxy"),
    US: sortie("Super Mario Galaxy"),
    PAL: sortie("Super Mario Galaxy"),
  },
};

const palFr: Annonce[] = [15, 17, 20].map((prix) => ({
  titre: "Super Mario Galaxy Wii complet",
  prix,
  devise: "EUR",
}));
const palUk: Annonce[] = [8.5, 12.75].map((prix) => ({
  titre: "Super Mario Galaxy Wii PAL",
  prix,
  devise: "GBP",
}));

/** Sources sans réseau : US et JAP reçoivent la fixture d'eBay US, PAL les annonces ci-dessus. */
function sourcesFactices(): Sources & { chercher: ReturnType<typeof vi.fn> } {
  const parMarche: Record<Marche, Annonce[]> = {
    EBAY_US: annoncesUs,
    EBAY_FR: palFr,
    EBAY_GB: palUk,
  };
  return {
    chercher: vi.fn(async (marche: Marche) => parMarche[marche]),
    taux: async () => taux,
  };
}

describe("titreCherche", () => {
  it("cherche la version JAP sous son titre anglais (eBay US), les autres sous le leur", () => {
    expect(titreCherche(galaxy, "JAP")).toBe("Super Mario Galaxy");
    expect(titreCherche(galaxy, "PAL")).toBe("Super Mario Galaxy");
  });

  it("JAP seule : titre romanisé, sinon japonais", () => {
    const jeu: JeuPrix = {
      console: "snes",
      sorties: {
        JAP: sortie("ピクロスNP Vol.1", "Picross NP Vol. 1"),
        US: sortie(null),
        PAL: sortie(null),
      },
    };
    expect(titreCherche(jeu, "JAP")).toBe("Picross NP Vol. 1");
  });
});

describe("calculerPrix", () => {
  it("interroge eBay US pour JAP et US, eBay France et Royaume-Uni pour PAL", async () => {
    const sources = sourcesFactices();
    await calculerPrix(galaxy, sources);
    expect(sources.chercher.mock.calls).toEqual([
      ["EBAY_US", "Super Mario Galaxy Wii japanese"],
      ["EBAY_US", "Super Mario Galaxy Wii"],
      ["EBAY_FR", "Super Mario Galaxy Wii"],
      ["EBAY_GB", "Super Mario Galaxy Wii"],
    ]);
  });

  it("donne un prix par version sortie, avec la date du calcul", async () => {
    const reponse = await calculerPrix(
      galaxy,
      sourcesFactices(),
      new Date("2026-11-22T15:00:00Z"),
    );
    expect(reponse.calculeLe).toBe("2026-11-22T15:00:00.000Z");
    expect(reponse.regions.US).toMatchObject({
      etat: "prix",
      euros: 18,
      annonces: 6,
    });
    expect(reponse.regions.JAP).toMatchObject({ etat: "peu", annonces: 1 });
    expect(reponse.regions.PAL).toMatchObject({
      etat: "prix",
      euros: 15,
      annonces: 5,
    });
  });

  it("n'interroge pas eBay pour une version non sortie", async () => {
    const sources = sourcesFactices();
    const jeu: JeuPrix = {
      ...galaxy,
      sorties: { ...galaxy.sorties, JAP: sortie(null) },
    };
    const reponse = await calculerPrix(jeu, sources);
    expect(reponse.regions.JAP).toBeUndefined();
    expect(sources.chercher).toHaveBeenCalledTimes(3);
  });

  it("échoue en entier si eBay ou la BCE ne répond pas (le bloc sera masqué)", async () => {
    const enPanne: Sources = {
      ...sourcesFactices(),
      chercher: async () => Promise.reject(new Error("HTTP 429")),
    };
    await expect(calculerPrix(galaxy, enPanne)).rejects.toThrow("HTTP 429");
    const sansTaux: Sources = {
      ...sourcesFactices(),
      taux: async () => Promise.reject(new Error("BCE")),
    };
    await expect(calculerPrix(galaxy, sansTaux)).rejects.toThrow("BCE");
  });
});
