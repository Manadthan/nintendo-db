import { cleVersion } from "@/lib/collection/collection";
import { REGIONS } from "@/lib/catalogue/types";
import type { JeuStat } from "@/lib/statistiques/statistiques";

/**
 * Badges (US-24, ADR-16 point 5) : calculés à chaque ouverture à partir de la collection et du catalogue, jamais
 * stockés (rien à resynchroniser). Un jeu compte dès qu'une version est possédée ; décocher fait perdre le badge.
 */

export type Categorie = "total" | "console" | "serie" | "region";

export type Badge = {
  id: string;
  nom: string;
  explication: string;
  categorie: Categorie;
  /** Progression : `actuel` sur `objectif` ; gagné quand actuel ≥ objectif. */
  actuel: number;
  objectif: number;
  unite: string;
  gagne: boolean;
};

const PALIERS_TOTAL = [
  [10, "Débutant"],
  [25, "Amateur"],
  [50, "Passionné"],
  [100, "Collectionneur"],
  [250, "Expert"],
  [500, "Légende"],
] as const;

/** Série prise en compte : au moins 3 jeux au catalogue, toutes consoles confondues. */
export const TAILLE_MIN_SERIE = 3;

const badge = (
  b: Omit<Badge, "gagne" | "actuel"> & { actuel: number },
): Badge => ({
  ...b,
  actuel: Math.min(b.actuel, b.objectif),
  gagne: b.actuel >= b.objectif,
});

export function calculerBadges(
  jeux: JeuStat[],
  consoles: { slug: string; nom: string }[],
  possessions: ReadonlySet<string>,
): Badge[] {
  const possede = (j: JeuStat) =>
    REGIONS.some((r) => possessions.has(cleVersion(j.id, r)));
  const possedes = jeux.filter(possede);
  const badges: Badge[] = [];

  for (const [seuil, nom] of PALIERS_TOTAL)
    badges.push(
      badge({
        id: `total-${seuil}`,
        nom,
        explication: `${seuil} jeux dans la collection`,
        categorie: "total",
        actuel: possedes.length,
        objectif: seuil,
        unite: "jeux",
      }),
    );

  for (const c of consoles) {
    const deLaConsole = jeux.filter((j) => j.console.slug === c.slug);
    const total = deLaConsole.length;
    if (total === 0) continue;
    const n = deLaConsole.filter(possede).length;
    if (total > 10)
      badges.push(
        badge({
          id: `console-10-${c.slug}`,
          nom: `Collectionneur ${c.nom}`,
          explication: `10 jeux ${c.nom}`,
          categorie: "console",
          actuel: n,
          objectif: 10,
          unite: "jeux",
        }),
      );
    if (total >= 4)
      badges.push(
        badge({
          id: `console-moitie-${c.slug}`,
          nom: `Moitié ${c.nom}`,
          explication: `La moitié des jeux ${c.nom} du catalogue`,
          categorie: "console",
          actuel: n,
          objectif: Math.ceil(total / 2),
          unite: "jeux",
        }),
      );
    badges.push(
      badge({
        id: `console-complet-${c.slug}`,
        nom: `Complet ${c.nom}`,
        explication: `Tous les jeux ${c.nom} du catalogue`,
        categorie: "console",
        actuel: n,
        objectif: total,
        unite: "jeux",
      }),
    );
  }

  const series = new Map<string, JeuStat[]>();
  for (const j of jeux)
    for (const s of j.series ?? [])
      series.set(s, [...(series.get(s) ?? []), j]);
  for (const [nom, deLaSerie] of [...series].sort(([a], [b]) =>
    a.localeCompare(b, "fr"),
  )) {
    if (deLaSerie.length < TAILLE_MIN_SERIE) continue;
    badges.push(
      badge({
        id: `serie-${nom}`,
        nom: `Série complète : ${nom}`,
        explication: `Tous les jeux de la série ${nom}, toutes consoles`,
        categorie: "serie",
        actuel: deLaSerie.filter(possede).length,
        objectif: deLaSerie.length,
        unite: "jeux",
      }),
    );
  }

  const versions = (r: "JAP" | "US") =>
    jeux.filter((j) => possessions.has(cleVersion(j.id, r))).length;
  const regions = [
    ["JAP", 10, "Importateur", "10 versions japonaises"],
    ["JAP", 50, "Grand importateur", "50 versions japonaises"],
    ["US", 10, "Cap à l'Ouest", "10 versions américaines"],
    ["US", 50, "Rêve américain", "50 versions américaines"],
  ] as const;
  for (const [region, seuil, nom, explication] of regions)
    badges.push(
      badge({
        id: `region-${region.toLowerCase()}-${seuil}`,
        nom,
        explication,
        categorie: "region",
        actuel: versions(region),
        objectif: seuil,
        unite: "versions",
      }),
    );
  const tourDuMonde = jeux.filter((j) =>
    REGIONS.every((r) => possessions.has(cleVersion(j.id, r))),
  ).length;
  badges.push(
    badge({
      id: "region-monde-1",
      nom: "Tour du monde",
      explication: "Un même jeu en versions JAP, US et PAL",
      categorie: "region",
      actuel: tourDuMonde,
      objectif: 1,
      unite: "jeu",
    }),
    badge({
      id: "region-monde-10",
      nom: "Globe-trotteur",
      explication: "10 jeux en versions JAP, US et PAL",
      categorie: "region",
      actuel: tourDuMonde,
      objectif: 10,
      unite: "jeux",
    }),
  );
  return badges;
}

/**
 * Prochains badges : commencés (au moins un jeu compté), pas encore gagnés, les plus avancés d'abord (à égalité, le
 * plus petit objectif). Les badges « Complet » et « Série complète » ne s'affichent qu'à partir de la moitié.
 */
export function prochainsBadges(badges: Badge[], n = 3): Badge[] {
  const part = (b: Badge) => b.actuel / b.objectif;
  return badges
    .filter((b) => !b.gagne && b.actuel > 0)
    .filter(
      (b) =>
        !(b.id.startsWith("console-complet") || b.categorie === "serie") ||
        part(b) >= 0.5,
    )
    .sort((a, b) => part(b) - part(a) || a.objectif - b.objectif)
    .slice(0, n);
}
