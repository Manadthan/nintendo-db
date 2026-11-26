import { describe, expect, it } from "vitest";
import {
  adresseCouvertureAmazon,
  cheminCouverture,
  estCouverture,
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

describe("estCouverture", () => {
  it("écarte l'image d'1 px qu'Amazon renvoie pour un livre sans couverture", () => {
    expect(estCouverture({ width: 1, height: 1 })).toBe(false);
    expect(estCouverture({ width: undefined, height: undefined })).toBe(false);
  });
  it("garde une vraie couverture", () => {
    expect(estCouverture({ width: 353, height: 500 })).toBe(true);
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
