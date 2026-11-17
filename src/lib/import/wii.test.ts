import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceConsole } from "./consoles";
import { choisirJaquettes, construireJeu } from "./donnees";
import { lireGameTdb, regrouperGameTdb } from "./gametdb";
import { appliquerGameTdb } from "./physique";

// Import Wii (étape 8, SPEC v1.9 US-10) : GameTDB seul, sur la fixture réduite du 17/11/2026.
const WII = sourceConsole("wii");
const disques = lireGameTdb(
  readFileSync(join(__dirname, "__fixtures__/wiitdb.xml"), "utf8"),
  WII.estDisque,
);
const { jeux, ecartes } = appliquerGameTdb([], regrouperGameTdb(disques));
const jeu = (slug: string) => {
  const trouve = jeux.find((j) => j.slug === slug);
  if (!trouve) throw new Error(`${slug} absent`);
  return trouve;
};

describe("import Wii depuis GameTDB seul", () => {
  it("lit les 233 disques du commerce (sans le Wii Startup Disc, #90) et retient les 87 jeux Nintendo, chacun à une adresse distincte", () => {
    expect(disques).toHaveLength(233);
    expect(jeux).toHaveLength(87);
    expect(new Set(jeux.map((j) => j.slug)).size).toBe(87);
    expect(ecartes).toEqual([]);
  });

  it("Mario Kart Wii : titres, dates, titre japonais, développeur, genres, sans lien Wikipédia", () => {
    const mk = jeu("mario-kart-wii");
    expect(mk.titres).toEqual({ US: "Mario Kart Wii", PAL: "Mario Kart Wii" });
    expect(mk.japonais).toEqual({
      titre: "マリオカートWii",
      romanise: "Mario Kart Wii",
    });
    expect(mk.sorties.JAP).toMatchObject({
      date: "2008-04-10",
      precision: "jour",
    });
    expect(mk.developpeur).toBe("Nintendo EAD");
    expect(mk.genres).toContain("Karting");
    expect(mk.wikipediaUrl).toBeNull();
  });

  it("code produit Wii : RVL- + 4 caractères, pour chaque région", () => {
    const releases = construireJeu(
      jeu("mario-kart-wii"),
      WII.prefixeCode,
    ).releases;
    expect(releases.PAL.code_produit).toBe("RVL-RMCP");
    expect(releases.US.code_produit).toBe("RVL-RMCE");
    expect(releases.JAP.code_produit).toBe("RVL-RMCJ");
  });

  it("jaquettes : faces avant déposées par le relais dans wii/faces", () => {
    const mk = jeu("mario-kart-wii");
    expect(
      choisirJaquettes(
        construireJeu(mk, WII.prefixeCode),
        mk.disques,
        null,
        false,
        WII.scans,
      ),
    ).toEqual({
      JAP: "wii/faces/RMCJ01.jpg",
      US: "wii/faces/RMCE01.jpg",
      PAL: "wii/faces/RMCP01.jpg",
    });
  });

  it("garde un jeu édité par Nintendo dans une seule région, avec toutes ses régions (SPEC v1.9)", () => {
    const ms = jeu("mario-sonic-at-the-olympic-games");
    expect(ms.sorties.JAP?.editeur).toBe("Nintendo");
    expect(ms.sorties.US?.editeur).toBe("Sega of America");
    expect(ms.sorties.PAL?.editeur).toBe("Sega");
  });

  it("écarte les disques qui ne sont pas des jeux : genre GameTDB « software » (Wii Startup Disc)", () => {
    expect(jeux.map((j) => j.slug)).not.toContain("wii-startup-disc");
    expect(disques.map((d) => d.id)).not.toContain("RAAE01");
  });

  it("un jeu sorti au Japon seulement n'a pas de sortie US ni PAL", () => {
    const cr = jeu("captain-rainbow");
    expect(cr.sorties.US).toBeNull();
    expect(cr.sorties.PAL).toBeNull();
    expect(cr.japonais?.titre).toBe("キャプテン★レインボー");
  });
});
