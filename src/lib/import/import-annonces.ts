import { slugDisponible } from "@/lib/admin/nouveau";
import {
  REGIONS,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";
import type { Annonce, ConsoleAnnonce } from "./annonces";

// Import des annonces (US-33, ADR-20 point 6) : les annonces d'un même jeu dans les trois régions regroupées, puis
// comparées au catalogue. Calculs purs : la page « Import → Annonces » lit, affiche et écrit.

/** Identifiant stable d'une annonce, pour le menu « même jeu que » du propriétaire. */
export const cleAnnonce = (a: Annonce) =>
  `${a.region}:${a.console}:${a.idSource || normaliser(a.titre)}`;

export type JeuAnnonce = {
  cle: string;
  console: ConsoleAnnonce;
  titre: string;
  regions: Partial<Record<Region, Annonce>>;
  /** Japon seul : jeux de la même console qu'il peut rejoindre (menu « même jeu que »). */
  candidats: { cle: string; titre: string }[];
};

const titreDe = (regions: Partial<Record<Region, Annonce>>) =>
  (regions.PAL ?? regions.US ?? regions.JAP)!.titre;

/**
 * Regroupe les annonces d'un même jeu : Europe et US au titre identique (normalisé, ADR-05) ; une annonce japonaise
 * rejoint le jeu choisi par le propriétaire (`liaisons`), sinon le seul jeu de sa console dont elle cite le titre
 * anglais ou qui sort le même jour ; sans indice sûr, elle reste un jeu à part.
 */
export function regrouperAnnonces(
  annonces: Annonce[],
  liaisons: Record<string, string> = {},
): JeuAnnonce[] {
  const groupes = new Map<string, Partial<Record<Region, Annonce>>>();
  const cleDe = new Map<string, string>();
  for (const an of annonces.filter((x) => x.region !== "JAP")) {
    const titre = `${an.console}|${normaliser(an.titre)}`;
    let cle = cleDe.get(titre);
    if (!cle) {
      cle = cleAnnonce(an);
      cleDe.set(titre, cle);
      groupes.set(cle, {});
    }
    const g = groupes.get(cle)!;
    if (!g[an.region]) g[an.region] = an;
  }
  const occidentaux = [...groupes.entries()];
  const seuls: Annonce[] = [];

  for (const jap of annonces.filter((x) => x.region === "JAP")) {
    const libres = occidentaux.filter(
      ([, g]) => !g.JAP && titreDe(g) && consoleDe(g) === jap.console,
    );
    const choisie = liaisons[cleAnnonce(jap)];
    const lie =
      choisie !== undefined
        ? libres.filter(
            ([cle, g]) =>
              Object.values(g).some((x) => cleAnnonce(x) === choisie) ||
              cle === choisie,
          )
        : [];
    const japonais = normaliser(jap.titre);
    const parTitre = libres.filter(([, g]) =>
      Object.values(g).some((x) => {
        const t = normaliser(x.titre);
        return t.length >= 4 && japonais.includes(t);
      }),
    );
    const parJour =
      jap.precision === "jour"
        ? libres.filter(([, g]) =>
            Object.values(g).some(
              (x) => x.precision === "jour" && x.date === jap.date,
            ),
          )
        : [];
    const cible = [lie, parTitre, parJour].find((l) => l.length === 1)?.[0];
    if (cible) cible[1].JAP = jap;
    else seuls.push(jap);
  }

  const jeux: JeuAnnonce[] = occidentaux
    .map(([cle, regions]) => ({
      cle,
      console: consoleDe(regions),
      titre: titreDe(regions),
      regions,
      candidats: [],
    }))
    .sort((x, y) => x.titre.localeCompare(y.titre));
  return [
    ...jeux,
    ...seuls.map((jap) => ({
      cle: cleAnnonce(jap),
      console: jap.console,
      titre: jap.titre,
      regions: { JAP: jap },
      candidats: jeux
        .filter((j) => !j.regions.JAP && j.console === jap.console)
        .map((j) => ({
          cle: cleAnnonce((j.regions.PAL ?? j.regions.US)!),
          titre: j.titre,
        })),
    })),
  ];
}

const consoleDe = (g: Partial<Record<Region, Annonce>>) =>
  (g.PAL ?? g.US ?? g.JAP)!.console;

/** Une sortie du catalogue, telle que l'import l'utilise. */
export type SortieCatalogue = {
  sortie: boolean;
  titre: string | null;
  date_sortie: string | null;
  precision_date: PrecisionDate | null;
  /** Champs corrigés à la main (US-11) : jamais écrasés. */
  verrous: string[];
};

export type JeuCatalogue = {
  id: string;
  slug: string;
  console: string;
  sorties: Partial<Record<Region, SortieCatalogue>>;
};

/** Ce que l'import écrit dans une sortie (seulement les champs qui changent). */
export type ChampsAnnonce = Partial<{
  sortie: true;
  titre: string;
  date_sortie: string | null;
  precision_date: PrecisionDate;
}>;

export type LigneAnnonce = {
  cle: string;
  console: ConsoleAnnonce;
  titre: string;
  slug: string;
  /** Jeu déjà au catalogue, sinon null (nouveau jeu). */
  gameId: string | null;
  etat: "nouveau" | "modifie" | "inchange" | "ecarte";
  raison: string | null;
  /** « JAP ajoutée », « PAL date »… */
  changements: string[];
  sorties: Partial<Record<Region, ChampsAnnonce>>;
  /** Jaquettes officielles à copier : la boîte américaine du My Nintendo Store, la seule vraie boîte des sources. */
  jaquettes: Partial<Record<Region, string>>;
  annonces: Partial<Record<Region, Annonce>>;
  candidats: JeuAnnonce["candidats"];
};

/** Jeu du catalogue de la même console dont une sortie porte le même titre (normalisé) qu'une annonce. */
function retrouver(
  jeu: JeuAnnonce,
  catalogue: JeuCatalogue[],
): JeuCatalogue | undefined {
  const titres = new Set(
    Object.values(jeu.regions).map((x) => normaliser(x.titre)),
  );
  return catalogue.find(
    (c) =>
      c.console === jeu.console &&
      Object.values(c.sorties).some(
        (s) => s?.titre && titres.has(normaliser(s.titre)),
      ),
  );
}

/**
 * Aperçu de l'import (US-33) : chaque jeu annoncé est nouveau, modifié (région ajoutée, date annoncée qui change),
 * inchangé ou écarté (décoché « en boîte » à un import précédent : `exclus`, clés « console|slug »). Une date
 * verrouillée n'est jamais remplacée ; le titre d'une sortie déjà au catalogue non plus.
 */
export function apercuAnnonces(
  jeux: JeuAnnonce[],
  catalogue: JeuCatalogue[],
  exclus: Set<string>,
): LigneAnnonce[] {
  const pris = new Map<string, Set<string>>();
  for (const c of catalogue) {
    if (!pris.has(c.console)) pris.set(c.console, new Set());
    pris.get(c.console)!.add(c.slug);
  }
  return jeux.map((jeu) => {
    const enBase = retrouver(jeu, catalogue);
    const slugs = pris.get(jeu.console) ?? new Set<string>();
    const latin = (jeu.regions.PAL ?? jeu.regions.US)?.titre;
    const slug =
      enBase?.slug ??
      (latin
        ? slugDisponible(latin, slugs)
        : `jap-${jeu.regions.JAP!.idSource}`);
    if (!enBase) slugs.add(slug);
    pris.set(jeu.console, slugs);

    const sorties: LigneAnnonce["sorties"] = {};
    const changements: string[] = [];
    for (const r of REGIONS) {
      const an = jeu.regions[r];
      if (!an) continue;
      const s = enBase?.sorties[r];
      const precision: PrecisionDate = an.precision;
      if (!s?.sortie) {
        sorties[r] = {
          sortie: true,
          titre: s?.titre ?? an.titre,
          date_sortie: an.date,
          precision_date: precision,
        };
        if (enBase) changements.push(`${r} ajoutée`);
        continue;
      }
      const patch: ChampsAnnonce = {};
      if (!s.verrous.includes("date_sortie") && s.date_sortie !== an.date)
        patch.date_sortie = an.date;
      if (
        !s.verrous.includes("precision_date") &&
        s.precision_date !== precision
      )
        patch.precision_date = precision;
      if (Object.keys(patch).length) {
        sorties[r] = patch;
        changements.push(`${r} date`);
      }
    }

    const boite = jeu.regions.US;
    const jaquettes: LigneAnnonce["jaquettes"] =
      boite?.physique && boite.image ? { US: boite.image } : {};
    const ecarte = exclus.has(`${jeu.console}|${slug}`);
    return {
      cle: jeu.cle,
      console: jeu.console,
      titre: jeu.titre,
      slug,
      gameId: enBase?.id ?? null,
      etat: ecarte
        ? "ecarte"
        : !enBase
          ? "nouveau"
          : changements.length
            ? "modifie"
            : "inchange",
      raison: ecarte ? "décoché « en boîte » à un import précédent" : null,
      changements,
      sorties,
      jaquettes,
      annonces: jeu.regions,
      candidats: jeu.candidats,
    };
  });
}
