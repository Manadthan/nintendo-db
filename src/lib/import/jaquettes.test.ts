import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { convertirEnWebp, telechargerImageIgdb } from "./jaquettes";

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

const reponse = (corps: Buffer, type = "image/jpeg", ok = true) =>
  new Response(new Uint8Array(corps), {
    status: ok ? 200 : 404,
    headers: { "content-type": type },
  });

describe("convertirEnWebp (ADR-04)", () => {
  it("produit deux WebP de 300 et 600 px de large, proportions gardées", async () => {
    const tailles = await convertirEnWebp(await png(762, 1080));
    for (const [largeur, image] of Object.entries(tailles)) {
      const meta = await sharp(image).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(Number(largeur));
      expect(meta.height).toBe(Math.round((Number(largeur) * 1080) / 762));
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

describe("telechargerImageIgdb", () => {
  it("télécharge une image d'images.igdb.com", async () => {
    const image = await png(10, 10);
    const fetch = async () => reponse(image);
    expect(
      await telechargerImageIgdb(
        "https://images.igdb.com/igdb/image/upload/t_1080p/co213q.jpg",
        fetch,
      ),
    ).toEqual(image);
  });

  it("refuse toute autre adresse (pas de requête vers un site arbitraire)", async () => {
    const fetch = async () => reponse(Buffer.from(""));
    await expect(
      telechargerImageIgdb("https://exemple.com/x.jpg", fetch),
    ).rejects.toThrow(/images.igdb.com/);
    await expect(
      telechargerImageIgdb("http://images.igdb.com/x.jpg", fetch),
    ).rejects.toThrow(/images.igdb.com/);
  });

  it("refuse une réponse qui n'est pas une image, ou trop lourde", async () => {
    const url = "https://images.igdb.com/igdb/image/upload/t_1080p/x.jpg";
    await expect(
      telechargerImageIgdb(url, async () =>
        reponse(Buffer.from("<html>"), "text/html"),
      ),
    ).rejects.toThrow(/image/);
    await expect(
      telechargerImageIgdb(url, async () =>
        reponse(Buffer.alloc(6 * 1024 * 1024)),
      ),
    ).rejects.toThrow(/lourde/);
    await expect(
      telechargerImageIgdb(url, async () =>
        reponse(Buffer.from(""), "image/jpeg", false),
      ),
    ).rejects.toThrow(/404/);
  });
});
