import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { preparerApercu, retirerExclus } from "./apercu";
import { construireJeu } from "./donnees";
import { lireListeSwitch2 } from "./wikipedia-switch-2";

// Import Switch 2 (étape 10, SPEC v1.11 US-10) : liste Wikipédia du 18/11/2026 (fixture).
const liste = lireListeSwitch2(
  readFileSync(join(__dirname, "__fixtures__/switch-2-wikipedia.html"), "utf8"),
);
const jeu = (slug: string) => {
  const trouve = liste.jeux.find((j) => j.slug === slug);
  if (!trouve) throw new Error(`${slug} absent`);
  return trouve;
};

describe("liste Wikipédia Switch 2", () => {
  it("garde les jeux édités par Nintendo (seul ou avec un autre), datés au jour près", () => {
    expect(liste.jeux.map((j) => j.slug)).toContain("mario-kart-world");
    expect(liste.jeux.map((j) => j.slug)).toContain(
      "pokemon-legends-z-a-nintendo-switch-2-edition",
    );
    expect(liste.jeux.map((j) => j.slug)).toContain(
      "hyrule-warriors-age-of-imprisonment",
    );
    expect(liste.jeux).toHaveLength(30); // 34 jeux Nintendo, dont 4 sans date au jour près
    expect(liste.autresEditeurs).toBeGreaterThan(900);
  });

  it("une date commune aux 3 régions, éditeur, développeur, lien Wikipédia ; ni code produit ni jaquette", () => {
    const mkw = jeu("mario-kart-world");
    expect(mkw.developpeur).toBe("Nintendo EPD");
    expect(mkw.wikipediaUrl).toMatch(/\/wiki\/Mario_Kart_World$/);
    const { releases } = construireJeu(mkw, "");
    for (const r of ["JAP", "US", "PAL"] as const) {
      expect(releases[r]).toMatchObject({
        sortie: true,
        titre: "Mario Kart World",
        date_sortie: "2025-06-05",
        precision_date: "jour",
        editeur: "Nintendo",
        code_produit: null,
      });
    }
    expect(mkw.disques).toEqual({});
  });

  it("un jeu annoncé sans date précise (« 2027 », « Q2 2027 ») est ignoré, avec la date annoncée", () => {
    expect(liste.ecartes).toContainEqual({
      titre: "Kirby and the World Beyond",
      raison: "à venir (date annoncée : Q2 2027)",
    });
    expect(liste.jeux.map((j) => j.slug)).not.toContain("xenoblade-genesis");
  });

  it("un jeu daté dans le futur est ignoré par l'aperçu (à venir)", () => {
    const apercu = preparerApercu(
      { ...liste, telechargeables: [] },
      new Set(),
      new Set(),
      "2026-11-18",
    );
    expect(apercu.aVenir).toContain("Metroid Ravenous");
    expect(apercu.lignes.map((l) => l.slug)).not.toContain("metroid-ravenous");
  });
});

describe("exclusions (case « en boîte », SPEC v1.11)", () => {
  const apercu = preparerApercu(
    { ...liste, telechargeables: [] },
    new Set(),
    new Set(),
    "2026-11-18",
  );

  it("un jeu exclu n'est plus proposé, et reste listé pour être réactivé", () => {
    const filtre = retirerExclus(apercu, [
      { slug: "drag-x-drive", titre: "Drag x Drive" },
    ]);
    expect(filtre.lignes.map((l) => l.slug)).not.toContain("drag-x-drive");
    expect(filtre.lignes).toHaveLength(apercu.lignes.length - 1);
    expect(filtre.exclus).toEqual([
      { slug: "drag-x-drive", titre: "Drag x Drive" },
    ]);
  });
});
