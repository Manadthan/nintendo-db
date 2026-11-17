import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  choisirJaquettes,
  construireJeu,
  fusionner,
  type JeuEnBase,
} from "./donnees";
import { rapprocher, versInfosIgdb, type ResultatIgdb } from "./igdb";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import { lireListeWikipedia } from "./wikipedia";

const lire = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");
const { jeux: wiki } = appliquerGameTdb(
  lireListeWikipedia(lire("wii-u-wikipedia.html")),
  regrouperGameTdb(lireGameTdb(lire("wiiutdb.xml"))),
);
const igdb = (nom: string, titre: string) => {
  const reponse: ResultatIgdb[] = JSON.parse(
    readFileSync(join(__dirname, `__fixtures__/igdb/${nom}.json`), "utf8"),
  ).reponse;
  return versInfosIgdb(rapprocher([titre], reponse).jeu!);
};
const KARAOKE = wiki.find((j) => j.slug === "wii-karaoke-u")!;
const KIRBY = wiki.find((j) => j.slug === "kirby-and-the-rainbow-paintbrush")!;

describe("construireJeu (US-10)", () => {
  it("assemble Wikipédia (dates, titres NA/PAL, éditeurs) et IGDB (titre japonais, romanisation, lien)", () => {
    const jeu = construireJeu(
      KIRBY,
      igdb("kirby-and-the-rainbow-paintbrush", "Kirby and the Rainbow Curse"),
    );
    expect(jeu.game).toEqual({
      slug: "kirby-and-the-rainbow-paintbrush",
      developpeur: "HAL Laboratory, Nintendo SPD",
      wikipedia_url:
        "https://en.wikipedia.org/wiki/Kirby_and_the_Rainbow_Curse",
      igdb_id: 7338,
      physique: true,
    });
    expect(jeu.releases.JAP).toEqual({
      sortie: true,
      titre: "タッチ！カービィ スーパーレインボー",
      titre_romanise: "Kirby and the Rainbow Curse",
      date_sortie: "2015-01-22",
      precision_date: "jour",
      editeur: "Nintendo",
      code_produit: `WUP-P-${KIRBY.disques.JAP!.slice(0, 4)}`,
    });
    expect(jeu.releases.US).toMatchObject({
      sortie: true,
      titre: "Kirby and the Rainbow Curse",
      titre_romanise: null,
    });
    expect(jeu.releases.PAL).toMatchObject({
      titre: "Kirby and the Rainbow Paintbrush",
      date_sortie: "2015-05-08",
    });
  });

  it("note « non sorti » une région absente, sans titre ni date", () => {
    expect(construireJeu(KARAOKE, null).releases.US).toEqual({
      sortie: false,
      titre: null,
      titre_romanise: null,
      date_sortie: null,
      precision_date: null,
      editeur: null,
      code_produit: null,
    });
  });

  it("sans IGDB, garde le titre anglais pour une sortie japonaise (jamais de sortie sans titre)", () => {
    expect(construireJeu(KARAOKE, null).releases.JAP).toMatchObject({
      sortie: true,
      titre: "Wii Karaoke U",
    });
    expect(construireJeu(KARAOKE, null).game.igdb_id).toBeNull();
  });
});

describe("fusionner — corrections manuelles (US-10, ADR-03 point 4)", () => {
  const nouveau = construireJeu(
    KARAOKE,
    igdb("wii-karaoke-u", "Wii Karaoke U"),
  );
  const existant: JeuEnBase = {
    id: "20000000-0000-0000-0000-000000000004",
    developpeur: "Xing (corrigé)",
    wikipedia_url: null,
    igdb_id: null,
    physique: true,
    verrous: ["developpeur"],
    releases: {
      JAP: {
        titre: "Wii カラオケ U",
        titre_romanise: "Wii Karaoke U",
        date_sortie: "2012-12-08",
        precision_date: "jour",
        editeur: "Nintendo",
        sortie: true,
        verrous: [],
        jaquette_path: null,
        jaquette_source: null,
        code_produit: null,
      },
      US: {
        titre: null,
        titre_romanise: null,
        date_sortie: null,
        precision_date: null,
        editeur: null,
        sortie: false,
        verrous: [],
        jaquette_path: null,
        jaquette_source: null,
        code_produit: null,
      },
      PAL: {
        titre: "Mon titre",
        titre_romanise: null,
        date_sortie: "2013-10-04",
        precision_date: "jour",
        editeur: "Nintendo",
        sortie: true,
        verrous: ["titre"],
        jaquette_path: null,
        jaquette_source: null,
        code_produit: null,
      },
    },
  };

  it("met à jour les champs non verrouillés (ex. titre japonais faux des données de départ)", () => {
    const f = fusionner(existant, nouveau);
    expect(f.releases.JAP.titre).toBe("カラオケJoysound for Wii U");
    expect(f.game.wikipedia_url).toBe(
      "https://en.wikipedia.org/wiki/Wii_Karaoke_U",
    );
  });

  it("ne remplace jamais un champ verrouillé, et signale l'écart", () => {
    const f = fusionner(existant, nouveau);
    expect(f.game).not.toHaveProperty("developpeur");
    expect(f.releases.PAL).not.toHaveProperty("titre");
    expect(f.ecarts).toEqual([
      "developpeur : « Xing (corrigé) » gardé (import : « Xing »)",
      // Wii Karaoke U n'est sorti en PAL qu'en téléchargement : l'import propose « non sorti ».
      "PAL titre : « Mon titre » gardé (import : « — »)",
    ]);
  });

  it("écrit tout pour un nouveau jeu, sans écart", () => {
    const f = fusionner(null, nouveau);
    expect(f.game.developpeur).toBe("Xing");
    expect(f.ecarts).toEqual([]);
  });
});

describe("choisirJaquettes (ADR-04, R2, R6)", () => {
  const scans = (id: string, langues: string[]) =>
    langues.map((l) => ({
      source: "gametdb",
      url: `https://art.gametdb.com/wiiu/coverHQ/${l}/${id}.jpg`,
    }));

  it("essaie d'abord le scan de la boîte, puis l'image IGDB de la région, ou la principale en secours", () => {
    const infos = igdb(
      "kirby-and-the-rainbow-paintbrush",
      "Kirby and the Rainbow Curse",
    );
    const jeu = construireJeu(KIRBY, infos);
    expect(choisirJaquettes(jeu, KIRBY.disques, infos, null)).toEqual({
      JAP: [
        ...scans(KIRBY.disques.JAP!, ["JA"]),
        { source: "igdb", imageId: "co1wcc", secours: true },
      ],
      US: [
        ...scans(KIRBY.disques.US!, ["US"]),
        { source: "igdb", imageId: "co1wcc", secours: false },
      ],
      PAL: [
        ...scans(KIRBY.disques.PAL!, ["EN", "FR", "DE"]),
        { source: "igdb", imageId: "cob8mp", secours: false },
      ],
    });
  });

  it("ne touche ni aux régions non sorties, ni aux jaquettes ajoutées à la main ou déjà scannées", () => {
    const infos = igdb(
      "kirby-and-the-rainbow-paintbrush",
      "Kirby and the Rainbow Curse",
    );
    const jeu = construireJeu(KIRBY, infos);
    const existantes = {
      JAP: { path: "x/jap", source: "photo" as const },
      US: { path: "x/us", source: "gametdb" as const },
    };
    expect(
      choisirJaquettes(jeu, KIRBY.disques, infos, existantes),
    ).toMatchObject({
      JAP: null,
      US: null,
    });
    expect(
      choisirJaquettes(
        construireJeu(KARAOKE, null),
        KARAOKE.disques,
        null,
        null,
      ),
    ).toMatchObject({ US: null, PAL: null });
  });

  it("remplace une image IGDB déjà copiée par le scan, jamais par une autre image IGDB", () => {
    const infos = igdb(
      "kirby-and-the-rainbow-paintbrush",
      "Kirby and the Rainbow Curse",
    );
    const jeu = construireJeu(KIRBY, infos);
    const choix = choisirJaquettes(jeu, KIRBY.disques, infos, {
      PAL: { path: "x/pal", source: "igdb" },
    });
    expect(choix.PAL).toEqual(scans(KIRBY.disques.PAL!, ["EN", "FR", "DE"]));
  });
});
