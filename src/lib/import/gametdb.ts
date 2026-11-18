import * as cheerio from "cheerio";
import type { PrecisionDate, Region } from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";
import { SOURCES_CONSOLES, type SourceConsole } from "./consoles";
import { EDITEUR_NINTENDO, rangCartePal } from "./relais-portables";
import { rangCartouche, regionsGameTdb } from "./relais-switch";

/** Un disque en boîte d'une région (type `WiiU` de GameTDB ; l'eShop et les boîtes à code sont écartés). */
export type DisqueGameTdb = {
  /** Identifiant du disque, ex. `ALZP01` : 3 caractères du jeu, la région, l'éditeur. */
  id: string;
  region: Region;
  /** Titre anglais ; pour un disque japonais, forme romanisée ou anglaise (« Zelda no Densetsu: … »). */
  titre: string;
  /** Titre en japonais (locale JA de GameTDB), pour les disques japonais. */
  titreJaponais: string | null;
  editeur: string;
  developpeur: string | null;
  date: { date: string; precision: PrecisionDate } | null;
  /** Genres du disque, traduits en français (US-06). */
  genres: string[];
};

function lireDate(
  annee: string,
  mois: string,
  jour: string,
): DisqueGameTdb["date"] {
  const a = Number(annee);
  const m = Number(mois);
  const j = Number(jour);
  if (!a) return null;
  const deux = (n: number) => String(n).padStart(2, "0");
  if (!m) return { date: `${a}-01-01`, precision: "annee" };
  if (!j) return { date: `${a}-${deux(m)}-01`, precision: "mois" };
  return { date: `${a}-${deux(m)}-${deux(j)}`, precision: "jour" };
}

/**
 * Genre GameTDB des disques qui ne sont pas des jeux : « software » (Wii Startup Disc, #90). Pas « demo » : Wii
 * Karaoke U est un disque d'essai vendu en boîte, gardé au catalogue (les démos DS/3DS : étape 9).
 */
export const pasUnJeu = (champGenre: string) =>
  champGenre.split(",").some((g) => g.trim().toLowerCase() === "software");

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Traductions françaises des genres, données par la base elle-même (bloc `<genres>`) : nom anglais en minuscules
 * (« 3d platformer ») → français (« plates-formes 3D »).
 */
function lireTraductionsGenres($: cheerio.CheerioAPI): Map<string, string> {
  const traductions = new Map<string, string>();
  $("genres maingenre, genres subgenre").each((_, el) => {
    const genre = $(el);
    const fr = genre.children("loc[lang=FR]").first().text().trim();
    const nom = genre.attr("name")?.trim().toLowerCase();
    if (nom && fr) traductions.set(nom, fr);
  });
  return traductions;
}

/** Genres d'un disque (« action,3d platformer »), traduits ; un genre sans traduction garde son nom anglais. */
function traduireGenres(
  champ: string,
  traductions: Map<string, string>,
): string[] {
  const genres = champ
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => majuscule(traductions.get(g.toLowerCase()) ?? g));
  return [...new Set(genres)];
}

/**
 * Disques en boîte de la base GameTDB d'une console (Wii U par défaut). Écartés : ce que `estDisque` refuse (Wii U :
 * eShop, Console virtuelle, boîtes ne contenant qu'un code de téléchargement ; Wii : disques système, démos), les
 * régions non suivies (Corée, Russie…).
 */
export function lireGameTdb(
  xml: string,
  estDisque: SourceConsole["estDisque"] = SOURCES_CONSOLES["wii-u"]!.estDisque,
  /** GameCube : Pokémon Channel est classé « software » ; ses vrais logiciels sont écartés par leur identifiant. */
  garderLogiciels = false,
): DisqueGameTdb[] {
  const $ = cheerio.load(xml, { xml: true });
  const traductions = lireTraductionsGenres($);
  const disques: DisqueGameTdb[] = [];
  $("game").each((_, el) => {
    const jeu = $(el);
    const champ = (nom: string) => jeu.children(nom).first().text().trim();
    // Une cartouche Switch « ALL » vaut dans les 3 régions (étape 10) : un disque par région couverte.
    const regions = regionsGameTdb(champ("region"));
    const titre = jeu.find("locale[lang=EN] > title").first().text().trim();
    if (!regions.length || !titre) return;
    if (
      !estDisque(
        champ("type"),
        champ("id"),
        champ("region"),
        titre,
        champ("genre"),
      )
    )
      return;
    if (!garderLogiciels && pasUnJeu(champ("genre"))) return;
    const date = jeu.children("date").first();
    for (const region of regions)
      disques.push({
        id: champ("id"),
        region,
        titre,
        titreJaponais:
          region === "JAP"
            ? jeu.find("locale[lang=JA] > title").first().text().trim() || null
            : null,
        editeur: champ("publisher"),
        developpeur: champ("developer") || null,
        date: lireDate(
          date.attr("year") ?? "",
          date.attr("month") ?? "",
          date.attr("day") ?? "",
        ),
        genres: traduireGenres(champ("genre"), traductions),
      });
  });
  return disques;
}

/** Un jeu GameTDB : ses disques en boîte, au plus un par région, regroupés par le début de l'identifiant. */
export type JeuGameTdb = {
  base: string;
  disques: Partial<Record<Region, DisqueGameTdb>>;
  /** Au moins une boîte éditée par Nintendo (SPEC v1.4, US-10). */
  nintendo: boolean;
};

const estNintendo = (d: DisqueGameTdb) =>
  d.id.slice(4, 6) === "01" || EDITEUR_NINTENDO.test(d.editeur);

/**
 * Regroupe les disques par jeu : les 3 premiers caractères de l'identifiant sont communs aux régions (`ALZE01`,
 * `ALZJ01`, `ALZP01`). La région se lit dans le champ `region` (un disque PAL peut finir en D, F…). Si une région
 * a plusieurs disques, celui de Nintendo est préféré.
 */
export function regrouperGameTdb(
  disques: DisqueGameTdb[],
  /** Caractères communs aux disques d'un jeu : 3 (Wii U, Wii, DS, 3DS), 4 (Switch : `AAB6A`, `AAB6C`). */
  longueurBase = 3,
): Map<string, JeuGameTdb> {
  const jeux = new Map<string, JeuGameTdb>();
  for (const d of disques) {
    const base = d.id.slice(0, longueurBase);
    const jeu = jeux.get(base) ?? { base, disques: {}, nintendo: false };
    const deja = jeu.disques[d.region];
    // Préférence : une carte de Nintendo ; à égalité, en Europe, la carte anglaise (titre anglais, #95).
    const meilleure =
      !deja ||
      (!estNintendo(deja) && estNintendo(d)) ||
      (estNintendo(deja) === estNintendo(d) &&
        d.region === "PAL" &&
        d.id.length !== 5 && // Switch : la 4ᵉ lettre ne dit pas la langue
        rangCartePal(d.id) < rangCartePal(deja.id)) ||
      // Switch : la cartouche d'origine (lettre finale la plus basse) plutôt qu'une réédition avec extension.
      (estNintendo(deja) === estNintendo(d) &&
        rangCartouche(d.id) < rangCartouche(deja.id));
    if (meilleure) jeu.disques[d.region] = d;
    jeu.nintendo ||= estNintendo(d);
    jeux.set(base, jeu);
  }
  return jeux;
}

/** Index des titres normalisés (US ou PAL de Wikipédia ↔ titre anglais d'un disque) vers les jeux GameTDB. */
export function indexerTitres(
  jeux: Map<string, JeuGameTdb>,
): Map<string, JeuGameTdb> {
  const index = new Map<string, JeuGameTdb>();
  for (const jeu of jeux.values())
    for (const d of Object.values(jeu.disques))
      if (d && !index.has(normaliser(d.titre)))
        index.set(normaliser(d.titre), jeu);
  return index;
}

/** Le jeu GameTDB d'un jeu Wikipédia, par son titre US ou PAL (identique une fois normalisé), ou null. */
export function rapprocherGameTdb(
  titres: string[],
  index: Map<string, JeuGameTdb>,
): JeuGameTdb | null {
  for (const t of titres) {
    const jeu = index.get(normaliser(t));
    if (jeu) return jeu;
  }
  return null;
}

/**
 * Jeux en boîte de Nintendo que la liste Wikipédia n'a pas donnés (compilations comme NES Remix Pack, sorties
 * japonaises sous un autre titre…) : ils ont leur propre fiche (SPEC v1.4).
 */
export function jeuxSansWikipedia(
  jeux: Map<string, JeuGameTdb>,
  basesRapprochees: Set<string>,
): JeuGameTdb[] {
  return [...jeux.values()].filter(
    (j) => j.nintendo && !basesRapprochees.has(j.base),
  );
}

/**
 * Code produit imprimé sur la boîte : préfixe de la console + les 4 premiers caractères de l'identifiant
 * (Wii U : ALZP01 → WUP-P-ALZP ; Wii : RMCP01 → RVL-RMCP, sans le suffixe de pays que GameTDB ne donne pas).
 */
export function codeProduit(
  id: string,
  prefixe: string | ((id: string) => string) = "WUP-P-",
): string {
  const debut = typeof prefixe === "function" ? prefixe(id) : prefixe;
  // Switch : l'identifiant entier de 5 caractères (HAC-P-AAAAA).
  return `${debut}${id.length === 5 ? id : id.slice(0, 4)}`;
}

/**
 * Relais (#53) : GameTDB refuse les serveurs de Vercel. La tâche GitHub « Relais GameTDB »
 * (scripts/relais-gametdb.mjs) dépose la base et les scans dans ce bucket privé de Supabase, où l'import les lit.
 */
export const BUCKET_GAMETDB = "gametdb";

/**
 * Chemin du scan de boîte d'un disque dans le bucket du relais (langue déjà choisie par le relais) ; Wii : face
 * avant déjà découpée, dans `wii/faces` (#87).
 */
export function cheminScan(id: string, dossier = "scans"): string {
  // 6 caractères (Wii, Wii U), 5 (Switch) ou 4 (DS, 3DS).
  if (!/^[A-Z0-9]{4}([A-Z0-9]{1,2})?$/.test(id))
    throw new Error(`Identifiant GameTDB invalide : « ${id} »`);
  return `${dossier}/${id}.jpg`;
}
