import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  decouperFaceAvant,
  estDisqueWiiDuCommerce,
  reduireBaseWii,
} from "./relais-wii";

const jeu = (
  id: string,
  region: string,
  editeur: string,
  type = "",
  extra = "",
) => `<game name="${id}"><id>${id}</id><type>${type}</type><region>${region}</region>
  <locale lang="EN"><title>${id}</title><synopsis>Résumé</synopsis></locale>
  <publisher>${editeur}</publisher><genre>action</genre>${extra}</game>`;

const BASE = `<?xml version="1.0" encoding="UTF-8"?>
<datafile>
  <WiiTDB version="1" games="9"/>
  <companies><company code="01" name="Nintendo"/></companies>
  <genres><maingenre name="action"><loc lang="FR">action</loc><loc lang="FI">toiminta</loc></maingenre></genres>
  ${jeu("RMCP01", "PAL", "Nintendo", "", "<rom size='1'/><rating type='PEGI'/>")}
  ${jeu("RMCJ01", "NTSC-J", "Nintendo")}
  ${jeu("RWSJ01", "NTSC-J", "Nintendo")}
  ${jeu("RWSE8P", "NTSC-U", "Sega")}
  ${jeu("RWSP8P", "PAL", "Sega")}
  ${jeu("RX9E52", "NTSC-U", "Activision")}
  ${jeu("410E01", "NTSC-U", "Nintendo")}
  ${jeu("DAXE01", "NTSC-U", "Nintendo")}
  ${jeu("RMCK01", "NTSC-K", "Nintendo")}
  ${jeu("RZZE01", "NTSC-U", "Nintendo", "CUSTOM")}
</datafile>`;

describe("estDisqueWiiDuCommerce", () => {
  it("garde les disques du commerce (R ou S) des 3 régions suivies", () => {
    expect(estDisqueWiiDuCommerce("", "RMCP01", "PAL")).toBe(true);
    expect(estDisqueWiiDuCommerce("", "SOUE01", "NTSC-U")).toBe(true);
  });

  it("écarte disques système, démos, disques « CUSTOM » et régions non suivies", () => {
    expect(estDisqueWiiDuCommerce("", "410E01", "NTSC-U")).toBe(false);
    expect(estDisqueWiiDuCommerce("", "DAXE01", "NTSC-U")).toBe(false);
    expect(estDisqueWiiDuCommerce("CUSTOM", "RZZE01", "NTSC-U")).toBe(false);
    expect(estDisqueWiiDuCommerce("", "RMCK01", "NTSC-K")).toBe(false);
  });
});

describe("reduireBaseWii", () => {
  const { xml, disques } = reduireBaseWii(BASE);

  it("garde tous les disques des jeux dont au moins une boîte est de Nintendo (Mario & Sonic : Japon)", () => {
    expect(disques.map((d) => d.id).sort()).toEqual([
      "RMCJ01",
      "RMCP01",
      "RWSE8P",
      "RWSJ01",
      "RWSP8P",
    ]);
  });

  it("retire les autres jeux et les champs que l'import ne lit pas, garde les genres en français", () => {
    expect(xml).not.toContain("RX9E52"); // aucune boîte Nintendo
    expect(xml).not.toContain("410E01");
    expect(xml).not.toContain("<synopsis>");
    expect(xml).not.toContain("<rom");
    expect(xml).not.toContain("<rating");
    expect(xml).not.toContain("<companies>");
    expect(xml).toContain('<loc lang="FR">action</loc>');
    expect(xml).not.toContain('lang="FI"');
    expect(xml).toContain("<genre>action</genre>");
    expect(xml).toContain("<publisher>Sega</publisher>");
  });

  it("base réelle (fixture du 17/11/2026) : 88 jeux Nintendo, 234 disques", () => {
    const fixture = readFileSync(
      join(__dirname, "__fixtures__/wiitdb.xml"),
      "utf8",
    );
    const reduite = reduireBaseWii(fixture);
    expect(reduite.disques).toHaveLength(234);
    // Dont Kororinpa et Tetris Party Deluxe : édités par Nintendo en Europe sous un autre code d'éditeur.
    expect(new Set(reduite.disques.map((d) => d.id.slice(0, 3))).size).toBe(88);
  });
});

describe("decouperFaceAvant", () => {
  // Boîte dépliée factice 1024 × 680 : dos rouge, tranche noire, face bleue (proportions d'un boîtier Wii).
  const scan = async () => {
    const face = Math.round((1024 * 135) / 284);
    const dos = face;
    return sharp({
      create: { width: 1024, height: 680, channels: 3, background: "#ff0000" },
    })
      .composite([
        {
          input: {
            create: {
              width: 1024 - dos - face,
              height: 680,
              channels: 3,
              background: "#000000",
            },
          },
          left: dos,
          top: 0,
        },
        {
          input: {
            create: {
              width: face,
              height: 680,
              channels: 3,
              background: "#0000ff",
            },
          },
          left: 1024 - face,
          top: 0,
        },
      ])
      .png()
      .toBuffer();
  };

  it("garde la face avant seule, aux proportions d'un boîtier, en JPEG", async () => {
    const face = await decouperFaceAvant(await scan());
    const { width, height, format } = await sharp(face).metadata();
    expect({ width, height, format }).toEqual({
      width: 487,
      height: 680,
      format: "jpeg",
    });
    const { dominant } = await sharp(face).stats();
    expect(dominant.b).toBeGreaterThan(200);
    expect(dominant.r).toBeLessThan(50);
  });

  it("ne garde aucune colonne de la tranche blanche quand elle déborde sur la face (bande blanche, Mario Party 8)", async () => {
    // Scans réels : la tranche blanche finit entre x = 539 et 545, au-delà de 1024 − 487 = 537.
    const blanc = 545;
    const scanReel = await sharp({
      create: { width: 1024, height: 680, channels: 3, background: "#ffffff" },
    })
      .composite([
        {
          input: {
            create: {
              width: 1024 - blanc,
              height: 680,
              channels: 3,
              background: "#2050c0",
            },
          },
          left: blanc,
          top: 0,
        },
      ])
      .png()
      .toBuffer();
    const face = await decouperFaceAvant(scanReel);
    const { width } = await sharp(face).metadata();
    expect(width).toBe(1024 - blanc);
    // Première colonne de la face : bleue, pas blanche.
    const { data } = await sharp(face)
      .extract({ left: 0, top: 0, width: 1, height: 680 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeLessThan(100);
  });

  it("refuse une image qui n'est pas une boîte dépliée", async () => {
    const portrait = await sharp({
      create: { width: 400, height: 600, channels: 3, background: "#fff" },
    })
      .png()
      .toBuffer();
    await expect(decouperFaceAvant(portrait)).rejects.toThrow(
      "boîte dépliée attendue",
    );
  });
});
