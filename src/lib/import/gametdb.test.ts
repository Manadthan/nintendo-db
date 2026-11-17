import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cheminScan,
  codeProduit,
  indexerTitres,
  jeuxSansWikipedia,
  lireGameTdb,
  rapprocherGameTdb,
  regrouperGameTdb,
} from "./gametdb";
import { lireListeWikipedia } from "./wikipedia";

const xml = readFileSync(join(__dirname, "__fixtures__/wiiutdb.xml"), "utf8");
const disques = lireGameTdb(xml);
const jeux = regrouperGameTdb(disques);
const index = indexerTitres(jeux);
const wikipedia = lireListeWikipedia(
  readFileSync(join(__dirname, "__fixtures__/wii-u-wikipedia.html"), "utf8"),
);
const rapprocher = (titre: string) => rapprocherGameTdb([titre], index);

describe("lireGameTdb — base GameTDB réelle (fixture)", () => {
  it("lit un disque : identifiant, région, titre, éditeur, date", () => {
    expect(disques.find((d) => d.id === "ALZP01")).toEqual({
      id: "ALZP01",
      region: "PAL",
      titre: "The Legend of Zelda: Breath of the Wild",
      titreJaponais: null,
      editeur: "Nintendo",
      developpeur: "Nintendo",
      date: { date: "2017-03-03", precision: "jour" },
    });
  });

  it("ne garde que les disques en boîte : ni eShop, ni boîte à code de téléchargement", () => {
    const ids = disques.map((d) => d.id);
    expect(ids).not.toContain("WMGE"); // NES Remix, eShop
    expect(ids).not.toContain("WAFP01"); // Tipping Stars PAL : boîte contenant un code
    expect(ids).toContain("WAFJ01"); // Tipping Stars JAP : vrai disque
  });

  it("lit le titre japonais d'un disque japonais", () => {
    expect(disques.find((d) => d.id === "ALZJ01")).toMatchObject({
      titre: "Zelda no Densetsu: Breath of the Wild",
      titreJaponais: "ゼルダの伝説 ブレス オブ ザ ワイルド",
    });
  });

  it("lit la région dans le champ region, pas dans l'identifiant (AX5D01 est PAL)", () => {
    expect(disques.find((d) => d.id === "AX5D01")?.region).toBe("PAL");
  });
});

describe("regrouperGameTdb", () => {
  it("réunit les 3 régions d'un jeu par les 3 premiers caractères", () => {
    const zelda = jeux.get("ALZ")!;
    expect(zelda.nintendo).toBe(true);
    expect(
      Object.fromEntries(
        Object.entries(zelda.disques).map(([r, d]) => [r, d!.id]),
      ),
    ).toEqual({ US: "ALZE01", JAP: "ALZJ01", PAL: "ALZP01" });
  });

  it("repère un jeu dont aucune boîte n'est éditée par Nintendo (Shovel Knight)", () => {
    expect(jeux.get("WKN")?.nintendo).toBe(false);
  });
});

describe("rapprocherGameTdb", () => {
  it("retrouve un jeu par son titre, ponctuation et casse comprises", () => {
    expect(rapprocher("the legend of zelda breath of the wild")?.base).toBe(
      "ALZ",
    );
  });

  it("donne la sortie japonaise d'un jeu dont le titre japonais diffère", () => {
    expect(rapprocher("Xenoblade Chronicles X")?.disques.JAP?.id).toBe(
      "AX5J01",
    );
  });

  it("ne garde qu'une sortie en boîte par région (Wii Karaoke U : Japon seulement)", () => {
    expect(Object.keys(rapprocher("Wii Karaoke U")!.disques)).toEqual(["JAP"]);
  });

  it("ne trouve rien pour un jeu vendu seulement en téléchargement (NES Remix 2)", () => {
    expect(rapprocher("NES Remix 2")).toBeNull();
  });

  it("rapproche presque toute la liste Wikipédia (fixture : 46 jeux sur 50)", () => {
    const trouves = wikipedia.filter((j) =>
      rapprocherGameTdb([j.titres.US, j.titres.PAL], index),
    );
    expect(trouves).toHaveLength(46);
  });
});

describe("jeuxSansWikipedia", () => {
  it("donne les boîtes Nintendo absentes de la liste Wikipédia, dont les compilations", () => {
    const bases = new Set(
      wikipedia
        .map((j) => rapprocherGameTdb([j.titres.US, j.titres.PAL], index))
        .filter((j) => j !== null)
        .map((j) => j.base),
    );
    const titres = jeuxSansWikipedia(jeux, bases).map(
      (j) => Object.values(j.disques)[0]!.titre,
    );
    expect(titres).toContain("NES Remix Pack");
    expect(titres).toContain("New Super Mario Bros. U + New Super Luigi U");
    expect(titres).not.toContain("Shovel Knight");
  });
});

describe("codeProduit, cheminScan", () => {
  it("déduit le code imprimé sur la boîte", () => {
    expect(codeProduit("ALZP01")).toBe("WUP-P-ALZP");
    expect(codeProduit("WKNPAY")).toBe("WUP-P-WKNP");
  });

  it("donne le chemin du scan déposé par le relais, et refuse un identifiant douteux", () => {
    expect(cheminScan("ALZP01")).toBe("scans/ALZP01.jpg");
    expect(() => cheminScan("../x01")).toThrow("invalide");
  });
});
