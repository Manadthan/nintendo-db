import { describe, expect, it } from "vitest";
import { aFondBlanc, doitDetourer, retirerFondBlanc } from "./image";

function creerImage(
  largeur: number,
  hauteur: number,
  fond: readonly [number, number, number, number],
): Uint8Array {
  const buf = new Uint8Array(largeur * hauteur * 4);
  for (let i = 0; i < largeur * hauteur; i++) {
    buf[i * 4] = fond[0];
    buf[i * 4 + 1] = fond[1];
    buf[i * 4 + 2] = fond[2];
    buf[i * 4 + 3] = fond[3];
  }
  return buf;
}

function peindreRect(
  buf: Uint8Array,
  largeur: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  couleur: readonly [number, number, number, number],
) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const o = (y * largeur + x) * 4;
      buf[o] = couleur[0];
      buf[o + 1] = couleur[1];
      buf[o + 2] = couleur[2];
      buf[o + 3] = couleur[3];
    }
  }
}

const alpha = (buf: Uint8Array, largeur: number, x: number, y: number) =>
  buf[(y * largeur + x) * 4 + 3];

describe("doitDetourer", () => {
  it("détoure les figurines et objets mais jamais les cartes", () => {
    expect(doitDetourer("figurine")).toBe(true);
    expect(doitDetourer("peluche")).toBe(true);
    expect(doitDetourer("bracelet")).toBe(true);
    expect(doitDetourer("bloc")).toBe(true);
    expect(doitDetourer("carte")).toBe(false);
  });
});

describe("aFondBlanc", () => {
  it("reconnaît un fond blanc opaque (ou presque blanc)", () => {
    expect(aFondBlanc(creerImage(10, 10, [255, 255, 255, 255]), 10, 10)).toBe(
      true,
    );
    expect(aFondBlanc(creerImage(10, 10, [246, 246, 244, 255]), 10, 10)).toBe(
      true,
    );
  });

  it("renvoie faux pour une image déjà transparente ou à fond coloré", () => {
    expect(aFondBlanc(creerImage(10, 10, [255, 255, 255, 0]), 10, 10)).toBe(
      false,
    );
    expect(aFondBlanc(creerImage(10, 10, [30, 34, 43, 255]), 10, 10)).toBe(
      false,
    );
  });
});

describe("retirerFondBlanc", () => {
  it("rend transparent le fond blanc extérieur tout en gardant le sujet opaque", () => {
    const img = creerImage(30, 30, [255, 255, 255, 255]);
    peindreRect(img, 30, 8, 8, 21, 21, [40, 120, 60, 255]);
    const res = retirerFondBlanc(img, 30, 30);

    expect(alpha(res, 30, 0, 0)).toBe(0);
    expect(alpha(res, 30, 29, 29)).toBe(0);
    expect(alpha(res, 30, 15, 15)).toBe(255);
  });

  it("supprime une cavité intérieure de blanc pur entourée de pixels sombres", () => {
    const img = creerImage(50, 50, [255, 255, 255, 255]);
    // Cadre sombre (jambes + socle) entourant une cavité de 12x12 blanc pur
    peindreRect(img, 50, 10, 10, 39, 39, [30, 30, 35, 255]);
    peindreRect(img, 50, 18, 18, 29, 29, [255, 255, 255, 255]);
    const res = retirerFondBlanc(img, 50, 50);

    expect(alpha(res, 50, 24, 24)).toBe(0);
    expect(alpha(res, 50, 12, 12)).toBe(255);
  });

  it("préserve un vêtement blanc nuancé à l'intérieur du sujet", () => {
    const img = creerImage(50, 50, [255, 255, 255, 255]);
    peindreRect(img, 50, 10, 10, 39, 39, [200, 80, 60, 255]);
    // Tablier blanc ombré (242, 242, 242 : pas de blanc pur 255)
    peindreRect(img, 50, 18, 18, 29, 29, [242, 242, 242, 255]);
    const res = retirerFondBlanc(img, 50, 50);

    expect(alpha(res, 50, 24, 24)).toBe(255);
  });

  it("décontamine un bord anti-aliasé sur sujet sombre sans assombrir un sujet blanc", () => {
    // Sujet sombre avec liseré gris clair mélangé au fond blanc
    const sombre = creerImage(20, 20, [255, 255, 255, 255]);
    peindreRect(sombre, 20, 5, 5, 14, 14, [20, 20, 20, 255]);
    peindreRect(sombre, 20, 5, 5, 5, 14, [180, 180, 180, 255]);
    const resSombre = retirerFondBlanc(sombre, 20, 20);
    expect(alpha(resSombre, 20, 5, 10)).toBeLessThan(200);
    expect(alpha(resSombre, 20, 5, 10)).toBeGreaterThan(0);

    // Sujet blanc lumineux (ex. ailes de Navi) : reste lumineux, jamais noirci
    const clair = creerImage(20, 20, [255, 255, 255, 255]);
    peindreRect(clair, 20, 5, 5, 14, 14, [232, 234, 236, 255]);
    const resClair = retirerFondBlanc(clair, 20, 20);
    const o = (10 * 20 + 5) * 4;
    expect(resClair[o]).toBeGreaterThan(220);
    expect(resClair[o + 3]).toBe(255);
  });
});
