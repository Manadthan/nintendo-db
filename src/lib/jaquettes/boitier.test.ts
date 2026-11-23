import { describe, expect, it } from "vitest";
import {
  aUnBoitier,
  estPixelDuBoitier,
  gabaritPour,
  GABARITS,
  zoneSansBoitier,
} from "./boitier";

type Couleur = [number, number, number];

/** Image RVB brute : `fond` partout, puis une bordure de `couleur` sur la droite et en bas (épaisseurs en pixels). */
function image(
  largeur: number,
  hauteur: number,
  fond: Couleur,
  bord?: { couleur: Couleur; droite: number; bas: number },
) {
  const pixels = new Uint8Array(largeur * hauteur * 3);
  for (let y = 0; y < hauteur; y++)
    for (let x = 0; x < largeur; x++) {
      const dansBord =
        bord && (x >= largeur - bord.droite || y >= hauteur - bord.bas);
      pixels.set(dansBord ? bord.couleur : fond, (y * largeur + x) * 3);
    }
  return pixels;
}

const ILLUSTRATION: Couleur = [40, 120, 200];
const GRIS: Couleur = [215, 215, 215];
const ROUGE_BOITIER: Couleur = [209, 43, 40];
const ROUGE_BANDEAU: Couleur = [231, 0, 19];

describe("estPixelDuBoitier", () => {
  it("reconnaît le plastique gris clair et le rouge terne du boîtier Switch 2", () => {
    expect(estPixelDuBoitier(...GRIS)).toBe(true);
    expect(estPixelDuBoitier(255, 255, 255)).toBe(true);
    expect(estPixelDuBoitier(...ROUGE_BOITIER)).toBe(true);
  });
  it("laisse le bandeau rouge de la jaquette Switch 2 et l'illustration", () => {
    expect(estPixelDuBoitier(...ROUGE_BANDEAU)).toBe(false);
    expect(estPixelDuBoitier(...ILLUSTRATION)).toBe(false);
    expect(estPixelDuBoitier(207, 227, 177)).toBe(false);
  });
});

describe("aUnBoitier", () => {
  it("voit le boîtier gris d'une photo Nintendo (charnière à droite)", () => {
    expect(
      aUnBoitier(
        image(100, 162, ILLUSTRATION, { couleur: GRIS, droite: 5, bas: 4 }),
        100,
        162,
      ),
    ).toBe(true);
  });
  it("voit le boîtier rouge d'une jaquette Switch 2", () => {
    expect(
      aUnBoitier(
        image(100, 162, ILLUSTRATION, {
          couleur: ROUGE_BOITIER,
          droite: 5,
          bas: 4,
        }),
        100,
        162,
      ),
    ).toBe(true);
  });
  it("ne voit rien sur une jaquette plate (ou déjà recadrée)", () => {
    expect(aUnBoitier(image(100, 162, ILLUSTRATION), 100, 162)).toBe(false);
    expect(
      aUnBoitier(
        image(100, 162, ILLUSTRATION, { couleur: GRIS, droite: 1, bas: 1 }),
        100,
        162,
      ),
    ).toBe(false);
  });
  it("ne prend pas une illustration blanche en bas pour un boîtier", () => {
    expect(
      aUnBoitier(
        image(100, 162, ILLUSTRATION, {
          couleur: [255, 255, 255],
          droite: 0,
          bas: 30,
        }),
        100,
        162,
      ),
    ).toBe(false);
  });
  it("ignore une photo en largeur (boîte Nintendo Labo)", () => {
    expect(
      aUnBoitier(
        image(162, 100, ILLUSTRATION, { couleur: GRIS, droite: 10, bas: 10 }),
        162,
        100,
      ),
    ).toBe(false);
  });
});

describe("zoneSansBoitier", () => {
  it("retire le boîtier d'une jaquette gamecartdb 768 × 1244", () => {
    expect(zoneSansBoitier(768, 1244, GABARITS.gamecartdb)).toEqual({
      left: 3,
      top: 35,
      width: 727,
      height: 1175,
    });
  });
  it("retire le boîtier d'une photo Nintendo 500 × 809", () => {
    expect(zoneSansBoitier(500, 809, GABARITS.nintendo)).toEqual({
      left: 5,
      top: 23,
      width: 470,
      height: 764,
    });
  });
});

describe("gabaritPour", () => {
  it("vise les photos Nintendo (Switch, Switch 2) et gamecartdb (Switch 2)", () => {
    expect(gabaritPour("switch", "nintendo")).toBe(GABARITS.nintendo);
    expect(gabaritPour("switch-2", "nintendo")).toBe(GABARITS.nintendo);
    expect(gabaritPour("switch-2", "gamecartdb")).toBe(GABARITS.gamecartdb);
  });
  it("ne touche ni aux scans, ni aux ajouts à la main, ni aux autres consoles", () => {
    expect(gabaritPour("switch", "gametdb")).toBeNull();
    expect(gabaritPour("switch", "photo")).toBeNull();
    expect(gabaritPour("wii-u", "nintendo")).toBeNull();
  });
});
