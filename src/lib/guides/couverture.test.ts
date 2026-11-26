import { describe, expect, it } from "vitest";
import { adresseCouvertureGuide, choisirCouverture } from "./couverture";

describe("choisirCouverture (ADR-19 point 2 révisé)", () => {
  it("la copie Amazon d'abord, même si Google Books connaît le livre", () => {
    expect(choisirCouverture("9784047289369-1.webp", "W6E70AEACAAJ")).toEqual({
      source: "amazon",
      chemin: "9784047289369-1.webp",
    });
  });
  it("Google Books en secours, sinon rien (vignette neutre)", () => {
    expect(choisirCouverture(null, "W6E70AEACAAJ")).toEqual({
      source: "google",
      id: "W6E70AEACAAJ",
    });
    expect(choisirCouverture(null, null)).toBeNull();
  });
});

describe("adresseCouvertureGuide", () => {
  it("copie : adresse publique du bucket guides", () => {
    expect(
      adresseCouvertureGuide(
        { source: "amazon", chemin: "9784047289369-1.webp" },
        "https://exemple.supabase.co/",
      ),
    ).toBe(
      "https://exemple.supabase.co/storage/v1/object/public/guides/9784047289369-1.webp",
    );
  });
  it("Google Books : servie par Google, jamais copiée", () => {
    expect(
      adresseCouvertureGuide({ source: "google", id: "W6E70AEACAAJ" }),
    ).toBe(
      "https://books.google.com/books/content?id=W6E70AEACAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200",
    );
  });
});
