import { describe, expect, it } from "vitest";
import {
  calculerBadges,
  prochainsBadges,
  type Badge,
} from "@/lib/badges/badges";
import { ensemble } from "@/lib/collection/collection";
import type { Region } from "@/lib/catalogue/types";
import type { JeuStat } from "@/lib/statistiques/statistiques";

/** Catalogue fabriqué : `n` jeux d'une console, éventuellement d'une série. */
const jeux = (console: string, n: number, series: string[] = []): JeuStat[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${console}-${i}`,
    titre: `${console} ${i}`,
    console: { slug: console, nom: console.toUpperCase() },
    metacritic: null,
    sorties: ["JAP", "US", "PAL"],
    sansJaquette: [],
    sansCode: [],
    firstParty: true,
    series,
  }));
const consoles = [
  { slug: "n64", nom: "N64" },
  { slug: "vb", nom: "VB" },
];
const possessions = (ids: string[], regions: Region[] = ["PAL"]) =>
  ensemble(
    ids.flatMap((id) => regions.map((region) => ({ game_id: id, region }))),
  );
const ids = (liste: JeuStat[], n: number) => liste.slice(0, n).map((j) => j.id);
const gagnes = (b: Badge[]) => b.filter((x) => x.gagne).map((x) => x.nom);

describe("calculerBadges (US-24)", () => {
  const n64 = jeux("n64", 30);
  const vb = jeux("vb", 4);
  const catalogue = [...n64, ...vb];

  it("paliers du total : un jeu compte dès une version possédée", () => {
    const b = calculerBadges(catalogue, consoles, possessions(ids(n64, 12)));
    expect(gagnes(b)).toContain("Débutant");
    expect(gagnes(b)).not.toContain("Amateur");
    expect(b.find((x) => x.id === "total-25")).toMatchObject({
      actuel: 12,
      objectif: 25,
    });
  });

  it("se perdent quand on décoche", () => {
    const b = calculerBadges(catalogue, consoles, possessions(ids(n64, 9)));
    expect(gagnes(b)).not.toContain("Débutant");
  });

  it("par console : 10 jeux, la moitié, tous ; pas de « 10 jeux » pour une console qui en a 10 ou moins", () => {
    const b = calculerBadges(
      catalogue,
      consoles,
      possessions([...ids(n64, 15), ...vb.map((j) => j.id)]),
    );
    expect(gagnes(b)).toEqual(
      expect.arrayContaining([
        "Collectionneur N64",
        "Moitié N64",
        "Moitié VB",
        "Complet VB",
      ]),
    );
    expect(gagnes(b)).not.toContain("Complet N64");
    expect(b.some((x) => x.id === "console-10-vb")).toBe(false);
  });

  it("« Complet » se perd si un jeu est ajouté à la console", () => {
    const tous = possessions(vb.map((j) => j.id));
    expect(gagnes(calculerBadges(vb, consoles, tous))).toContain("Complet VB");
    expect(
      gagnes(
        calculerBadges([...vb, ...jeux("vb", 5).slice(4)], consoles, tous),
      ),
    ).not.toContain("Complet VB");
  });

  it("série complète : séries d'au moins 3 jeux, toutes consoles confondues", () => {
    const metroid = [
      ...jeux("n64", 2, ["Metroid"]).map((j) => ({ ...j, id: `m-${j.id}` })),
      ...jeux("vb", 1, ["Metroid"]).map((j) => ({ ...j, id: `m-${j.id}` })),
    ];
    const duo = jeux("n64", 2, ["Duo"]).map((j) => ({ ...j, id: `d-${j.id}` }));
    const b = calculerBadges(
      [...metroid, ...duo],
      consoles,
      possessions([...metroid, ...duo].map((j) => j.id)),
    );
    expect(gagnes(b)).toContain("Série complète : Metroid");
    expect(b.some((x) => x.nom === "Série complète : Duo")).toBe(false);
  });

  it("par région : versions japonaises et américaines, Tour du monde et Globe-trotteur", () => {
    const b = calculerBadges(
      catalogue,
      consoles,
      possessions(ids(n64, 10), ["JAP", "US", "PAL"]),
    );
    expect(gagnes(b)).toEqual(
      expect.arrayContaining([
        "Importateur",
        "Cap à l'Ouest",
        "Tour du monde",
        "Globe-trotteur",
      ]),
    );
    expect(gagnes(b)).not.toContain("Grand importateur");
    const pal = calculerBadges(
      catalogue,
      consoles,
      possessions(ids(n64, 10), ["JAP", "PAL"]),
    );
    expect(gagnes(pal)).not.toContain("Tour du monde");
  });
});

describe("prochainsBadges (US-24)", () => {
  it("les 3 plus avancés, commencés et pas gagnés ; « Complet » seulement à partir de la moitié", () => {
    const n64 = jeux("n64", 30);
    const b = calculerBadges(n64, consoles, possessions(ids(n64, 8)));
    const prochains = prochainsBadges(b);
    expect(prochains.map((x) => x.nom)).toEqual([
      "Débutant",
      "Collectionneur N64",
      "Moitié N64",
    ]);
    expect(prochains.every((x) => !x.gagne && x.actuel > 0)).toBe(true);
    expect(prochainsBadges(b, 10).some((x) => x.nom === "Complet N64")).toBe(
      false,
    );
  });

  it("collection vide : aucun prochain badge", () => {
    expect(
      prochainsBadges(calculerBadges(jeux("n64", 5), consoles, ensemble([]))),
    ).toEqual([]);
  });
});
