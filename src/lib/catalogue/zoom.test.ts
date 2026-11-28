import { describe, expect, it } from "vitest";
import {
  CLASSES_GRILLE,
  NIVEAUX_ZOOM,
  TAILLES_JAQUETTE,
  ZOOM_PAR_DEFAUT,
  dezoomer,
  peutDezoomer,
  peutZoomer,
  zoomDepuisTexte,
  zoomer,
} from "./zoom";

describe("zoom de la grille", () => {
  it("reconnaît les niveaux valides et ignore les valeurs inconnues", () => {
    expect(zoomDepuisTexte("compact")).toBe("compact");
    expect(zoomDepuisTexte("NORMAL")).toBe("normal");
    expect(zoomDepuisTexte("grand")).toBe("grand");
    expect(zoomDepuisTexte("inconnu")).toBeNull();
    expect(zoomDepuisTexte("")).toBeNull();
    expect(zoomDepuisTexte(null)).toBeNull();
  });

  it("zoome et dézoome sans dépasser les bornes", () => {
    expect(ZOOM_PAR_DEFAUT).toBe("normal");

    expect(zoomer("compact")).toBe("normal");
    expect(zoomer("normal")).toBe("grand");
    expect(zoomer("grand")).toBe("grand");

    expect(dezoomer("grand")).toBe("normal");
    expect(dezoomer("normal")).toBe("compact");
    expect(dezoomer("compact")).toBe("compact");
  });

  it("indique correctement si les boutons zoom et dézoom sont actifs", () => {
    expect(peutDezoomer("compact")).toBe(false);
    expect(peutZoomer("compact")).toBe(true);

    expect(peutDezoomer("normal")).toBe(true);
    expect(peutZoomer("normal")).toBe(true);

    expect(peutDezoomer("grand")).toBe(true);
    expect(peutZoomer("grand")).toBe(false);
  });

  it("fournit des classes de grille et tailles d'image pour chaque niveau", () => {
    for (const niveau of NIVEAUX_ZOOM) {
      expect(CLASSES_GRILLE[niveau]).toContain("grid");
      expect(TAILLES_JAQUETTE[niveau]).toContain("px");
    }
    expect(CLASSES_GRILLE.grand).toContain("grid-cols-1");
    expect(CLASSES_GRILLE.grand).toContain("xl:grid-cols-4");
    expect(CLASSES_GRILLE.normal).toContain("grid-cols-2");
    expect(CLASSES_GRILLE.normal).toContain("xl:grid-cols-6");
    expect(CLASSES_GRILLE.compact).toContain("grid-cols-3");
    expect(CLASSES_GRILLE.compact).toContain("xl:grid-cols-8");
  });
});
