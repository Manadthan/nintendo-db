import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { convertirEnWebp } from "./jaquettes";

const png = (largeur: number, hauteur: number) =>
  sharp({
    create: {
      width: largeur,
      height: hauteur,
      channels: 3,
      background: "#2541b2",
    },
  })
    .png()
    .toBuffer();

describe("convertirEnWebp (ADR-04)", () => {
  it("produit trois WebP de 300, 600 et 768 px de large, proportions gardées", async () => {
    const tailles = await convertirEnWebp(await png(1080, 1520));
    expect(Object.keys(tailles)).toEqual(["300", "600", "768"]);
    for (const [largeur, image] of Object.entries(tailles)) {
      const meta = await sharp(image).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(Number(largeur));
      expect(meta.height).toBe(Math.round((Number(largeur) * 1520) / 1080));
    }
  });

  it("n'agrandit jamais une petite image", async () => {
    const tailles = await convertirEnWebp(await png(264, 374));
    expect((await sharp(tailles[600]).metadata()).width).toBe(264);
  });

  it("refuse un fichier qui n'est pas une image", async () => {
    await expect(
      convertirEnWebp(Buffer.from("pas une image")),
    ).rejects.toThrow();
  });
});
