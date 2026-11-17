import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  choisirJaquettes,
  construireJeu,
  fusionner,
  type JeuEnBase,
} from "./donnees";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";
import { lireListeWikipedia } from "./wikipedia";

const lire = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom), "utf8");
const { jeux: wiki } = appliquerGameTdb(
  lireListeWikipedia(lire("wii-u-wikipedia.html")),
  regrouperGameTdb(lireGameTdb(lire("wiiutdb.xml"))),
);
const KARAOKE = wiki.find((j) => j.slug === "wii-karaoke-u")!;
const KIRBY = wiki.find((j) => j.slug === "kirby-and-the-rainbow-paintbrush")!;

describe("construireJeu (US-10)", () => {
  it("assemble Wikipédia (dates, titres NA/PAL, éditeurs) et GameTDB (titre japonais, romanisation, code produit)", () => {
    const jeu = construireJeu(KIRBY);
    expect(jeu.game).toEqual({
      slug: "kirby-and-the-rainbow-paintbrush",
      developpeur: "HAL Laboratory, Nintendo SPD",
      wikipedia_url:
        "https://en.wikipedia.org/wiki/Kirby_and_the_Rainbow_Curse",
      physique: true,
    });
    expect(jeu.releases.JAP).toEqual({
      sortie: true,
      titre: "タッチ! カービィ スーパーレインボー",
      titre_romanise: "Touch! Kirby Super Rainbow",
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

  it("note « non sorti » une région sans boîte, sans titre ni date", () => {
    expect(construireJeu(KARAOKE).releases.US).toEqual({
      sortie: false,
      titre: null,
      titre_romanise: null,
      date_sortie: null,
      precision_date: null,
      editeur: null,
      code_produit: null,
    });
  });

  it("sans titre japonais connu, garde le titre anglais (jamais de sortie sans titre)", () => {
    const sansJaponais = { ...KARAOKE, japonais: null };
    expect(construireJeu(sansJaponais).releases.JAP).toMatchObject({
      sortie: true,
      titre: "Wii Karaoke U",
      titre_romanise: null,
    });
  });
});

describe("fusionner — corrections manuelles (US-10, ADR-03 point 4)", () => {
  const nouveau = construireJeu(KARAOKE);
  const existant: JeuEnBase = {
    id: "20000000-0000-0000-0000-000000000004",
    developpeur: "Xing (corrigé)",
    wikipedia_url: null,
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
    expect(f.releases.JAP.titre).toBe("WiiカラオケU トライアルディスク");
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

describe("choisirJaquettes (ADR-04, R6)", () => {
  const scan = (id: string) => `scans/${id}.jpg`;

  it("copie le scan de la boîte de chaque région sortie", () => {
    expect(choisirJaquettes(construireJeu(KIRBY), KIRBY.disques, null)).toEqual(
      {
        JAP: scan(KIRBY.disques.JAP!),
        US: scan(KIRBY.disques.US!),
        PAL: scan(KIRBY.disques.PAL!),
      },
    );
  });

  it("ne touche ni aux régions non sorties, ni aux jaquettes ajoutées à la main ou déjà scannées", () => {
    const existantes = {
      JAP: { path: "x/jap", source: "photo" as const },
      US: { path: "x/us", source: "gametdb" as const },
    };
    expect(
      choisirJaquettes(construireJeu(KIRBY), KIRBY.disques, existantes),
    ).toEqual({ JAP: null, US: null, PAL: scan(KIRBY.disques.PAL!) });
    expect(
      choisirJaquettes(construireJeu(KARAOKE), KARAOKE.disques, null),
    ).toMatchObject({ US: null, PAL: null });
  });

  it("remplace une ancienne image IGDB par le scan", () => {
    const choix = choisirJaquettes(construireJeu(KIRBY), KIRBY.disques, {
      PAL: { path: "x/pal", source: "igdb" },
    });
    expect(choix.PAL).toBe(scan(KIRBY.disques.PAL!));
  });

  it("sur demande, recopie les scans (nouvelle taille d'image), jamais les ajouts à la main", () => {
    const choix = choisirJaquettes(
      construireJeu(KIRBY),
      KIRBY.disques,
      {
        JAP: { path: "x/jap", source: "url" },
        US: { path: "x/us", source: "gametdb" },
      },
      true,
    );
    expect(choix).toEqual({
      JAP: null,
      US: scan(KIRBY.disques.US!),
      PAL: scan(KIRBY.disques.PAL!),
    });
  });
});
