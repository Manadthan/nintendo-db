"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  grouperParAnnee,
  TRI_PAR_DEFAUT,
  trier,
  trierVersions,
} from "@/lib/catalogue/catalogue";
import {
  SANS_FILTRE,
  abonnerFiltres,
  anneesProposees,
  consolesProposees,
  enregistrerFiltres,
  filtrer,
  filtrerVisibilite,
  developpeursProposes,
  seriesProposees,
  typesAmiiboProposes,
  genresProposes,
  lireFiltres,
  nombreActifs,
} from "@/lib/catalogue/filtres";
import {
  defilerA,
  positionCatalogueARemettre,
} from "@/lib/catalogue/defilement";
import { LOT, limiteRestauree } from "@/lib/catalogue/lots";
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
import { versionsAVenir } from "@/lib/catalogue/a-venir";
import { BandeAVenir } from "./BandeAVenir";
import { ListeJeux } from "./ListeJeux";
import { ZoomGrille } from "./ZoomGrille";
import { triFrise } from "@/lib/catalogue/frise";
import { abonnerTri, enregistrerTri, lireTri } from "@/lib/catalogue/tri";
import {
  ZOOM_PAR_DEFAUT,
  abonnerZoom,
  enregistrerZoom,
  lireZoom,
  type NiveauZoom,
} from "@/lib/catalogue/zoom";
import {
  COCHES,
  VOIR_PAR_DEFAUT,
  abonnerVoir,
  basculer,
  enregistrerVoir,
  guidesPermis,
  libelleCompte,
  lireVoir,
  voirEffectif,
  type Coche,
  type Voir,
} from "@/lib/catalogue/voir";
import {
  texteRechercheAmiibo,
  versionsAmiibo,
  type AmiiboCatalogue,
} from "@/lib/amiibo/catalogue";
import {
  relierGuides,
  texteRechercheGuide,
  versionsGuides,
  type GuideCatalogue,
} from "@/lib/guides/catalogue";

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

const LIBELLES_COCHE: Record<Coche, string> = {
  jeux: "Jeux",
  guides: "Guides",
  amiibo: "Amiibo",
};

/**
 * Liste JSON demandée une seule fois, à la première coche (guides : ADR-19 point 4 ; amiibo : ADR-21 point 5) :
 * l'accueil reste aussi léger qu'avant. `null` tant qu'elle n'est pas arrivée.
 */
function useListeALaDemande<T>(adresse: string, demandee: boolean) {
  const [liste, setListe] = useState<T[] | null>(null);
  const [erreur, setErreur] = useState(false);
  useEffect(() => {
    if (!demandee || liste) return;
    let annule = false;
    fetch(adresse)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<T[]>;
      })
      .then((l) => {
        if (!annule) setListe(l);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, [adresse, demandee, liste]);
  return { liste, erreur };
}

type Props = {
  jeux: JeuCatalogue[];
  /** Consoles du site, par ordre chronologique (filtre « Console », étape 8). */
  consoles: { slug: string; nom: string }[];
  /** Jour de préparation de la page (AAAA-MM-JJ, Paris) : jeux à venir (US-32, ADR-20). */
  aujourdhui: string;
};

/**
 * Catalogue de toutes les consoles (US-01, US-02) : recherche (US-05), marché (US-03), tri, filtres (US-06, dont
 * la console), grille / liste, groupes par année.
 */
export function Catalogue({ jeux, consoles, aujourdhui }: Props) {
  // Tri : dans l'adresse (?tri=, SPEC v1.45), retrouvé au retour d'une fiche ; le défaut au premier affichage.
  const triChoisi = useSyncExternalStore<Tri>(
    abonnerTri,
    lireTri,
    () => TRI_PAR_DEFAUT,
  );
  // Page préparée à l'avance, identique pour tous (ADR-02) : « grille » au premier affichage,
  // puis le choix enregistré dans ce navigateur.
  const vue = useSyncExternalStore(abonner, lireVue, () => "grille" as Vue);
  const changerVue = enregistrerVue;
  const zoom = useSyncExternalStore<NiveauZoom>(
    abonnerZoom,
    lireZoom,
    () => ZOOM_PAR_DEFAUT,
  );
  // La frise ne connaît que les tris par date (SPEC v1.38) : A → Z et « mieux notés » y deviennent « plus récents ».
  const tri = vue === "frise" ? triFrise(triChoisi) : triChoisi;

  // Marché (US-03) : « Tous » au premier affichage (page identique pour tous), puis l'adresse ou ce navigateur.
  const marche = useSyncExternalStore<Marche>(
    abonnerMarche,
    lireMarche,
    () => "TOUS",
  );

  // Bande « À venir » (US-32) : jeux annoncés sur le marché choisi, la sortie la plus proche d'abord.
  const aVenir = useMemo(
    () => versionsAVenir(jeux, marche, aujourdhui),
    [jeux, marche, aujourdhui],
  );

  // Coches « Jeux » / « Guides » (US-27) : dans l'adresse (?voir=) ; les guides seulement sur « Tous » et « Japon ».
  const voirChoisi = useSyncExternalStore<Voir>(
    abonnerVoir,
    lireVoir,
    () => VOIR_PAR_DEFAUT,
  );
  const permis = guidesPermis(marche);
  const voir = voirEffectif(voirChoisi, marche);
  const { liste: guides, erreur: erreurGuides } =
    useListeALaDemande<GuideCatalogue>("/guides.json", voir.guides);
  // Amiibo (US-29) : sur tous les marchés ; un amiibo non sorti sur le marché choisi est caché.
  const { liste: amiibo, erreur: erreurAmiibo } =
    useListeALaDemande<AmiiboCatalogue>("/amiibo.json", voir.amiibo);
  const guidesRelies = useMemo(
    () => relierGuides(guides ?? [], jeux),
    [guides, jeux],
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
    () => ({
      ...filtresAdresse,
      collection: connecte ? filtresAdresse.collection : null,
      typeAmiibo: voir.amiibo ? filtresAdresse.typeAmiibo : null,
    }),
    [connecte, voir.amiibo, filtresAdresse],
  );
  const [panneauOuvert, setPanneauOuvert] = useState(false);
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
  // Guides (US-27) : cherchés par leur titre, leur éditeur et le titre des jeux couverts.
  const textesGuides = useMemo(
    () => new Map(guidesRelies.map((g) => [g, texteRechercheGuide(g)])),
    [guidesRelies],
  );
  const guidesTrouves = useMemo(() => {
    const mots = motsRecherche(rechercheAffichee);
    return mots.length === 0
      ? guidesRelies
      : guidesRelies.filter((g) =>
          contientMots(textesGuides.get(g) ?? "", mots),
        );
  }, [guidesRelies, textesGuides, rechercheAffichee]);
  // Amiibo (US-29) : cherchés par leur nom, leur nom japonais, leur série amiibo et leurs séries de jeux.
  const textesAmiibo = useMemo(
    () => new Map((amiibo ?? []).map((a) => [a, texteRechercheAmiibo(a)])),
    [amiibo],
  );
  const amiiboTrouves = useMemo(() => {
    const mots = motsRecherche(rechercheAffichee);
    const tous = amiibo ?? [];
    return mots.length === 0
      ? tous
      : tous.filter((a) => contientMots(textesAmiibo.get(a) ?? "", mots));
  }, [amiibo, textesAmiibo, rechercheAffichee]);

  // Choix proposés : ceux du marché choisi (avec les deux coches de visibilité), sans tenir compte de la recherche ni
  // des autres filtres ; avec les amiibo quand ils sont cochés (leurs séries, années et consoles).
  const duMarche = useMemo(
    () =>
      filtrerVisibilite(
        [
          ...trier(jeux, "anciens", marche),
          ...(voir.amiibo ? versionsAmiibo(amiibo ?? [], marche) : []),
        ],
        filtres,
        { marche, aujourdhui },
      ),
    [jeux, marche, voir.amiibo, amiibo, filtres, aujourdhui],
  );
  const versions = useMemo(
    () =>
      filtrerCollection(
        filtrer(
          // Jeux, guides et amiibo mêlés, classés ensemble (US-27, US-29).
          trierVersions(
            [
              ...(voir.jeux ? trier(trouves, tri, marche) : []),
              ...(voir.guides ? versionsGuides(guidesTrouves) : []),
              ...(voir.amiibo ? versionsAmiibo(amiiboTrouves, marche) : []),
            ],
            tri,
          ),
          filtres,
          { marche, aujourdhui },
        ),
        filtres.collection,
        collection.possessions,
        marche,
        collection.souhaits,
      ),
    [
      trouves,
      guidesTrouves,
      amiiboTrouves,
      voir,
      tri,
      marche,
      aujourdhui,
      filtres,
      collection.possessions,
      collection.souhaits,
    ],
  );
  const groupes = useMemo(
    () => grouperParAnnee(versions, tri),
    [versions, tri],
  );

  // Affichage par lots (SPEC v1.41, audit C) : 60 jeux, puis 60 de plus en approchant du bas. Une autre recherche,
  // un filtre, le marché, le tri ou la vue repartent des 60 premiers (état ajusté pendant le rendu).
  const cle = JSON.stringify([
    rechercheAffichee,
    filtres,
    marche,
    tri,
    vue,
    voir,
  ]);
  const [lots, setLots] = useState({
    cle,
    limite: LOT,
    defiler: null as number | null,
  });
  if (lots.cle !== cle) setLots({ cle, limite: LOT, defiler: null });
  const limite = lots.cle === cle ? lots.limite : LOT;
  const sentinelle = useRef<HTMLDivElement>(null);
  const resteAAfficher = limite < versions.length;
  useEffect(() => {
    const element = sentinelle.current;
    if (!element) return;
    // Recréé à chaque lot : s'il reste proche du bas, l'observateur en demande aussitôt un autre.
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree?.isIntersecting)
          setLots((l) =>
            l.cle === cle ? { ...l, limite: l.limite + LOT } : l,
          );
      },
      { rootMargin: "0px 0px 1200px 0px" },
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [cle, limite, resteAAfficher]);

  // Retour d'une fiche par « Précédent » : redessiner autant de jeux qu'avant, puis reprendre à la même hauteur
  // (Safari s'arrête en haut sinon).
  useEffect(() => {
    const position = positionCatalogueARemettre();
    if (!position) return;
    // Après l'hydratation, quand l'adresse (filtres, recherche) est lue.
    requestAnimationFrame(() =>
      setLots((l) => ({
        ...l,
        limite: Math.max(l.limite, limiteRestauree(position.nombre)),
        defiler: position.y,
      })),
    );
  }, []);
  useEffect(() => {
    if (lots.defiler !== null) defilerA(lots.defiler);
  }, [lots.defiler]);

  return (
    <section
      aria-labelledby="tous-les-jeux"
      className="mx-auto flex w-full max-w-7xl flex-col gap-3.5 px-4 pt-5 pb-7"
    >
      <BandeAVenir versions={aVenir} />
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

      <div
        role="group"
        aria-label="Afficher"
        className="flex flex-wrap items-center gap-2"
      >
        {COCHES.map((coche) => {
          const grisee = coche === "guides" && !permis;
          return (
            <label
              key={coche}
              className={`flex h-10 items-center gap-2 rounded-[10px] border px-3 text-sm font-medium ${
                grisee
                  ? "border-champ text-texte-discret"
                  : voir[coche]
                    ? "border-accent bg-carte"
                    : "border-champ bg-carte"
              }`}
            >
              <input
                type="checkbox"
                checked={voir[coche]}
                disabled={grisee}
                onChange={() => {
                  const suivant = basculer(voir, coche);
                  enregistrerVoir(suivant);
                  if (
                    coche === "amiibo" &&
                    !suivant.amiibo &&
                    filtresAdresse.typeAmiibo
                  ) {
                    enregistrerFiltres({
                      ...filtresAdresse,
                      typeAmiibo: null,
                    });
                  }
                }}
                className="size-[18px] accent-accent"
              />
              {LIBELLES_COCHE[coche]}
            </label>
          );
        })}
        {!permis && (
          <span className="text-xs text-texte-discret">
            Guides : marché Japon
          </span>
        )}
      </div>

      {/* 3 vues : la barre passe sur 2 lignes si l'écran est trop étroit (iPhone 12 mini). */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <label htmlFor="tri" className="text-[13px] text-texte-doux">
          Tri
        </label>
        <select
          id="tri"
          value={tri}
          onChange={(e) => enregistrerTri(e.target.value as Tri)}
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
        <div className="flex items-center gap-2">
          {vue === "grille" && (
            <ZoomGrille niveau={zoom} surChangement={enregistrerZoom} />
          )}
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
      </div>
      {panneauOuvert && (
        <PanneauFiltres
          filtres={filtres}
          consoles={consolesProposees(duMarche, consoles)}
          annees={anneesProposees(duMarche)}
          genres={genresProposes(duMarche)}
          developpeurs={developpeursProposes(duMarche)}
          series={seriesProposees(duMarche)}
          typesAmiibo={typesAmiiboProposes(duMarche)}
          amiibo={voir.amiibo}
          collection={connecte}
        />
      )}
      <FiltresActifs filtres={filtres} consoles={consoles} />
      <p className="text-[13px] text-texte-discret">
        {libelleCompte(versions, voir, jeux.length)}
      </p>
      {voir.guides && !guides && (
        <p role="status" className="text-[13px] text-texte-discret">
          {erreurGuides
            ? "Les guides n'ont pas pu être chargés."
            : "Chargement des guides…"}
        </p>
      )}
      {voir.amiibo && !amiibo && (
        <p role="status" className="text-[13px] text-texte-discret">
          {erreurAmiibo
            ? "Les amiibo n'ont pas pu être chargés."
            : "Chargement des amiibo…"}
        </p>
      )}

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
          zoom={zoom}
          versions={versions}
          groupes={groupes}
          possessions={connecte ? collection.possessions : null}
          souhaits={connecte ? collection.souhaits : null}
          limite={limite}
          aujourdhui={aujourdhui}
        />
      </div>
      {resteAAfficher && <div ref={sentinelle} aria-hidden="true" />}
    </section>
  );
}
