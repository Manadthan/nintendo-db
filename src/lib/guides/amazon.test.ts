import { describe, expect, it } from "vitest";
import {
  adresseCouvertureAmazon,
  adressePageAmazon,
  cheminCouverture,
  estCouverture,
  estFausseCouvertureAmazon,
  extraireCouverturePageAmazon,
  isbn10,
} from "./amazon";

// ISBN de guides en base, couvertures vérifiées chez Amazon le 26/11/2026 (DESIGN ADR-19 point 2).
describe("isbn10", () => {
  it("convertit un ISBN 978 en ISBN 10, clé X comprise", () => {
    expect(isbn10("9784047289369")).toBe("4047289361");
    expect(isbn10("9784091065667")).toBe("409106566X");
    expect(isbn10("9784198632267")).toBe("419863226X");
  });
  it("refuse un ISBN 979 (pas d'ISBN 10) ou mal formé", () => {
    expect(isbn10("9791032706671")).toBeNull();
    expect(isbn10("4047289361")).toBeNull();
    expect(isbn10("97840472893")).toBeNull();
  });
});

describe("adresseCouvertureAmazon", () => {
  it("donne l'image Amazon par ISBN 10, la plus grande taille (≈ 350 × 500)", () => {
    expect(adresseCouvertureAmazon("9784047289369")).toBe(
      "https://images-na.ssl-images-amazon.com/images/P/4047289361.09.LZZZZZZZ.jpg",
    );
    expect(adresseCouvertureAmazon("9791032706671")).toBeNull();
  });
});

describe("adressePageAmazon et extraireCouverturePageAmazon", () => {
  it("construit l'URL de la fiche Amazon Japon par ISBN 10", () => {
    expect(adressePageAmazon("9784091060235")).toBe(
      "https://www.amazon.co.jp/dp/4091060234",
    );
    expect(adressePageAmazon("9791032706671")).toBeNull();
  });
  it("extrait l'image la plus grande de data-a-dynamic-image sans suffixe de réduction", () => {
    const html = `<img id="landingImage" data-a-dynamic-image="{&quot;https://m.media-amazon.com/images/I/91tViShY+DL._SY342_.jpg&quot;:[342,256],&quot;https://m.media-amazon.com/images/I/91tViShY+DL._SY522_.jpg&quot;:[522,391]}" />`;
    expect(extraireCouverturePageAmazon(html)).toBe(
      "https://m.media-amazon.com/images/I/91tViShY+DL.jpg",
    );
  });
  it("prend hiRes si data-a-dynamic-image est absent et renvoie null sans image", () => {
    expect(
      extraireCouverturePageAmazon(
        `{"hiRes":"https://m.media-amazon.com/images/I/51NlcxflqZL._SL500_.jpg"}`,
      ),
    ).toBe("https://m.media-amazon.com/images/I/51NlcxflqZL.jpg");
    expect(extraireCouverturePageAmazon("<html>rien</html>")).toBeNull();
  });
});

describe("estCouverture", () => {
  it("écarte l'image d'1 px qu'Amazon renvoie pour un livre sans couverture", () => {
    expect(estCouverture({ width: 1, height: 1 })).toBe(false);
    expect(estCouverture({ width: undefined, height: undefined })).toBe(false);
  });
  it("garde une vraie couverture", () => {
    expect(estCouverture({ width: 353, height: 500 })).toBe(true);
  });
});

describe("estFausseCouvertureAmazon", () => {
  it("reconnaît le visuel générique bleu marine COVER COMING SOON (350×500)", () => {
    expect(
      estFausseCouvertureAmazon(350, 500, {
        hautGauche: [64, 73, 88],
        milieuDroite: [33, 59, 96],
        bandeBasse: [255, 255, 250],
        bordBas: [34, 55, 82],
      }),
    ).toBe(true);
  });
  it("ne rejette pas une vraie couverture même de taille proche", () => {
    expect(
      estFausseCouvertureAmazon(356, 500, {
        hautGauche: [64, 73, 88],
        milieuDroite: [33, 59, 96],
        bandeBasse: [255, 255, 250],
        bordBas: [34, 55, 82],
      }),
    ).toBe(false);
    expect(
      estFausseCouvertureAmazon(350, 500, {
        hautGauche: [220, 40, 30],
        milieuDroite: [33, 59, 96],
        bandeBasse: [255, 255, 250],
        bordBas: [34, 55, 82],
      }),
    ).toBe(false);
  });
});

describe("cheminCouverture", () => {
  it("version 1 pour une première copie", () => {
    expect(cheminCouverture("9784047289369", null)).toBe(
      "9784047289369-1.webp",
    );
  });
  it("version suivante quand une copie existe (nouvelle adresse, ADR-04)", () => {
    expect(cheminCouverture("9784047289369", "9784047289369-1.webp")).toBe(
      "9784047289369-2.webp",
    );
    expect(cheminCouverture("9784047289369", "9784047289369-12.webp")).toBe(
      "9784047289369-13.webp",
    );
  });
});
