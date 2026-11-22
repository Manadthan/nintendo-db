import { describe, expect, it } from "vitest";
import { LOT, limiteRestauree, premiersDesGroupes } from "./lots";
import type { Groupe, VersionAffichee } from "./types";

// Les versions ne sont que comptées et découpées : un identifiant suffit.
const versions = (n: number, prefixe: string) =>
  Array.from(
    { length: n },
    (_, i) => ({ id: `${prefixe}${i}` }) as unknown as VersionAffichee,
  );

const GROUPES: Groupe[] = [
  { titre: "2017", versions: versions(40, "a") },
  { titre: "2016", versions: versions(40, "b") },
  { titre: "2015", versions: versions(40, "c") },
];

describe("affichage par lots (SPEC v1.41)", () => {
  it("dessine les 60 premiers jeux, à cheval sur deux années", () => {
    const groupes = premiersDesGroupes(GROUPES, LOT);
    expect(groupes.map((g) => g.titre)).toEqual(["2017", "2016"]);
    expect(groupes.map((g) => g.affichees.length)).toEqual([40, 20]);
  });

  it("garde le nombre de jeux de chaque année, même pas encore tous dessinés", () => {
    const [, annee2016] = premiersDesGroupes(GROUPES, LOT);
    expect(annee2016?.versions).toHaveLength(40);
  });

  it("dessine tout quand la limite dépasse le nombre de jeux", () => {
    const groupes = premiersDesGroupes(GROUPES, 500);
    expect(groupes.map((g) => g.affichees.length)).toEqual([40, 40, 40]);
  });

  it("au retour d'une fiche : assez de lots pour retrouver le jeu cliqué", () => {
    expect(limiteRestauree(undefined)).toBe(LOT);
    expect(limiteRestauree(0)).toBe(LOT);
    expect(limiteRestauree(60)).toBe(60);
    expect(limiteRestauree(130)).toBe(180);
  });
});
