import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  adresseCouverture,
  adresseGoogleBooks,
  compact,
  consolesCitees,
  dateNdl,
  estGuide,
  idGoogleBooks,
  isbn13,
  jugerLivre,
  liensAchat,
  pagesNdl,
  fichierPlanche,
  filtrerJeuxGuide,
  lireReglesLiens,
  type JeuCherche,
} from "./guides";
import { lireNdl } from "./ndl";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");

/** Titres JAP d'autres jeux du catalogue, pour la règle « titre plus long d'un autre jeu ». */
const AUTRES = [
  "ゼノブレイドクロス",
  "ゼノブレイド ディフィニティブ・エディション",
  "ゼノブレイド2",
  "ゼノブレイド3",
  "Hey!ピクミン",
  "スプラトゥーン2",
];

/** Guides gardés pour un jeu dans une réponse NDL. */
function gardes(fichier: string, jeu: JeuCherche): string[] {
  return lireNdl(fixture(fichier))
    .filter(
      (l) =>
        jugerLivre(
          {
            titre: l.titre,
            isbn: l.isbn,
            annee: Number(l.parution?.slice(0, 4)) || null,
            ndc: l.ndc,
          },
          jeu,
          AUTRES.filter((a) => !jeu.titres.includes(a)),
        ).garde,
    )
    .map((l) => l.titre);
}

describe("isbn13", () => {
  it("ramène un ISBN à 10 chiffres à 13, tirets retirés", () => {
    expect(isbn13("4-09-106025-0")).toBe("9784091060259");
    expect(isbn13("978-4-04-733692-6")).toBe("9784047336926");
  });
  it("refuse une clé de contrôle fausse ou un texte quelconque", () => {
    expect(isbn13("978-4-04-733692-7")).toBeNull();
    expect(isbn13("4-09-106025-1")).toBeNull();
    expect(isbn13(null)).toBeNull();
    expect(isbn13("c2009")).toBeNull();
  });
});

describe("estGuide", () => {
  it("garde un guide et écarte artbooks, magazines, suppléments et partitions (SPEC US-28)", () => {
    expect(estGuide("ゼノブレイド3パーフェクトガイド", ["798.5"])).toBe(true);
    expect(estGuide("スプラトゥーン3イカすアートブック", ["798.5"])).toBe(
      false,
    );
    expect(estGuide("THE ART OF SUPER MARIO ODYSSEY", ["798.5"])).toBe(false);
    expect(
      estGuide(
        "ゼノブレイド3オフィシャルアートワークスアイオニオン・モーメント",
        ["798.5"],
      ),
    ).toBe(false);
    expect(
      estGuide("THE EYES OF BAYONETTA 3 : ベヨネッタ3公式設定資料集", [
        "798.5",
      ]),
    ).toBe(false);
    expect(estGuide("バンカラウォーカーバイスプラトゥーン3", ["798.5"])).toBe(
      false,
    );
    expect(
      estGuide(
        "スプラトゥーン3最強チーム作戦立案BOOK : 2022年月刊コロコロ12月号ふろく",
        [],
      ),
    ).toBe(false);
    expect(estGuide("ピアノで楽しむスプラトゥーン3", ["763"])).toBe(false);
  });
  it("sans NDC, il faut un mot de guide dans le titre", () => {
    expect(estGuide("ゼノブレイドクロスオフィシャルガイド", [])).toBe(true);
    expect(estGuide("ピクミン100ぴきとすごす30日", [])).toBe(false);
  });
  it("écarte carnets de motifs, recueils de visuels et imagiers (planche 3DS du 25/11)", () => {
    for (const titre of [
      "とびだせどうぶつの森デザインブック : 村メロもあるよ!",
      "NewらくらくデザインBOOK : どうぶつの森ハッピーホームデザイナーオリジナルマイデザイン",
      "ファイアーエムブレムifビジュアル資料集ペルシード・クリスタル",
      "とびだせどうぶつの森amiibo+どうぶつずかん",
    ])
      expect(estGuide(titre, ["798.5"])).toBe(false);
    expect(estGuide("とびだせどうぶつの森超完全カタログ", ["798.5"])).toBe(
      true,
    );
    expect(estGuide("ポケモン全国図鑑公式ガイドブック", ["798.5"])).toBe(true);
  });
});

describe("consolesCitees", () => {
  it("ne prend pas le « 64 » ou le « 3D » du titre du jeu pour une console", () => {
    expect(
      consolesCitees(
        "スターフォックス64 3D : 任天堂公式ガイドブック : NINTENDO3DS",
        ["スターフォックス64 3D"],
      ),
    ).toEqual(new Set(["3ds"]));
  });
  it("distingue 3DS et DS, Switch et Wii", () => {
    expect(
      consolesCitees(
        "ピクミン3デラックスオフィシャルガイド : NINTENDO SWITCH",
        [],
      ),
    ).toEqual(new Set(["switch"]));
    expect(
      consolesCitees("ゼノブレイド : 任天堂公式ガイドブック : Wii", []),
    ).toEqual(new Set(["wii"]));
  });
  it("reconnaît les abréviations rétro (FC, Disk System, SFC, 任天堂64, GB, GBC, Famicom Mini→GBA)", () => {
    expect(consolesCitees("ゼルダの伝説 : ディスクシステム攻略本", [])).toEqual(
      new Set(["nes"]),
    );
    expect(consolesCitees("ファイアーエムブレム FC版完全攻略", [])).toEqual(
      new Set(["nes"]),
    );
    expect(consolesCitees("スーパーメトロイド SFC攻略ガイド", [])).toEqual(
      new Set(["snes"]),
    );
    expect(
      consolesCitees("スーパーマリオ64 : 任天堂64公式ガイド", [
        "スーパーマリオ64",
      ]),
    ).toEqual(new Set(["n64"]));
    expect(
      consolesCitees("ポケットモンスター金・銀 GBカラー公式ガイド", []),
    ).toEqual(new Set(["gbc"]));
    expect(consolesCitees("星のカービィ GB版攻略ガイド", [])).toEqual(
      new Set(["gb"]),
    );
    expect(consolesCitees("ファミコンミニ完全攻略ガイド", [])).toEqual(
      new Set(["gba"]),
    );
    expect(consolesCitees("16GB対応メモリー完全ガイド", [])).toEqual(new Set());
  });
});

describe("jugerLivre sur des réponses NDL réelles", () => {
  it("Splatoon 3 : les guides, sans artbook, magazine, supplément ni partition", () => {
    expect(
      gardes("ndl-splatoon-3.xml", {
        console: "switch",
        titres: ["スプラトゥーン3", "Splatoon 3"],
        annee: 2022,
      }),
    ).toEqual([
      "ゲーム攻略大全スペシャル : スプラトゥーン3最新テク徹底攻略",
      "スプラトゥーン3イカす攻略パラダイス",
      "超人気ゲーム究極攻略大全特集スプラトゥーン3完全ガイド : Switch版大人気のシューターゲームを完全攻略! : ふりがな付き",
      "超人気ナワバリバトル最強攻略ガイドスプラトゥーン3",
      "超人気ナワバリバトル対戦攻略ガイドスプラトゥーン3ウデマエUP虎の巻",
    ]);
  });
  it("Xenoblade Chronicles 3D : ni Xenoblade X, ni la version Wii, ni la Definitive Edition, ni les suites", () => {
    expect(
      gardes("ndl-xenoblade.xml", {
        console: "3ds",
        titres: ["ゼノブレイド"],
        annee: 2015,
      }),
    ).toEqual([]);
  });
  it("Xenoblade Chronicles (Wii) : ses deux guides de 2010", () => {
    expect(
      gardes("ndl-xenoblade.xml", {
        console: "wii",
        titres: ["ゼノブレイド"],
        annee: 2010,
      }),
    ).toEqual([
      "ゼノブレイドザ・コンプリートガイド",
      "ゼノブレイド : 任天堂公式ガイドブック : Wii",
    ]);
  });
  it("Pikmin 4 : le guide au titre en lettres latines (« PIKMIN4 »)", () => {
    expect(
      gardes("ndl-pikmin.xml", {
        console: "switch",
        titres: ["ピクミン4", "Pikmin 4"],
        annee: 2023,
      }),
    ).toEqual(["PIKMIN4パーフェクトガイド"]);
  });
  it("Pikmin (GameCube) : ni les suites, ni Hey! Pikmin, ni les livres de chansons", () => {
    expect(
      gardes("ndl-pikmin.xml", {
        console: "gamecube",
        titres: ["ピクミン"],
        annee: 2001,
      }),
    ).toEqual([
      "オリマーの惑星観察記 : ピクミン完全攻略ガイド",
      "ピクミン : 任天堂公式ガイドブック",
    ]);
  });
  it("un livre sans ISBN n'entre jamais", () => {
    expect(
      jugerLivre(
        {
          titre: "スプラトゥーン3攻略",
          isbn: null,
          annee: 2022,
          ndc: ["798.5"],
        },
        { console: "switch", titres: ["スプラトゥーン3"], annee: 2022 },
        [],
      ),
    ).toEqual({ garde: false, raison: "sans-isbn" });
  });
});

describe("lireNdl", () => {
  it("lit titre, éditeur, parution, pages, ISBN, NDC et notice", () => {
    const pikmin4 = lireNdl(fixture("ndl-pikmin.xml")).find(
      (l) => l.titre === "PIKMIN4パーフェクトガイド",
    );
    expect(pikmin4).toMatchObject({
      editeur: "KADOKAWA Game Linkage",
      parution: "2023.11",
      pages: "367p",
      isbn: "978-4-04-733692-6",
      ndc: ["798.5"],
    });
    expect(pikmin4?.lien).toMatch(/^https:\/\/ndlsearch\.ndl\.go\.jp\//);
  });
});

describe("dates, pages, adresses", () => {
  it("dateNdl et pagesNdl", () => {
    expect(dateNdl("2023.11")).toEqual({
      date: "2023-11-01",
      precision: "mois",
    });
    expect(dateNdl("2004")).toEqual({ date: "2004-01-01", precision: "annee" });
    expect(dateNdl("2022.12.5")).toEqual({
      date: "2022-12-05",
      precision: "jour",
    });
    expect(dateNdl("?")).toBeNull();
    expect(pagesNdl("67p ; 15×11cm")).toBe(67);
    expect(pagesNdl(null)).toBeNull();
  });
  it("couverture et page Google Books, liens d'achat par ISBN", () => {
    expect(adresseCouverture("W6E70AEACAAJ")).toBe(
      "https://books.google.com/books/content?id=W6E70AEACAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200",
    );
    expect(adresseGoogleBooks("W6E70AEACAAJ")).toBe(
      "https://books.google.com/books?id=W6E70AEACAAJ",
    );
    expect(liensAchat("9784047336926")).toEqual({
      amazon: "https://www.amazon.co.jp/s?k=9784047336926",
      surugaya: "https://www.suruga-ya.jp/search?search_word=9784047336926",
    });
  });
  it("idGoogleBooks : seulement un livre qui a une vignette", () => {
    expect(
      idGoogleBooks(JSON.parse(fixture("google-9784047336926.json"))),
    ).toBe("W6E70AEACAAJ");
    expect(
      idGoogleBooks(JSON.parse(fixture("google-9784866906911.json"))),
    ).toBeNull();
    expect(idGoogleBooks({ totalItems: 0 })).toBeNull();
  });
  it("compact", () => {
    expect(compact("PIKMIN 4")).toBe("pikmin4");
  });
});

// Bug du 25/11/2026 : « --ecrire dossier --sauf … » a relu guides-3ds.json au lieu de
// guides-switch.json (premier fichier trouvé), et appliqué les numéros Switch à la 3DS.
describe("fichierPlanche (fichier relu par l'écriture)", () => {
  it("nomme le fichier de la console demandée", () => {
    expect(fichierPlanche("switch", "switch")).toBe("guides-switch.json");
  });
  it("refuse une écriture sans console", () => {
    expect(() => fichierPlanche("", undefined)).toThrow(/--console/);
  });
  it("refuse un fichier d'une autre console", () => {
    expect(() => fichierPlanche("switch", "3ds")).toThrow(/3ds/);
  });
});

describe("lireReglesLiens et filtrerJeuxGuide (ajustement des liens jeu ↔ guide)", () => {
  it("lit plusieurs règles n:slug et regroupe par numéro", () => {
    const r = lireReglesLiens("18:mario-bros,43:pokemon-yellow,43:autre-jeu");
    expect([...(r.get(18) ?? [])]).toEqual(["mario-bros"]);
    expect([...(r.get(43) ?? [])]).toEqual(["pokemon-yellow", "autre-jeu"]);
    expect(lireReglesLiens("").size).toBe(0);
    expect(lireReglesLiens(null).size).toBe(0);
  });

  it("refuse une règle mal formée ou un numéro nul", () => {
    expect(() => lireReglesLiens("18")).toThrow(/invalide/);
    expect(() => lireReglesLiens("0:mario-bros")).toThrow(/invalide/);
    expect(() => lireReglesLiens("18:Mario_Bros")).toThrow(/invalide/);
  });

  it("retire les jeux erronés avec --sans-jeu et refuse de tout retirer", () => {
    const jeux = [
      { id: "1", slug: "mario-bros" },
      { id: "2", slug: "super-mario-bros" },
    ];
    expect(
      filtrerJeuxGuide(
        jeux,
        18,
        lireReglesLiens("18:mario-bros"),
        new Map(),
        new Map(),
      ),
    ).toEqual([{ id: "2", slug: "super-mario-bros" }]);

    expect(() =>
      filtrerJeuxGuide(
        [{ id: "1", slug: "mario-bros" }],
        18,
        lireReglesLiens("18:mario-bros"),
        new Map(),
        new Map(),
      ),
    ).toThrow(/tous les jeux/);
  });

  it("réassocie vers le bon jeu de la console avec --remplacer-jeu", () => {
    const jeuxParSlug = new Map([
      ["pokemon-stadium-2", { id: "ps2", slug: "pokemon-stadium-2" }],
    ]);
    expect(
      filtrerJeuxGuide(
        [{ id: "ps1", slug: "pocket-monsters-stadium" }],
        118,
        new Map(),
        lireReglesLiens("118:pokemon-stadium-2"),
        jeuxParSlug,
      ),
    ).toEqual([{ id: "ps2", slug: "pokemon-stadium-2" }]);

    expect(() =>
      filtrerJeuxGuide(
        [{ id: "ps1", slug: "pocket-monsters-stadium" }],
        118,
        new Map(),
        lireReglesLiens("118:jeu-inexistant"),
        jeuxParSlug,
      ),
    ).toThrow(/jeu inconnu/);
  });
});
