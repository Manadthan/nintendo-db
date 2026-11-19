/**
 * Note Metacritic lue dans un article Wikipédia (US-17, DESIGN v1.7 ADR-08) : encadré « Video game reviews »
 * (`| MC = 81/100`, `| MC_WIIU = 92/100`…). La note n'est retenue que si elle est sans ambiguïté celle de la console du
 * jeu : mieux vaut pas de note (saisissable à la main) qu'une note d'une autre console.
 */
export type NoteLue =
  | { statut: "note"; note: number; url: string | null }
  | { statut: "sans-note"; raison: string }
  | { statut: "ambigu"; raison: string };

type Reperes = {
  /** Suffixes de `MC_…` dans l'encadré, et étiquettes entre parenthèses (« 89/100 (GC) »). */
  suffixes: string[];
  /** Valeur de `?platform=` dans l'adresse Metacritic citée. */
  plateforme: string;
  /** Nom de la console dans la liste des plateformes de l'encadré du jeu. */
  nomWikipedia: string;
};

const CONSOLES: Record<string, Reperes> = {
  gamecube: {
    suffixes: ["NGC", "GC", "GCN"],
    plateforme: "gamecube",
    nomWikipedia: "GameCube",
  },
  wii: { suffixes: ["WII"], plateforme: "wii", nomWikipedia: "Wii" },
  "wii-u": { suffixes: ["WIIU"], plateforme: "wii-u", nomWikipedia: "Wii U" },
  ds: {
    suffixes: ["DS", "NDS"],
    plateforme: "ds",
    nomWikipedia: "Nintendo DS",
  },
  "3ds": { suffixes: ["3DS"], plateforme: "3ds", nomWikipedia: "Nintendo 3DS" },
  switch: {
    suffixes: ["NS", "NSW", "SWITCH"],
    plateforme: "nintendo-switch",
    nomWikipedia: "Nintendo Switch",
  },
  "switch-2": {
    suffixes: ["NS2"],
    plateforme: "nintendo-switch-2",
    nomWikipedia: "Nintendo Switch 2",
  },
};

/** Page Metacritic du jeu à partir d'une adresse citée : https, sans « critic-reviews » ni paramètres. */
export function pageMetacritic(adresse: string): string | null {
  const m = adresse.match(
    /^https?:\/\/(?:www\.)?metacritic\.com(\/[^\s|}?#]*)/i,
  );
  if (!m) return null;
  const chemin = m[1]!.replace(/\/critic-reviews\/?$/, "/");
  return `https://www.metacritic.com${chemin.endsWith("/") ? chemin : `${chemin}/`}`;
}

/** Plateformes listées dans l'encadré du jeu (`| platforms = {{ubl|[[GameCube]]|[[Wii]]}}`). */
function plateformes(wikitexte: string): string[] {
  const ligne = wikitexte.match(/^\s*\|\s*platforms?\s*=\s*(.*)$/im)?.[1] ?? "";
  return [...ligne.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) =>
    m[1]!.trim(),
  );
}

export function lireNoteMetacritic(
  wikitexte: string,
  consoleSlug: string,
): NoteLue {
  const reperes = CONSOLES[consoleSlug];
  if (!reperes)
    return { statut: "sans-note", raison: "console non prise en charge" };

  const lignes = [
    ...wikitexte.matchAll(/^\s*\|\s*MC(?:_([A-Z0-9]+))?\s*=\s*(.*)$/gm),
  ].map((m) => ({
    suffixe: m[1]?.toUpperCase() ?? null,
    valeur: m[2]!,
  }));
  const notes = lignes.filter((l) => /\d{1,3}\s*\/\s*100/.test(l.valeur));
  if (!notes.length)
    return {
      statut: "sans-note",
      raison: "pas de note Metacritic dans l'article",
    };

  const lire = (
    valeur: string,
  ): { note: number; url: string | null } | null => {
    const n = Number(valeur.match(/(\d{1,3})\s*\/\s*100/)![1]);
    if (n > 100) return null;
    const adresse = valeur.match(
      /https?:\/\/(?:www\.)?metacritic\.com[^\s|}]*/i,
    )?.[0];
    return { note: n, url: adresse ? pageMetacritic(adresse) : null };
  };

  // 1. Une note étiquetée avec la console du jeu (`MC_WIIU`).
  const etiquetee = notes.find(
    (l) => l.suffixe && reperes.suffixes.includes(l.suffixe),
  );
  if (etiquetee) {
    const lu = lire(etiquetee.valeur);
    return lu
      ? { statut: "note", ...lu }
      : { statut: "ambigu", raison: "note illisible" };
  }
  if (notes.some((l) => l.suffixe))
    return { statut: "sans-note", raison: "notes d'autres consoles seulement" };

  // 2. Une note sans suffixe. Plusieurs notes sur la ligne (« 89/100 (GC) <br/> 77/100 (Wii) ») : chacune doit porter
  // sa console entre parenthèses, et on prend celle du jeu.
  if (notes.length > 1)
    return { statut: "ambigu", raison: "plusieurs notes sans console" };
  const valeur = notes[0]!.valeur;
  const segments = [
    ...valeur.matchAll(/(\d{1,3})\s*\/\s*100(?:\s*\(([A-Za-z0-9]+)\))?/g),
  ].map((m) => ({
    note: Number(m[1]),
    etiquette: m[2]?.toUpperCase() ?? null,
    // Texte qui suit cette note, jusqu'à la suivante : sa référence (adresse Metacritic).
    suite: valeur.slice(m.index! + m[0].length),
  }));
  if (segments.length > 1) {
    if (segments.some((s) => !s.etiquette))
      return { statut: "ambigu", raison: "plusieurs notes sans console" };
    const choisi = segments.find((s) =>
      reperes.suffixes.includes(s.etiquette!),
    );
    if (!choisi)
      return {
        statut: "sans-note",
        raison: "notes d'autres consoles seulement",
      };
    if (choisi.note > 100)
      return { statut: "ambigu", raison: "note illisible" };
    const adresse = choisi.suite
      .split(/\d{1,3}\s*\/\s*100/)[0]!
      .match(/https?:\/\/(?:www\.)?metacritic\.com[^\s|}]*/i)?.[0];
    return {
      statut: "note",
      note: choisi.note,
      url: adresse ? pageMetacritic(adresse) : null,
    };
  }
  const etiquette = segments[0]?.etiquette;
  const plateformeUrl = valeur
    .match(/[?&]platform=([a-z0-9-]+)/i)?.[1]
    ?.toLowerCase();
  const lu = lire(valeur);
  if (!lu) return { statut: "ambigu", raison: "note illisible" };
  if (etiquette)
    return reperes.suffixes.includes(etiquette)
      ? { statut: "note", ...lu }
      : {
          statut: "sans-note",
          raison: `note d'une autre console (${etiquette})`,
        };
  if (plateformeUrl)
    return plateformeUrl === reperes.plateforme
      ? { statut: "note", ...lu }
      : {
          statut: "sans-note",
          raison: `note d'une autre console (${plateformeUrl})`,
        };
  const listees = plateformes(wikitexte);
  if (listees.length === 1 && listees[0] === reperes.nomWikipedia)
    return { statut: "note", ...lu };
  return {
    statut: "ambigu",
    raison: `note sans console, article sur ${listees.length || "?"} plateformes`,
  };
}

/** Jeu dont on cherche la note : adresse Wikipédia connue (Wii U, Switch 2) ou titres de ses versions. */
export type JeuANoter = {
  wikipediaUrl: string | null;
  titres: { US: string | null; PAL: string | null; romanise: string | null };
};

/** Titre de l'article Wikipédia anglais à lire : celui de l'adresse connue, sinon le titre US, PAL ou romanisé. */
export function titreArticle(jeu: JeuANoter): string | null {
  if (jeu.wikipediaUrl) {
    const chemin = jeu.wikipediaUrl.split("/wiki/")[1];
    if (chemin) return decodeURIComponent(chemin).replace(/_/g, " ");
  }
  return jeu.titres.US ?? jeu.titres.PAL ?? jeu.titres.romanise ?? null;
}

/**
 * Réponse de l'API Wikipédia (`action=query&prop=revisions`, `redirects=1`) → wikitexte par titre demandé, en suivant
 * les redirections et la normalisation des titres (« Doubutsu Banchou » → « Cubivore… »).
 */
export function articlesParTitre(reponse: {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: {
      title: string;
      missing?: boolean;
      revisions?: { slots?: { main?: { content?: string } } }[];
    }[];
  };
}): (titre: string) => string | null {
  const q = reponse.query ?? {};
  const normalise = new Map((q.normalized ?? []).map((n) => [n.from, n.to]));
  const redirige = new Map((q.redirects ?? []).map((r) => [r.from, r.to]));
  const contenus = new Map(
    (q.pages ?? [])
      .filter((p) => !p.missing)
      .map((p) => [p.title, p.revisions?.[0]?.slots?.main?.content ?? ""]),
  );
  return (titre) => {
    const n = normalise.get(titre) ?? titre;
    return contenus.get(redirige.get(n) ?? n) ?? null;
  };
}
