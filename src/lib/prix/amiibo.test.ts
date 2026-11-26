import { describe, expect, it, vi } from "vitest";
import {
  calculerPrixAmiibo,
  estAmiiboPertinent,
  lienVentesAmiibo,
  requeteAmiibo,
} from "./amiibo";
import type { Sources } from "./calcul";
import type { Annonce, Marche } from "./prix";

// Prix eBay d'un amiibo (US-29, ADR-21 point 6) : titres d'annonces écrits à la main, sur le modèle des annonces
// eBay de figurines et de cartes amiibo ; jamais eBay en direct.

describe("estAmiiboPertinent", () => {
  it("garde l'amiibo seul, neuf ou d'occasion", () => {
    expect(
      estAmiiboPertinent(
        "Nintendo Sidon amiibo Tears of the Kingdom NEW",
        "Sidon",
        "figurine",
        "US",
      ),
    ).toBe(true);
    expect(
      estAmiiboPertinent(
        "Amiibo Sidon Zelda loose",
        "Sidon",
        "figurine",
        "PAL",
      ),
    ).toBe(true);
  });

  it("écarte lots, fausses cartes NFC, boîtes vides et un autre amiibo", () => {
    for (const titre of [
      "Zelda amiibo lot Sidon Riju Tulin",
      "Sidon amiibo NFC card Tears of the Kingdom",
      "Sidon amiibo empty box",
      "Custom Sidon amiibo",
      "Riju amiibo Zelda",
      "Sidon figure Zelda", // pas « amiibo »
    ])
      expect(estAmiiboPertinent(titre, "Sidon", "figurine", "US")).toBe(false);
  });

  it("une carte doit dire « card », une figurine non", () => {
    expect(
      estAmiiboPertinent(
        "Isabelle amiibo card Animal Crossing #001",
        "Isabelle",
        "carte",
        "US",
      ),
    ).toBe(true);
    expect(
      estAmiiboPertinent("Isabelle amiibo figure", "Isabelle", "carte", "US"),
    ).toBe(false);
    expect(
      estAmiiboPertinent("Isabelle amiibo card", "Isabelle", "figurine", "US"),
    ).toBe(false);
  });

  it("règles de région : JAP exige le Japon, US n'en veut pas", () => {
    expect(
      estAmiiboPertinent("Sidon amiibo Japan", "Sidon", "figurine", "JAP"),
    ).toBe(true);
    expect(estAmiiboPertinent("Sidon amiibo", "Sidon", "figurine", "JAP")).toBe(
      false,
    );
    expect(
      estAmiiboPertinent(
        "Sidon amiibo Japan import",
        "Sidon",
        "figurine",
        "US",
      ),
    ).toBe(false);
    expect(
      estAmiiboPertinent("Sidon amiibo PAL", "Sidon", "figurine", "PAL"),
    ).toBe(true);
  });
});

describe("recherche et lien", () => {
  it("cherche « amiibo {nom} », « japanese » pour la version JAP", () => {
    expect(requeteAmiibo("Sidon", "US")).toBe("amiibo Sidon");
    expect(requeteAmiibo("Sidon", "JAP")).toBe("amiibo Sidon japanese");
  });

  it("mène aux ventes terminées, sans catégorie de jeux", () => {
    expect(lienVentesAmiibo("Sidon", "PAL")).toBe(
      "https://www.ebay.fr/sch/i.html?_nkw=amiibo+Sidon&LH_Sold=1&LH_Complete=1",
    );
  });
});

describe("calculerPrixAmiibo", () => {
  const annonces = (prix: number[], titre: string, devise = "USD"): Annonce[] =>
    prix.map((p) => ({ titre, prix: p, devise }));

  it("une recherche par marché des régions sorties, sans catégorie ; médiane en euros", async () => {
    const chercher = vi.fn(async (marche: Marche): Promise<Annonce[]> =>
      marche === "EBAY_US"
        ? annonces([20, 22, 24, 26, 28], "Sidon amiibo new")
        : annonces([18, 19, 20], "Sidon amiibo", "EUR"),
    );
    const sources: Sources = {
      chercher,
      taux: async () => ({ EUR: 1, USD: 1.25, GBP: 0.85 }),
    };
    const prix = await calculerPrixAmiibo(
      {
        nom: "Sidon",
        type: "figurine",
        sorties: { JAP: false, US: true, PAL: true },
      },
      sources,
      new Date("2026-11-26T09:00:00Z"),
    );
    expect(chercher).toHaveBeenCalledTimes(3);
    expect(chercher).toHaveBeenCalledWith("EBAY_US", "amiibo Sidon", null);
    expect(prix.regions.JAP).toBeUndefined();
    expect(prix.regions.US).toMatchObject({ etat: "prix", euros: 19 });
    // PAL : FR + UK réunis, 6 annonces.
    expect(prix.regions.PAL).toMatchObject({ etat: "prix", annonces: 6 });
    expect(prix.calculeLe).toBe("2026-11-26T09:00:00.000Z");
  });
});
