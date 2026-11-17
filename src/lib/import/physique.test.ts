import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import { lireListeWikipedia } from "./wikipedia";

const lire = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");
const { jeux, ecartes } = appliquerGameTdb(
  lireListeWikipedia(lire("wii-u-wikipedia.html")),
  regrouperGameTdb(lireGameTdb(lire("wiiutdb.xml"))),
);
const jeu = (titre: string) => jeux.find((j) => j.titres.US === titre)!;
const regions = (titre: string) =>
  Object.entries(jeu(titre).sorties)
    .filter(([, s]) => s !== null)
    .map(([r]) => r);

describe("appliquerGameTdb — règle du physique (fixtures réelles)", () => {
  it("garde 45 jeux de Wikipédia et ajoute 3 boîtes Nintendo absentes de la liste", () => {
    expect(jeux).toHaveLength(48);
    expect(jeux.filter((j) => j.wikipediaUrl === null)).toHaveLength(3);
  });

  it("une région sans boîte devient « non sortie » (Project Zero : pas de boîte US, eShop seulement)", () => {
    expect(regions("Fatal Frame: Maiden of Black Water")).toEqual([
      "JAP",
      "PAL",
    ]);
  });

  it("garde les dates de Wikipédia pour les régions en boîte", () => {
    const zelda = jeu("The Legend of Zelda: Breath of the Wild");
    expect(zelda.sorties.PAL).toMatchObject({ date: "2017-03-03" });
    expect(zelda.disques).toEqual({
      US: "ALZE01",
      JAP: "ALZJ01",
      PAL: "ALZP01",
    });
  });

  it("écarte les jeux sans boîte et ceux dont aucune boîte n'est de Nintendo, avec la raison", () => {
    expect(ecartes).toContainEqual({
      titre: "NES Remix 2",
      raison: "aucune boîte trouvée sur GameTDB",
    });
    expect(ecartes).toContainEqual({
      titre: "Shovel Knight",
      raison: "boîtes éditées par un autre que Nintendo",
    });
  });

  it("crée une fiche pour une compilation, avec les dates et titres de GameTDB", () => {
    const pack = jeu("NES Remix Pack");
    expect(pack.slug).toBe("nes-remix-pack");
    expect(pack.titres.PAL).toBe("NES Remix Pack");
    expect(regions("NES Remix Pack")).toEqual(["JAP", "US"]);
    expect(pack.sorties.US).toEqual({
      date: "2014-12-05",
      precision: "jour",
      editeur: "Nintendo",
    });
  });

  it("réunit les genres des disques de toutes les régions (Kirby : « plates-formes » en PAL seulement)", () => {
    const kirby = jeux.find(
      (j) => j.slug === "kirby-and-the-rainbow-paintbrush",
    );
    expect(kirby?.genres).toEqual(["Action", "Plates-formes"]);
  });
});
