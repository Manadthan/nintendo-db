import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { estVisuelEshop } from "./eshop";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom));

describe("estVisuelEshop", () => {
  it("reconnaît le visuel « Nintendo eShop » de GameTDB (Dragon Quest XI S)", async () => {
    expect(await estVisuelEshop(fixture("eshop-switch.jpg"))).toBe(true);
  });

  it("le reconnaît aussi réduit en WebP, comme sur le site", async () => {
    const webp = await sharp(fixture("eshop-switch.jpg"))
      .resize({ width: 100 })
      .webp({ quality: 82 })
      .toBuffer();
    expect(await estVisuelEshop(webp)).toBe(true);
  });

  it("garde une vraie boîte rouge (Daemon X Machina JAP)", async () => {
    expect(await estVisuelEshop(fixture("boite-rouge-switch.jpg"))).toBe(false);
  });

  it("rend faux pour un fichier qui n'est pas une image", async () => {
    expect(await estVisuelEshop(Buffer.from("pas une image"))).toBe(false);
  });
});
