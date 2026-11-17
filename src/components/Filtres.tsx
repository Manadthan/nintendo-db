"use client";

import {
  DISPONIBILITES,
  SANS_FILTRE,
  enregistrerFiltres,
  type FiltreDisponibilite,
  type Filtres,
} from "@/lib/catalogue/filtres";

const CHAMP =
  "h-11 w-full rounded-[10px] border border-champ bg-carte px-2.5 text-base";

type PropsPanneau = {
  filtres: Filtres;
  annees: string[];
  genres: string[];
};

/** Panneau des filtres (US-06) : listes natives, confortables sur iPhone ; chaque choix s'applique aussitôt. */
export function PanneauFiltres({ filtres, annees, genres }: PropsPanneau) {
  const changer = (patch: Partial<Filtres>) =>
    enregistrerFiltres({ ...filtres, ...patch });
  // Un filtre venu d'un lien partagé reste choisissable même s'il ne correspond plus à rien.
  const avec = (liste: string[], valeur: string | null) =>
    valeur && !liste.includes(valeur) ? [valeur, ...liste] : liste;

  return (
    <div
      id="panneau-filtres"
      className="flex flex-col gap-3 rounded-xl border border-bordure bg-carte p-3"
    >
      <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
        Disponibilité
        <select
          value={filtres.disponibilite ?? ""}
          onChange={(e) =>
            changer({
              disponibilite: (e.target.value || null) as FiltreDisponibilite,
            })
          }
          className={CHAMP}
        >
          <option value="">Toutes</option>
          {DISPONIBILITES.map((d) => (
            <option key={d.valeur} value={d.valeur}>
              {d.libelle}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
          Année
          <select
            value={filtres.annee ?? ""}
            onChange={(e) => changer({ annee: e.target.value || null })}
            className={CHAMP}
          >
            <option value="">Toutes</option>
            {avec(annees, filtres.annee).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
          Genre
          <select
            value={filtres.genre ?? ""}
            onChange={(e) => changer({ genre: e.target.value || null })}
            className={CHAMP}
          >
            <option value="">Tous</option>
            {avec(genres, filtres.genre).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

/** Filtres actifs en pastilles (US-06) : chacun s'efface en un tap, ou tous d'un coup. */
export function FiltresActifs({ filtres }: { filtres: Filtres }) {
  const pastilles = [
    filtres.disponibilite && {
      libelle: DISPONIBILITES.find((d) => d.valeur === filtres.disponibilite)!
        .libelle,
      retirer: { disponibilite: null },
    },
    filtres.annee && { libelle: filtres.annee, retirer: { annee: null } },
    filtres.genre && { libelle: filtres.genre, retirer: { genre: null } },
  ].filter((p) => !!p);
  if (pastilles.length === 0) return null;

  return (
    <ul aria-label="Filtres actifs" className="flex flex-wrap gap-1.5">
      {pastilles.map((p) => (
        <li key={p.libelle}>
          <button
            type="button"
            aria-label={`Retirer le filtre ${p.libelle}`}
            onClick={() => enregistrerFiltres({ ...filtres, ...p.retirer })}
            className="flex h-9 items-center gap-1.5 rounded-full bg-accent-doux px-3 text-[13px] font-semibold text-accent-fonce"
          >
            {p.libelle}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </li>
      ))}
      {pastilles.length > 1 && (
        <li>
          <button
            type="button"
            onClick={() => enregistrerFiltres(SANS_FILTRE)}
            className="h-9 px-2 text-[13px] font-medium text-texte-doux underline"
          >
            Tout effacer
          </button>
        </li>
      )}
    </ul>
  );
}
