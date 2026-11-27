// Guides japonais (étape 29, SPEC US-27 et US-28, DESIGN ADR-19 et étude §1 septdecies) : ISBN, tri guide / artbook
// / magazine, rapprochement d'un livre avec un jeu du catalogue, adresses de couverture et d'achat.
// Module pur, sans import : lu aussi par scripts/guides.mjs (Node sans alias « @/ »).

/** ISBN à 13 chiffres (sans tirets) depuis un ISBN à 10 ou 13 chiffres ; null si invalide (clé de contrôle comprise). */
export function isbn13(texte: string | null | undefined): string | null {
  const brut = (texte ?? "").replace(/[-\s]/g, "").toUpperCase();
  if (/^97[89]\d{10}$/.test(brut))
    return cle13(brut.slice(0, 12)) === brut[12] ? brut : null;
  if (!/^\d{9}[\dX]$/.test(brut)) return null;
  const somme10 = [...brut].reduce(
    (t, c, i) => t + (c === "X" ? 10 : Number(c)) * (10 - i),
    0,
  );
  if (somme10 % 11 !== 0) return null;
  const base = `978${brut.slice(0, 9)}`;
  return base + cle13(base);
}

function cle13(douze: string): string {
  const somme = [...douze].reduce(
    (t, c, i) => t + Number(c) * (i % 2 ? 3 : 1),
    0,
  );
  return String((10 - (somme % 10)) % 10);
}

/** Forme comparable d'un titre : NFKC, minuscules, sans espaces ni ponctuation (« PIKMIN 4 » = « pikmin4 »). */
export function compact(titre: string | null | undefined): string {
  return (titre ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[\s・·:：!！?？、。.,'’"“”\-－~〜()（）「」『』【】&＆/＋+]+/g,
      "",
    );
}

export const JAPONAIS = /[぀-ヿ一-鿿]/;

/** Mots d'un livre de stratégie (攻略本). */
const MOTS_GUIDE =
  /攻略|ガイド|必勝|大百科|大全|マニュアル|ヒント|裏技|ウルテク|秘技|テクニック|バイブル|ナビ|完全/;
/** Livres écartés d'office (SPEC US-28) : artbooks, croquis, recueils de visuels, carnets de motifs, imagiers, magazines, suppléments, romans, mangas, musique. */
const PAS_UN_GUIDE =
  /アート|シークレットファイル|アーカイブス|art\s*of|artworks?|設定資料|資料集|デザインブック|デザイン\s*book|ずかん|画集|イラスト|ウォーカー|walker|ファンブック|月刊|増刊|付録|ふろく|コミック|コロコロ|漫画|マンガ|4コマ|アンソロジー|小説|ノベル|サウンドトラック|楽譜|ピアノ|カレンダー|シール|ぬりえ|ポスター/i;

/** Un livre est un guide : livre de jeu (NDC 798) ou mot de guide dans le titre, et rien qui l'écarte. */
export function estGuide(titre: string, ndc: readonly string[] = []): boolean {
  if (PAS_UN_GUIDE.test(titre.normalize("NFKC"))) return false;
  return ndc.some((n) => n.startsWith("798")) || MOTS_GUIDE.test(titre);
}

/** Consoles citées dans un titre de livre ; l'ordre compte (« 3DS » avant « DS », « スーパーファミコン » avant « ファミコン »). */
const MARQUES: readonly [string, RegExp][] = [
  ["switch-2", /switch\s*2|スイッチ\s*2/gi],
  ["switch", /switch|スイッチ/gi],
  ["3ds", /3ds/gi],
  ["ds", /(?<![a-z0-9])ds(?![a-z])/gi],
  ["wii-u", /wii\s*u/gi],
  ["wii", /wii/gi],
  ["gamecube", /ゲームキューブ|gamecube/gi],
  [
    "gba",
    /ゲームボーイアドバンス|ファミコンミニ|(?<![a-z0-9])gba(?![a-z0-9])/gi,
  ],
  [
    "snes",
    /スーパーファミコン|スーファミ|super\s*famicom|(?<![a-z0-9])sfc(?![a-z0-9])/gi,
  ],
  [
    "nes",
    /ファミリーコンピュータ|ファミコン|ディスクシステム|famicom|(?<![a-z0-9])fc(?![a-z0-9])/gi,
  ],
  ["gbc", /ゲームボーイカラー|gbカラー|(?<![a-z0-9])gbc(?![a-z0-9])/gi],
  ["gb", /ゲームボーイ|game\s*boy|(?<![a-z0-9])gb(?![a-z0-9])/gi],
  ["n64", /ニンテンドウ64|ニンテンドー64|任天堂\s*64|nintendo\s*64|n64/gi],
  ["autre", /プレイステーション|playstation|ps[2-5]|xbox|steam/gi],
];

/** Consoles citées par le titre d'un livre, une fois retirés les titres du jeu (« スターフォックス64 3D » ne cite pas la N64). */
export function consolesCitees(
  titreLivre: string,
  titresJeu: readonly string[],
): Set<string> {
  let t = titreLivre.normalize("NFKC");
  for (const j of titresJeu) if (j) t = t.split(j.normalize("NFKC")).join(" ");
  const citees = new Set<string>();
  for (const [console, re] of MARQUES) {
    re.lastIndex = 0;
    if (re.test(t)) {
      citees.add(console);
      t = t.replace(re, " ");
    }
  }
  return citees;
}

export type Livre = {
  titre: string;
  isbn: string | null;
  annee: number | null;
  ndc: readonly string[];
};

export type JeuCherche = {
  console: string;
  /** Titres du jeu : JAP, titres japonais de Wikidata, titre en lettres latines (« Pikmin 4 »). */
  titres: readonly string[];
  annee: number | null;
};

export type Verdict =
  | { garde: true; par: "console" | "date" }
  | {
      garde: false;
      raison:
        | "sans-isbn"
        | "pas-un-guide"
        | "autre-titre"
        | "suite"
        | "autre-jeu"
        | "autre-console"
        | "hors-dates";
    };

/**
 * Ce livre est-il un guide de ce jeu ? (SPEC US-28) Il faut : un ISBN, un guide, un titre du jeu dans le titre du
 * livre, non suivi d'un chiffre (« ピクミン » ne prend pas « ピクミン3 »), pas le titre plus long d'un AUTRE jeu du
 * catalogue qui le contient (« ゼノブレイドクロス » est Xenoblade X, « Hey!ピクミン » n'est pas Pikmin), et la bonne console citée ou, sans console citée, une parution
 * entre l'année d'avant et 4 ans après le jeu. Un titre latin de moins de 5 caractères est ignoré (trop de faux).
 */
export function jugerLivre(
  livre: Livre,
  jeu: JeuCherche,
  autresTitres: readonly string[],
): Verdict {
  if (!isbn13(livre.isbn)) return { garde: false, raison: "sans-isbn" };
  if (!estGuide(livre.titre, livre.ndc))
    return { garde: false, raison: "pas-un-guide" };
  const livreC = compact(livre.titre);
  const titres = jeu.titres
    .map(compact)
    .filter(
      (t) => t.length >= (JAPONAIS.test(t) ? 2 : 5) && livreC.includes(t),
    );
  if (!titres.length) return { garde: false, raison: "autre-titre" };
  const suivi = (t: string) => livreC.slice(livreC.indexOf(t) + t.length);
  if (titres.every((t) => /^[0-9ⅰ-ⅻⅠ-Ⅻ]/.test(suivi(t))))
    return { garde: false, raison: "suite" };
  const plusLong = autresTitres
    .map(compact)
    .some((a) =>
      titres.every(
        (t) => a.length > t.length && a.includes(t) && livreC.includes(a),
      ),
    );
  if (plusLong) return { garde: false, raison: "autre-jeu" };
  const citees = consolesCitees(livre.titre, jeu.titres);
  if (citees.size)
    return citees.has(jeu.console)
      ? { garde: true, par: "console" }
      : { garde: false, raison: "autre-console" };
  if (
    jeu.annee &&
    livre.annee &&
    (livre.annee < jeu.annee - 1 || livre.annee > jeu.annee + 4)
  )
    return { garde: false, raison: "hors-dates" };
  return { garde: true, par: "date" };
}

/** « 2023.11 » → date et précision de la base ; null si illisible. */
export function dateNdl(
  texte: string | null | undefined,
): { date: string; precision: "jour" | "mois" | "annee" } | null {
  const m = (texte ?? "").match(/(\d{4})(?:[.-](\d{1,2}))?(?:[.-](\d{1,2}))?/);
  if (!m) return null;
  const deux = (n: string | undefined) => (n ?? "").padStart(2, "0");
  if (m[3])
    return { date: `${m[1]}-${deux(m[2])}-${deux(m[3])}`, precision: "jour" };
  if (m[2]) return { date: `${m[1]}-${deux(m[2])}-01`, precision: "mois" };
  return { date: `${m[1]}-01-01`, precision: "annee" };
}

/** « 367p ; 21cm » → 367 ; null sinon. */
export function pagesNdl(texte: string | null | undefined): number | null {
  const n = Number((texte ?? "").match(/(\d+)\s*p/)?.[1]);
  return n > 0 && n < 32768 ? n : null;
}

/** Couverture servie par Google Books (300 px de large, ADR-19 point 2) ; jamais copiée chez nous. */
export function adresseCouverture(googleBooksId: string): string {
  return `https://books.google.com/books/content?id=${encodeURIComponent(googleBooksId)}&printsec=frontcover&img=1&zoom=1&fife=w800-h1200`;
}

/** Page du livre chez Google Books (lien exigé par ses conditions). */
export function adresseGoogleBooks(googleBooksId: string): string {
  return `https://books.google.com/books?id=${encodeURIComponent(googleBooksId)}`;
}

/** Recherches de l'ISBN chez Amazon Japon et Suruga-ya (occasion), ADR-19 point 3. */
export function liensAchat(isbn: string): { amazon: string; surugaya: string } {
  return {
    amazon: `https://www.amazon.co.jp/s?k=${isbn}`,
    surugaya: `https://www.suruga-ya.jp/search?search_word=${isbn}`,
  };
}

/** Identifiant Google Books d'une réponse « volumes?q=isbn: », seulement si le livre a une vignette de couverture. */
export function idGoogleBooks(reponse: unknown): string | null {
  const items = (
    reponse as {
      items?: { id?: string; volumeInfo?: { imageLinks?: unknown } }[];
    }
  )?.items;
  const premier = items?.[0];
  if (!premier?.id || !premier.volumeInfo?.imageLinks) return null;
  return /^[A-Za-z0-9_-]{8,20}$/.test(premier.id) ? premier.id : null;
}

/**
 * Fichier de planche relu par l'écriture : celui de la console demandée, jamais « le premier
 * trouvé » (bug du 25/11/2026 : numéros Switch appliqués à la planche 3DS). `lue` : console
 * inscrite dans le fichier, vérifiée après lecture.
 */
export function fichierPlanche(
  demandee: string,
  lue: string | undefined,
): string {
  if (!demandee)
    throw new Error("--ecrire exige --console (ex. --console switch)");
  if (lue !== undefined && lue !== demandee)
    throw new Error(`planche de la console ${lue}, pas ${demandee}`);
  return `guides-${demandee}.json`;
}
