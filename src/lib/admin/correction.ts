import {
  REGIONS,
  type PrecisionDate,
  type Region,
} from "@/lib/catalogue/types";

/** Champs d'une sortie modifiables à la main (US-11). */
export type SortieCorrigeable = {
  sortie: boolean;
  titre: string | null;
  titre_romanise: string | null;
  date_sortie: string | null;
  precision_date: PrecisionDate | null;
  code_produit: string | null;
  editeur: string | null;
};

/** Un jeu tel que le formulaire de correction le lit et l'écrit. */
export type JeuCorrigeable = {
  developpeur: string | null;
  releases: Record<Region, SortieCorrigeable>;
};

export type Correction = {
  /** Champs du jeu à écrire, et ses verrous (anciens + champs modifiés). */
  game: Partial<Pick<JeuCorrigeable, "developpeur">> & { verrous: string[] };
  releases: Partial<
    Record<Region, Partial<SortieCorrigeable> & { verrous: string[] }>
  >;
};

export type ResultatCorrection =
  { ok: true; correction: Correction } | { ok: false; erreurs: string[] };

const CHAMPS_SORTIE = [
  "sortie",
  "titre",
  "titre_romanise",
  "date_sortie",
  "precision_date",
  "code_produit",
  "editeur",
] as const satisfies readonly (keyof SortieCorrigeable)[];

const PRECISIONS: readonly PrecisionDate[] = ["jour", "mois", "annee"];

const texte = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t ? t : null;
};

/** Saisie du formulaire → jeu corrigeable (champs `PAL.titre`, `JAP.sortie`…). */
export function lireSaisie(formData: FormData): JeuCorrigeable {
  const releases = Object.fromEntries(
    REGIONS.map((r) => {
      const precision = texte(formData.get(`${r}.precision_date`));
      return [
        r,
        {
          sortie: formData.get(`${r}.sortie`) === "on",
          titre: texte(formData.get(`${r}.titre`)),
          titre_romanise: texte(formData.get(`${r}.titre_romanise`)),
          date_sortie: texte(formData.get(`${r}.date_sortie`)),
          precision_date: PRECISIONS.includes(precision as PrecisionDate)
            ? (precision as PrecisionDate)
            : null,
          code_produit: texte(formData.get(`${r}.code_produit`)),
          editeur: texte(formData.get(`${r}.editeur`)),
        } satisfies SortieCorrigeable,
      ];
    }),
  ) as Record<Region, SortieCorrigeable>;
  return { developpeur: texte(formData.get("developpeur")), releases };
}

function dateValide(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(date);
}

/**
 * Prépare une correction (US-11, ADR-03 point 4) : vérifie les champs obligatoires, ne garde que ce qui a changé,
 * et **verrouille** chaque champ modifié, pour que l'import ne le remplace plus jamais (il signalera l'écart).
 */
export function preparerCorrection(
  avant: JeuCorrigeable,
  apres: JeuCorrigeable,
  verrous: { game: string[]; releases: Record<Region, string[]> },
): ResultatCorrection {
  const erreurs: string[] = [];
  for (const r of REGIONS) {
    const s = apres.releases[r];
    if (s.sortie && !s.titre)
      erreurs.push(`${r} : le titre est obligatoire pour une version sortie.`);
    if (s.date_sortie && !dateValide(s.date_sortie))
      erreurs.push(`${r} : date invalide (attendu AAAA-MM-JJ).`);
    if (s.date_sortie && !s.precision_date)
      erreurs.push(
        `${r} : précise si la date est au jour, au mois ou à l'année.`,
      );
  }
  if (erreurs.length) return { ok: false, erreurs };

  const ajouter = (liste: string[], champ: string) =>
    liste.includes(champ) ? liste : [...liste, champ];

  const game: Correction["game"] = { verrous: verrous.game };
  if (apres.developpeur !== avant.developpeur) {
    game.developpeur = apres.developpeur;
    game.verrous = ajouter(game.verrous, "developpeur");
  }

  const releases: Correction["releases"] = {};
  for (const r of REGIONS) {
    let liste = verrous.releases[r];
    const patch: Partial<SortieCorrigeable> = {};
    for (const champ of CHAMPS_SORTIE) {
      const nouveau = apres.releases[r][champ];
      if (nouveau !== avant.releases[r][champ]) {
        (patch as Record<string, unknown>)[champ] = nouveau;
        liste = ajouter(liste, champ);
      }
    }
    if (Object.keys(patch).length) releases[r] = { ...patch, verrous: liste };
  }
  return { ok: true, correction: { game, releases } };
}
