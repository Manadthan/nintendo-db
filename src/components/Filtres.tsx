"use client";

import { LIBELLES_TYPE, type TypeAmiibo } from "@/lib/amiibo/fiche";
import {
  DISPONIBILITES,
  SANS_FILTRE,
  enregistrerFiltres,
  type FiltreDisponibilite,
  type Filtres,
} from "@/lib/catalogue/filtres";

const CHAMP =
  "h-11 w-full rounded-[10px] border border-champ bg-carte px-2.5 text-base";

type ConsoleProposee = { slug: string; nom: string; nombre: number };
type TypeAmiiboPropose = {
  valeur: TypeAmiibo;
  libelle: string;
  nombre: number;
};

type PropsPanneau = {
  filtres: Filtres;
  /** Consoles qui ont des jeux, par ordre chronologique (étape 8, US-01). */
  consoles: ConsoleProposee[];
  annees: string[];
  genres: string[];
  /** Studios des jeux affichés, avec leur nombre de jeux (#89). */
  developpeurs: { nom: string; nombre: number }[];
  /** Séries des jeux affichés, par ordre alphabétique, puis « Sans série » (SPEC v1.37). */
  series: { nom: string; nombre: number }[];
  /** Types d'amiibo présents sur le marché (US-29, SPEC v1.54), affiché uniquement si « Amiibo » est coché. */
  typesAmiibo?: TypeAmiiboPropose[];
  /** Coche « Amiibo » active : affiche la liste « Type d'amiibo ». */
  amiibo?: boolean;
  /** Filtre « Collection » (US-16), seulement pour le propriétaire connecté ; les compteurs sont dans Statistiques (US-18). */
  collection?: boolean;
};

/** Panneau des filtres (US-06) : listes natives, confortables sur iPhone ; chaque choix s'applique aussitôt. */
export function PanneauFiltres({
  filtres,
  consoles,
  annees,
  genres,
  developpeurs,
  series,
  typesAmiibo = [],
  amiibo,
  collection,
}: PropsPanneau) {
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
      <div className="flex flex-wrap gap-2">
        <label
          className={`flex h-10 items-center gap-2 rounded-[10px] border px-3 text-sm font-medium ${
            !filtres.inclureAVenir
              ? "border-accent bg-carte"
              : "border-champ bg-carte"
          }`}
        >
          <input
            type="checkbox"
            checked={!filtres.inclureAVenir}
            onChange={(e) => changer({ inclureAVenir: !e.target.checked })}
            className="size-[18px] accent-accent"
          />
          Déjà sortis uniquement
        </label>
        <label
          className={`flex h-10 items-center gap-2 rounded-[10px] border px-3 text-sm font-medium ${
            !filtres.inclureSansImage
              ? "border-accent bg-carte"
              : "border-champ bg-carte"
          }`}
        >
          <input
            type="checkbox"
            checked={!filtres.inclureSansImage}
            onChange={(e) => changer({ inclureSansImage: !e.target.checked })}
            className="size-[18px] accent-accent"
          />
          Avec image uniquement
        </label>
      </div>
      {collection && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
            Collection
            <select
              value={filtres.collection ?? ""}
              onChange={(e) =>
                changer({
                  collection: (e.target.value || null) as Filtres["collection"],
                })
              }
              className={CHAMP}
            >
              <option value="">Tous</option>
              <option value="possedes">Possédés</option>
              <option value="manquants">Manquants</option>
              <option value="souhaits">Liste de souhaits</option>
            </select>
          </label>
        </div>
      )}
      <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
        Console
        <select
          value={filtres.console ?? ""}
          onChange={(e) => changer({ console: e.target.value || null })}
          className={CHAMP}
        >
          <option value="">Toutes</option>
          {consoles.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nom} ({c.nombre})
            </option>
          ))}
          {filtres.console &&
            !consoles.some((c) => c.slug === filtres.console) && (
              <option value={filtres.console}>{filtres.console}</option>
            )}
        </select>
      </label>
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
      <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
        Développeur
        <select
          value={filtres.developpeur ?? ""}
          onChange={(e) => changer({ developpeur: e.target.value || null })}
          className={CHAMP}
        >
          <option value="">Tous</option>
          {developpeurs.map((d) => (
            <option key={d.nom} value={d.nom}>
              {d.nom} ({d.nombre})
            </option>
          ))}
          {filtres.developpeur &&
            !developpeurs.some((d) => d.nom === filtres.developpeur) && (
              <option value={filtres.developpeur}>{filtres.developpeur}</option>
            )}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
        Série
        <select
          value={filtres.serie ?? ""}
          onChange={(e) => changer({ serie: e.target.value || null })}
          className={CHAMP}
        >
          <option value="">Toutes</option>
          {series.map((s) => (
            <option key={s.nom} value={s.nom}>
              {s.nom} ({s.nombre})
            </option>
          ))}
          {filtres.serie && !series.some((s) => s.nom === filtres.serie) && (
            <option value={filtres.serie}>{filtres.serie}</option>
          )}
        </select>
      </label>
      {amiibo && (
        <label className="flex flex-col gap-1 text-[13px] text-texte-doux">
          Type d&apos;amiibo
          <select
            value={filtres.typeAmiibo ?? ""}
            onChange={(e) =>
              changer({
                typeAmiibo: (e.target.value || null) as TypeAmiibo | null,
              })
            }
            className={CHAMP}
          >
            <option value="">Tous</option>
            {typesAmiibo.map((t) => (
              <option key={t.valeur} value={t.valeur}>
                {t.libelle} ({t.nombre})
              </option>
            ))}
            {filtres.typeAmiibo &&
              !typesAmiibo.some((t) => t.valeur === filtres.typeAmiibo) && (
                <option value={filtres.typeAmiibo}>
                  {LIBELLES_TYPE[filtres.typeAmiibo]}
                </option>
              )}
          </select>
        </label>
      )}
    </div>
  );
}

/** Filtres actifs en pastilles (US-06) : chacun s'efface en un tap, ou tous d'un coup. */
export function FiltresActifs({
  filtres,
  consoles,
}: {
  /** Le filtre « Collection » n'est montré (et compté) que si le propriétaire est connecté : sinon, il vaut null. */
  filtres: Filtres;
  /** Pour afficher le nom de la console choisie (« Wii » plutôt que « wii »). */
  consoles: { slug: string; nom: string }[];
}) {
  const pastilles = [
    filtres.console && {
      libelle:
        consoles.find((c) => c.slug === filtres.console)?.nom ??
        filtres.console,
      retirer: { console: null },
    },
    filtres.disponibilite && {
      libelle: DISPONIBILITES.find((d) => d.valeur === filtres.disponibilite)!
        .libelle,
      retirer: { disponibilite: null },
    },
    filtres.annee && { libelle: filtres.annee, retirer: { annee: null } },
    filtres.genre && { libelle: filtres.genre, retirer: { genre: null } },
    filtres.developpeur && {
      libelle: filtres.developpeur,
      retirer: { developpeur: null },
    },
    filtres.serie && { libelle: filtres.serie, retirer: { serie: null } },
    filtres.typeAmiibo && {
      libelle: LIBELLES_TYPE[filtres.typeAmiibo],
      retirer: { typeAmiibo: null },
    },
    filtres.collection && {
      libelle:
        filtres.collection === "possedes"
          ? "Possédés"
          : filtres.collection === "souhaits"
            ? "Liste de souhaits"
            : "Manquants",
      retirer: { collection: null },
    },
    filtres.inclureAVenir && {
      libelle: "À venir inclus",
      retirer: { inclureAVenir: false },
    },
    filtres.inclureSansImage && {
      libelle: "Sans image inclus",
      retirer: { inclureSansImage: false },
    },
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
