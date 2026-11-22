import { describe, expect, it } from "vitest";
import { anciennete, libelleAnnonces, libelleMarches } from "./affichage";

describe("libellés du bloc Prix eBay", () => {
  it("nomme les marchés en court", () => {
    expect(libelleMarches(["EBAY_US"])).toBe("eBay US");
    expect(libelleMarches(["EBAY_FR", "EBAY_GB"])).toBe("eBay FR + UK");
  });

  it("accorde « annonce »", () => {
    expect(libelleAnnonces(1)).toBe("1 annonce");
    expect(libelleAnnonces(41)).toBe("41 annonces");
  });
});

describe("anciennete", () => {
  const maintenant = new Date("2026-11-22T17:30:00Z");

  it("à l'instant, en minutes, puis en heures entières", () => {
    expect(anciennete("2026-11-22T17:29:40Z", maintenant)).toBe(
      "Mis à jour à l'instant",
    );
    expect(anciennete("2026-11-22T17:05:00Z", maintenant)).toBe(
      "Mis à jour il y a 25 min",
    );
    expect(anciennete("2026-11-22T15:28:00Z", maintenant)).toBe(
      "Mis à jour il y a 2 h",
    );
  });

  it("à l'instant pour une date illisible ou dans le futur (horloge du téléphone en avance)", () => {
    expect(anciennete("n'importe quoi", maintenant)).toBe(
      "Mis à jour à l'instant",
    );
    expect(anciennete("2026-11-22T18:00:00Z", maintenant)).toBe(
      "Mis à jour à l'instant",
    );
  });
});
