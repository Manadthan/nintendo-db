"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  grouperParAnnee,
  TRI_PAR_DEFAUT,
  trier,
} from "@/lib/catalogue/catalogue";
import {
  SANS_FILTRE,
  abonnerFiltres,
  anneesProposees,
  consolesProposees,
  enregistrerFiltres,
  filtrer,
  developpeursProposes,
  seriesProposees,
  genresProposes,
  lireFiltres,
  nombreActifs,
} from "@/lib/catalogue/filtres";
import { remettrePositionCatalogue } from "@/lib/catalogue/defilement";
import {
  MARCHES,
  abonnerMarche,
  enregistrerMarche,
  lireMarche,
} from "@/lib/catalogue/marche";
import {
  abonnerRecherche,
  contientMots,
  enregistrerRecherche,
  lireRecherche,
  motsRecherche,
  texteRecherche,
} from "@/lib/catalogue/recherche";
import {
  type JeuCatalogue,
  type Marche,
  type Tri,
} from "@/lib/catalogue/types";
import { filtrerCollection } from "@/lib/collection/collection";
import { useCollection } from "@/lib/collection/navigateur";
import { FiltresActifs, PanneauFiltres } from "./Filtres";
import { ListeJeux } from "./ListeJeux";
import { triFrise } from "@/lib/catalogue/frise";

type Vue = "grille" | "liste" | "frise";
const VUES: readonly Vue[] = ["grille", "liste", "frise"];
const LIBELLES_VUE: Record<Vue, string> = {
  grille: "Grille",
  liste: "Liste",
  frise: "Frise",
};
const CLE_VUE = "nintendo-db:vue";

/** Choix du visiteur gardé dans ce navigateur ; ignoré si le stockage est indisponible (navigation privée). */
function lireVue(): Vue {
  try {
    const vue = localStorage.getItem(CLE_VUE);
    return VUES.find((v) => v === vue) ?? "grille";
  } catch {
    return "grille";
  }
}

const abonnes = new Set<() => void>();
function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}
function enregistrerVue(vue: Vue) {
  try {
    localStorage.setItem(CLE_VUE, vue);
  } catch {
    // Stockage indisponible : le choix vaut pour cette visite seulement.
  }
  for (const rappel of abonnes) rappel();
}

type Props = {
  jeux: JeuCatalogue[];
  /** Consoles du site, par ordre chronologique (filtre « Console », étape 8). */
  consoles: { slug: string; nom: string }[];
};

/**
 * Catalogue de toutes les consoles (US-01, US-02) : recherche (US-05), marché (US-03), tri, filtres (US-06, dont
 * la console), grille / liste, groupes par année.
 */
export function Catalogue({ jeux, consoles }: Props) {
  const [triChoisi, setTri] = useState<Tri>(TRI_PAR_DEFAUT);
  // Page préparée à l'avance, identique pour tous (ADR-02) : « grille » au premier affichage,
  // puis le choix enregistré dans ce navigateur.
  const vue = useSyncExternalStore(abonner, lireVue, () => "grille" as Vue);
  const changerVue = enregistrerVue;
  // La frise ne connaît que les tris par date (SPEC v1.38) : A → Z et « mieux notés » y deviennent « plus récents ».
  const tri = vue === "frise" ? triFrise(triChoisi) : triChoisi;

  // Marché (US-03) : « Tous » au premier affichage (page identique pour tous), puis l'adresse ou ce navigateur.
  const marche = useSyncExternalStore<Marche>(
    abonnerMarche,
    lireMarche,
    () => "TOUS",
  );

  // Recherche (US-05) : dans l'adresse (?q=), filtrée dans le navigateur au fil de la frappe (ADR-05).
  const recherche = useSyncExternalStore(
    abonnerRecherche,
    lireRecherche,
    () => "",
  );

  // Filtres (US-06) : dans l'adresse (?console=, ?dispo=, ?annee=, ?genre=), comme la recherche.
  const filtresAdresse = useSyncExternalStore(
    abonnerFiltres,
    lireFiltres,
    () => SANS_FILTRE,
  );
  // Ma collection (US-16) : privée ; pour un visiteur, ni coche, ni filtre, ni compteur (un `?collection=` est ignoré).
  const collection = useCollection();
  const connecte = collection.connecte === true;
  const filtres = useMemo(
    () => (connecte ? filtresAdresse : { ...filtresAdresse, collection: null }),
    [connecte, filtresAdresse],
  );
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  // Retour d'une fiche par « Précédent » : reprendre à la même hauteur (Safari s'arrête en haut sinon).
  useEffect(remettrePositionCatalogue, []);
  const actifs = nombreActifs(filtres);

  // Recherche fluide (audit de performance, B) : le champ affiche chaque lettre aussitôt ; la liste suit juste
  // après, en priorité basse (useDeferredValue), et l'ancienne reste affichée, estompée, en attendant.
  const rechercheAffichee = useDeferredValue(recherche);
  // Texte de recherche de chaque jeu, normalisé une seule fois (pas à chaque lettre tapée).
  const textes = useMemo(
    () => new Map(jeux.map((j) => [j, texteRecherche(j)])),
    [jeux],
  );
  const trouves = useMemo(() => {
    const mots = motsRecherche(rechercheAffichee);
    return mots.length === 0
      ? jeux
      : jeux.filter((j) => contientMots(textes.get(j) ?? "", mots));
  }, [jeux, textes, rechercheAffichee]);

  // Choix proposés : ceux du marché choisi, sans tenir compte de la recherche ni des autres filtres.
  const duMarche = useMemo(
    () => trier(jeux, "anciens", marche),
    [jeux, marche],
  );
  const versions = useMemo(
    () =>
      filtrerCollection(
        filtrer(trier(trouves, tri, marche), filtres),
        filtres.collection,
        collection.possessions,
        marche,
      ),
    [trouves, tri, marche, filtres, collection.possessions],
  );
  const groupes = useMemo(
    () => grouperParAnnee(versions, tri),
    [versions, tri],
  );

  return (
    <section
      aria-labelledby="tous-les-jeux"
      className="mx-auto flex w-full max-w-7xl flex-col gap-3.5 px-4 pt-5 pb-7"
    >
      <div className="flex items-baseline gap-2">
        <h2 id="tous-les-jeux" className="font-titre text-[21px] font-bold">
          Tous les jeux
        </h2>
        <span className="text-[15px] font-semibold text-texte-discret">
          {jeux.length}
        </span>
      </div>

      <div className="flex h-11 items-center gap-2 rounded-xl border border-champ bg-carte px-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5b6170"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label="Rechercher un jeu"
          placeholder="Titre, éditeur, développeur"
          value={recherche}
          onChange={(e) => enregistrerRecherche(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base outline-none"
        />
      </div>

      <div role="group" aria-label="Marché" className="flex flex-wrap gap-1.5">
        {MARCHES.map((m) => (
          <button
            key={m.valeur}
            type="button"
            aria-pressed={marche === m.valeur}
            onClick={() => enregistrerMarche(m.valeur)}
            className={`h-9 rounded-full border px-3.5 text-[13px] ${
              marche === m.valeur
                ? "border-texte bg-texte font-semibold text-inverse"
                : "border-champ bg-carte font-medium"
            }`}
          >
            {m.libelle}
          </button>
        ))}
      </div>

      {/* 3 vues : la barre passe sur 2 lignes si l'écran est trop étroit (iPhone 12 mini). */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <label htmlFor="tri" className="text-[13px] text-texte-doux">
          Tri
        </label>
        <select
          id="tri"
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="h-9 rounded-[10px] border border-champ bg-carte px-2.5 text-[13px] font-medium"
        >
          <option value="recents">Plus récents</option>
          <option value="anciens">Plus anciens</option>
          {vue !== "frise" && (
            <>
              <option value="az">A → Z</option>
              <option value="note">Mieux notés</option>
            </>
          )}
        </select>
        <button
          type="button"
          aria-expanded={panneauOuvert}
          aria-controls="panneau-filtres"
          onClick={() => setPanneauOuvert(!panneauOuvert)}
          className={`h-9 rounded-[10px] border px-3 text-[13px] font-medium whitespace-nowrap ${
            actifs
              ? "border-accent bg-accent-doux text-accent-fonce"
              : "border-champ bg-carte"
          }`}
        >
          Filtres{actifs ? ` · ${actifs}` : ""}
        </button>
        <div className="flex-1" />
        <div role="group" aria-label="Affichage" className="flex gap-0.5">
          {VUES.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vue === v}
              onClick={() => changerVue(v)}
              className={`h-9 rounded-lg px-2.5 text-[13px] font-medium ${
                vue === v ? "bg-texte text-inverse" : "text-texte-doux"
              }`}
            >
              {LIBELLES_VUE[v]}
            </button>
          ))}
        </div>
      </div>
      {panneauOuvert && (
        <PanneauFiltres
          filtres={filtres}
          consoles={consolesProposees(duMarche, consoles)}
          annees={anneesProposees(duMarche)}
          genres={genresProposes(duMarche)}
          developpeurs={developpeursProposes(duMarche)}
          series={seriesProposees(duMarche)}
          collection={connecte}
        />
      )}
      <FiltresActifs filtres={filtres} consoles={consoles} />
      <p className="text-[13px] text-texte-discret">
        {versions.length} jeu{versions.length > 1 ? "x" : ""} affiché
        {versions.length > 1 ? "s" : ""} sur {jeux.length}
      </p>

      {versions.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-bordure bg-carte px-4 py-7 text-center">
          <p className="text-[15px] font-semibold">Aucun jeu ne correspond</p>
          <p className="text-[13px] text-texte-discret">
            {rechercheAffichee.trim()
              ? `Rien pour « ${rechercheAffichee.trim()} »`
              : actifs
                ? "Aucun jeu avec ces filtres"
                : "Aucun jeu sur ce marché"}{" "}
            : essayez un autre titre, un autre marché ou d&apos;autres filtres.
          </p>
          {rechercheAffichee.trim() && (
            <button
              type="button"
              onClick={() => enregistrerRecherche("")}
              className="h-10 rounded-[10px] bg-accent px-4 text-sm font-semibold text-inverse"
            >
              Effacer la recherche
            </button>
          )}
          {actifs > 0 && (
            <button
              type="button"
              onClick={() => enregistrerFiltres(SANS_FILTRE)}
              className="h-10 rounded-[10px] border border-champ bg-carte px-4 text-sm font-semibold"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Estompée tant que la liste n'a pas rattrapé la recherche tapée (hors de ListeJeux, qui reste mémorisée). */}
      <div
        className={`transition-opacity ${rechercheAffichee !== recherche ? "opacity-60" : ""}`}
      >
        <ListeJeux
          vue={vue}
          versions={versions}
          groupes={groupes}
          possessions={connecte ? collection.possessions : null}
        />
      </div>
    </section>
  );
}
