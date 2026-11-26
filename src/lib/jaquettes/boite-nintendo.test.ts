import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { preparerBoiteNintendo } from "./boite-nintendo";

// Images fabriquées comme les photos du My Nintendo Store du 25/11/2026 : carré transparent, objet au centre.
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const ROUGE_BOITIER = { r: 210, g: 42, b: 40, alpha: 1 };
const JAQUETTE = { r: 20, g: 60, b: 140, alpha: 1 };

async function photo(largeur: number, hauteur: number, boitier: boolean) {
  const objet = await sharp({
    create: {
      width: largeur,
      height: hauteur,
      channels: 4,
      background: boitier ? ROUGE_BOITIER : JAQUETTE,
    },
  })
    .composite(
      boitier
        ? [
            {
              input: await sharp({
                create: {
                  width: largeur - 20,
                  height: hauteur - 20,
                  channels: 4,
                  background: JAQUETTE,
                },
              })
                .png()
                .toBuffer(),
              left: 6,
              top: 10,
            },
            // Liseré clair d'un pixel au bord droit, comme sur les vraies photos (217, 105, 106).
            {
              input: await sharp({
                create: {
                  width: 1,
                  height: hauteur,
                  channels: 4,
                  background: { r: 217, g: 105, b: 106, alpha: 1 },
                },
              })
                .png()
                .toBuffer(),
              left: largeur - 1,
              top: 0,
            },
          ]
        : [],
    )
    .png()
    .toBuffer();
  return sharp({
    create: { width: 600, height: 600, channels: 4, background: TRANSPARENT },
  })
    .composite([
      { input: objet, left: 300 - largeur / 2, top: 300 - hauteur / 2 },
    ])
    .png()
    .toBuffer();
}

const taille = async (b: Buffer) => {
  const m = await sharp(b).metadata();
  return [m.width, m.height];
};

describe("preparerBoiteNintendo (US-33, SPEC v1.44)", () => {
  it("boîte dans son boîtier rouge : marge transparente puis boîtier retirés", async () => {
    const jaquette = await preparerBoiteNintendo(await photo(300, 480, true));
    expect(jaquette).not.toBeNull();
    const [l, h] = await taille(jaquette!);
    expect(l).toBeLessThan(300);
    expect(h).toBeLessThan(480);
  });

  it("jaquette sans boîtier : seulement la marge retirée", async () => {
    const jaquette = await preparerBoiteNintendo(await photo(300, 480, false));
    expect(await taille(jaquette!)).toEqual([300, 480]);
  });

  it("visuel en largeur (pas une boîte) : rien", async () => {
    expect(
      await preparerBoiteNintendo(await photo(560, 316, false)),
    ).toBeNull();
  });
});
