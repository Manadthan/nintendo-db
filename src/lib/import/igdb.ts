import type { Region } from "@/lib/catalogue/types";
import { normaliser } from "@/lib/recherche/normaliser";

/**
 * Lecture d'IGDB (import, ADR-03 point 2) : retrouver un jeu sur une plateforme, puis ses titres et jaquettes
 * par région. Côté serveur uniquement : les identifiants Twitch ne quittent jamais le serveur.
 * Réponses réelles en fixtures : src/lib/import/__fixtures__/igdb/ (workflow « Capturer les fixtures IGDB »).
 */

export type ResultatIgdb = {
  id: number;
  name: string;
  platforms?: number[];
  first_release_date?: number;
  cover?: { image_id: string };
  alternative_names?: { name: string; comment?: string }[];
  game_localizations?: {
    name?: string;
    region?: { identifier: string };
    cover?: { image_id: string };
  }[];
};

export type Rapprochement = {
  /** sur : titre exact ; a-verifier : titre seulement proche (R1) ; introuvable : rien de proche. */
  statut: "sur" | "a-verifier" | "introuvable";
  jeu: ResultatIgdb | null;
  /** Tous les résultats, pour un choix à la main dans l'aperçu (#34). */
  candidats: { id: number; name: string }[];
};

const noms = (r: ResultatIgdb) =>
  [r.name, ...(r.alternative_names ?? []).map((a) => a.name)].map(normaliser);

/**
 * Choisit, parmi les résultats d'une recherche IGDB, le jeu qui correspond à l'un des titres connus (US, PAL…).
 * Titre exact (ou nom alternatif exact) : sûr. Titre qui commence pareil : à vérifier. Sinon : introuvable.
 * La recherche d'IGDB renvoie aussi DLC, packs et éditions limitées : seul un titre exact est « sûr ».
 */
export function rapprocher(
  titres: string[],
  resultats: ResultatIgdb[],
): Rapprochement {
  const cherches = titres.map(normaliser).filter(Boolean);
  const candidats = resultats.map((r) => ({ id: r.id, name: r.name }));

  const exact = resultats.find((r) =>
    noms(r).some((n) => cherches.includes(n)),
  );
  if (exact) return { statut: "sur", jeu: exact, candidats };

  const proche = resultats.find((r) =>
    noms(r).some((n) =>
      cherches.some((c) => n.startsWith(c) || c.startsWith(n)),
    ),
  );
  if (proche) return { statut: "a-verifier", jeu: proche, candidats };

  return { statut: "introuvable", jeu: null, candidats };
}

export type InfosIgdb = {
  igdbId: number;
  titreJaponais: string | null;
  /** Identifiants d'image IGDB par région ; null quand IGDB n'a pas de jaquette propre à la région (R2). */
  jaquettes: Record<Region, string | null>;
};

/** Régions IGDB (identifiants « ja-JP », « EU »…) → nos régions. IGDB n'a pas de région nord-américaine. */
const REGIONS_IGDB: Record<string, Region> = { "ja-JP": "JAP", EU: "PAL" };

/** Titre japonais et jaquettes par région ; la jaquette principale d'IGDB est celle d'Amérique du Nord. */
export function versInfosIgdb(jeu: ResultatIgdb): InfosIgdb {
  const localisation = (region: Region) =>
    jeu.game_localizations?.find(
      (l) => l.region && REGIONS_IGDB[l.region.identifier] === region,
    );
  return {
    igdbId: jeu.id,
    titreJaponais: localisation("JAP")?.name ?? null,
    jaquettes: {
      JAP: localisation("JAP")?.cover?.image_id ?? null,
      US: jeu.cover?.image_id ?? null,
      PAL: localisation("PAL")?.cover?.image_id ?? null,
    },
  };
}

/** Adresse d'une image IGDB ; t_cover_big_2x = 528 × 748, assez pour nos WebP 300 et 600 px (ADR-04). */
export function urlImageIgdb(
  imageId: string,
  taille = "t_cover_big_2x",
): string {
  return `https://images.igdb.com/igdb/image/upload/${taille}/${imageId}.jpg`;
}

const CHAMPS = [
  "name",
  "platforms",
  "first_release_date",
  "cover.image_id",
  "alternative_names.name",
  "alternative_names.comment",
  "game_localizations.name",
  "game_localizations.region.identifier",
  "game_localizations.cover.image_id",
].join(",");

type Options = {
  clientId: string;
  clientSecret: string;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  /** Attente entre deux requêtes : 4 requêtes/s au plus (R7). Remplaçable dans les tests. */
  pause?: () => Promise<void>;
};

/** Client IGDB : jeton Twitch demandé à la volée et gardé jusqu'à son expiration, requêtes espacées. */
export function creerClientIgdb({
  clientId,
  clientSecret,
  fetch = globalThis.fetch,
  pause = () => new Promise((r) => setTimeout(r, 260)),
}: Options) {
  let jeton: { valeur: string; expire: number } | null = null;

  async function obtenirJeton(): Promise<string> {
    if (jeton && Date.now() < jeton.expire) return jeton.valeur;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });
    const reponse = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
      method: "POST",
    });
    // Message sans les identifiants : ils ne doivent apparaître dans aucun journal.
    if (!reponse.ok)
      throw new Error(
        `Jeton Twitch refusé (HTTP ${reponse.status}) : vérifier IGDB_CLIENT_ID et IGDB_CLIENT_SECRET`,
      );
    const { access_token, expires_in } = (await reponse.json()) as {
      access_token: string;
      expires_in: number;
    };
    jeton = {
      valeur: access_token,
      expire: Date.now() + (expires_in - 60) * 1000,
    };
    return access_token;
  }

  return {
    /** Jeux d'une plateforme IGDB (Wii U : 41) dont le titre ressemble à `titre`. */
    async chercher(titre: string, plateforme: number): Promise<ResultatIgdb[]> {
      const token = await obtenirJeton();
      await pause();
      const corps = `search "${titre.replace(/"/g, '\\"')}"; fields ${CHAMPS}; where platforms = (${plateforme}); limit 10;`;
      const reponse = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: corps,
      });
      if (!reponse.ok)
        throw new Error(
          `IGDB a refusé la recherche « ${titre} » (HTTP ${reponse.status})`,
        );
      return (await reponse.json()) as ResultatIgdb[];
    },
  };
}
