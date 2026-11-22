import { describe, expect, it } from "vitest";
import { noterPosition, positionARemettre } from "./defilement";

function stockage() {
  const valeurs = new Map<string, string>();
  return {
    getItem: (cle: string) => valeurs.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => void valeurs.set(cle, valeur),
    removeItem: (cle: string) => void valeurs.delete(cle),
    valeurs,
  };
}

describe("position du catalogue au retour d'une fiche", () => {
  it("remet la hauteur notée après un retour arrière à la même adresse", () => {
    const s = stockage();
    noterPosition(s, "/?console=wii-u", 3000, 180);
    expect(positionARemettre(s, "/?console=wii-u", true)).toEqual({
      y: 3000,
      nombre: 180,
    });
  });

  it("ne sert qu'une fois", () => {
    const s = stockage();
    noterPosition(s, "/", 3000, 60);
    positionARemettre(s, "/", true);
    expect(positionARemettre(s, "/", true)).toBeNull();
  });

  it("repart du haut sans retour arrière (icône Catalogue), et oublie la note", () => {
    const s = stockage();
    noterPosition(s, "/", 3000, 60);
    expect(positionARemettre(s, "/", false)).toBeNull();
    expect(s.valeurs.size).toBe(0);
  });

  it("ignore une note prise à une autre adresse (autres filtres)", () => {
    const s = stockage();
    noterPosition(s, "/?q=mario", 3000, 60);
    expect(positionARemettre(s, "/", true)).toBeNull();
  });

  it("ignore une note absente, illisible ou en haut de page", () => {
    const s = stockage();
    expect(positionARemettre(s, "/", true)).toBeNull();
    s.setItem("nintendo-db:defilement", "{pas du json");
    expect(positionARemettre(s, "/", true)).toBeNull();
    noterPosition(s, "/", 0, 60);
    expect(positionARemettre(s, "/", true)).toBeNull();
  });

  it("lit une note d'avant l'affichage par lots (sans nombre de jeux)", () => {
    const s = stockage();
    s.setItem(
      "nintendo-db:defilement",
      JSON.stringify({ adresse: "/", y: 1200 }),
    );
    expect(positionARemettre(s, "/", true)).toEqual({ y: 1200, nombre: 0 });
  });
});
