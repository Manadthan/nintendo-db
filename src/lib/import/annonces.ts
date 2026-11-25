// Annonces de Nintendo (US-33, ADR-20 point 5) : jeux édités par Nintendo pas encore sortis, lus dans les bases
// officielles de Nintendo Japon, Europe et US (DESIGN §1 novodecies). Module pur, SANS import : lu aussi par
// scripts/relais-annonces.mjs (Node lit directement ce TypeScript).

export type RegionAnnonce = "JAP" | "US" | "PAL";
export type PrecisionAnnonce =
  "jour" | "mois" | "saison" | "annee" | "inconnue";
export type ConsoleAnnonce = "switch" | "switch-2";

/** Un jeu annoncé dans une région, tel que la source le donne (le rapprochement entre régions se fait à l'import). */
export type Annonce = {
  region: RegionAnnonce;
  console: ConsoleAnnonce;
  titre: string;
  /** AAAA-MM-JJ ; à la saison, son 1er jour ; à l'année, le 1er janvier ; vide si inconnue. */
  date: string | null;
  precision: PrecisionAnnonce;
  /** Image officielle (boîte US, visuel du Japon ou de l'Europe) ; null si la source n'en donne pas. */
  image: string | null;
  /** Boîte vendue (US : produit du My Nintendo Store) ; null si la source ne le dit pas. */
  physique: boolean | null;
  /** Identifiant chez la source (nsuid, fs_id), pour retrouver l'annonce. */
  idSource: string;
};

const SAISONS: Record<string, string> = {
  春: "03",
  夏: "06",
  秋: "09",
  冬: "12",
};
const SAISONS_FR: Record<string, string> = {
  printemps: "03",
  été: "06",
  automne: "09",
  hiver: "12",
};
const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const deux = (n: string | number) => String(n).padStart(2, "0");

/** Éditions spéciales, contenus en plus, consoles et lots : jamais un jeu du catalogue (variantes : hors périmètre). */
const HORS_JEU =
  /(スペシャル|リミテッド|コレクターズ)エディション|special edition|limited edition|collector'?s|upgrade pack|expansion pass|bundle|\bdlc\b|セット$/i;

const sansMarques = (t: string) =>
  t.replace(/[™®]/g, "").replace(/\s+/g, " ").trim();

/**
 * Est-ce encore à venir ? (même règle que src/lib/catalogue/a-venir.ts, recopiée ici : ce module n'importe rien.)
 */
export function annonceAVenir(
  date: string | null,
  precision: PrecisionAnnonce,
  aujourdhui: string,
): boolean {
  if (precision === "inconnue") return true;
  if (!date) return false;
  if (precision === "annee") return date.slice(0, 4) > aujourdhui.slice(0, 4);
  if (precision === "mois") return date.slice(0, 7) > aujourdhui.slice(0, 7);
  return date > aujourdhui;
}

/** Date du calendrier japonais : « 2027.1.28 », « 2027.1 », « 2027.春 », « 2027 » ; sinon inconnue. */
export function dateJapon(sdate: string | null | undefined): {
  date: string | null;
  precision: PrecisionAnnonce;
} {
  const t = (sdate ?? "").trim();
  let m = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(t);
  if (m)
    return { date: `${m[1]}-${deux(m[2]!)}-${deux(m[3]!)}`, precision: "jour" };
  m = /^(\d{4})\.(\d{1,2})$/.exec(t);
  if (m) return { date: `${m[1]}-${deux(m[2]!)}-01`, precision: "mois" };
  m = /^(\d{4})\.([春夏秋冬])$/.exec(t);
  if (m) return { date: `${m[1]}-${SAISONS[m[2]!]}-01`, precision: "saison" };
  m = /^(\d{4})$/.exec(t);
  if (m) return { date: `${m[1]}-01-01`, precision: "annee" };
  return { date: null, precision: "inconnue" };
}

/** Date de Nintendo Europe, lue dans son libellé (« 28/01/2027 », « 2027 », « Mars 2027 », « Date à déterminer »). */
export function dateEurope(
  libelle: string | null | undefined,
  iso: string | null | undefined,
): { date: string | null; precision: PrecisionAnnonce } {
  const t = (libelle ?? "").trim().toLowerCase();
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (m) return { date: `${m[3]}-${m[2]}-${m[1]}`, precision: "jour" };
  m = /^(\d{4})$/.exec(t);
  if (m) return { date: `${m[1]}-01-01`, precision: "annee" };
  m = /^(\S+) (\d{4})$/.exec(t);
  if (m && SAISONS_FR[m[1]!])
    return { date: `${m[2]}-${SAISONS_FR[m[1]!]}-01`, precision: "saison" };
  if (m && MOIS_FR.includes(m[1]!))
    return {
      date: `${m[2]}-${deux(MOIS_FR.indexOf(m[1]!) + 1)}-01`,
      precision: "mois",
    };
  // Sans libellé lisible : la date brute, sauf la date de remplacement « à déterminer » (31/12/2050).
  const brute = (iso ?? "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(brute) && !brute.startsWith("2050"))
    return { date: brute, precision: "jour" };
  return { date: null, precision: "inconnue" };
}

/** Date de Nintendo US : le 31/12 tient lieu d'année seule (« 2027 »), comme pour les amiibo (§1 novodecies). */
export function dateEtatsUnis(iso: string | null | undefined): {
  date: string | null;
  precision: PrecisionAnnonce;
} {
  const d = (iso ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d))
    return { date: null, precision: "inconnue" };
  if (d.endsWith("-12-31"))
    return { date: `${d.slice(0, 4)}-01-01`, precision: "annee" };
  return { date: d, precision: "jour" };
}

type ItemJapon = {
  id?: string | null;
  title?: string | null;
  sdate?: string | null;
  hard?: string | null;
  sform?: string | null;
  maker?: string | null;
  iurl?: string | null;
};

const CONSOLES_JAPON: Record<string, ConsoleAnnonce> = {
  "05_BEE": "switch-2",
  "1_HAC": "switch",
};
const PRECISION_RANG: Record<PrecisionAnnonce, number> = {
  jour: 4,
  mois: 3,
  saison: 2,
  annee: 1,
  inconnue: 0,
};

/** Ne garde, pour un même jeu (titre + console), que l'annonce à la date la plus précise. */
function sansDoublon(annonces: Annonce[]): Annonce[] {
  const parJeu = new Map<string, Annonce>();
  for (const a of annonces) {
    // Tirets longs et courts confondus (« – » et « - » pour le même jeu chez Nintendo US, 25/11/2026).
    const cle = `${a.console}|${a.titre.toLowerCase().replace(/\s*[-–—]\s*/g, " - ")}`;
    const deja = parJeu.get(cle);
    if (!deja) {
      parJeu.set(cle, a);
      continue;
    }
    const meilleure =
      PRECISION_RANG[a.precision] > PRECISION_RANG[deja.precision] ? a : deja;
    parJeu.set(cle, {
      ...meilleure,
      image: meilleure.image ?? (meilleure === a ? deja.image : a.image),
      physique:
        a.physique || deja.physique ? true : (meilleure.physique ?? null),
    });
  }
  return [...parJeu.values()];
}

/**
 * Calendrier de Nintendo Japon : jeux de Nintendo et de The Pokémon Company, Switch et Switch 2, en boîte ou en
 * téléchargement avec boîte (`*_CARD`, `*_DOWNLOADABLE`) ; écartés : téléchargement seul, contenus en plus,
 * consoles, accessoires, amiibo (étape 30), éditions spéciales.
 */
export function lireJapon(items: ItemJapon[], aujourdhui: string): Annonce[] {
  const annonces: Annonce[] = [];
  for (const it of items) {
    const console_ = CONSOLES_JAPON[it.hard ?? ""];
    if (
      !console_ ||
      !/^(任天堂|ポケモン|株式会社ポケモン)$/.test(it.maker ?? "")
    )
      continue;
    if (!/_(CARD|DOWNLOADABLE)$/.test(it.sform ?? "")) continue;
    const titre = sansMarques(it.title ?? "");
    if (!titre || HORS_JEU.test(titre)) continue;
    const { date, precision } = dateJapon(it.sdate);
    if (!annonceAVenir(date, precision, aujourdhui)) continue;
    annonces.push({
      region: "JAP",
      console: console_,
      titre,
      date,
      precision,
      image: it.iurl
        ? `https://img-eshop.cdn.nintendo.net/i/${it.iurl}.jpg`
        : null,
      physique: /_CARD$/.test(it.sform ?? "") ? true : null,
      idSource: it.id ?? "",
    });
  }
  return sansDoublon(annonces);
}

type DocEurope = {
  fs_id?: string;
  title?: string;
  publisher?: string;
  dates_released_dts?: string[];
  pretty_date_s?: string;
  system_names_txt?: string[];
  image_url?: string;
};

/** Base de Nintendo Europe (Solr, `type:GAME AND publisher:Nintendo`) : jeux Switch et Switch 2 à venir. */
export function lireEurope(docs: DocEurope[], aujourdhui: string): Annonce[] {
  const annonces: Annonce[] = [];
  for (const d of docs) {
    const systemes = d.system_names_txt ?? [];
    const console_: ConsoleAnnonce | null = systemes.includes(
      "Nintendo Switch 2",
    )
      ? "switch-2"
      : systemes.includes("Nintendo Switch")
        ? "switch"
        : null;
    if (!console_ || d.publisher !== "Nintendo") continue;
    const titre = sansMarques(d.title ?? "");
    if (!titre || HORS_JEU.test(titre)) continue;
    const { date, precision } = dateEurope(
      d.pretty_date_s,
      d.dates_released_dts?.[0],
    );
    if (!annonceAVenir(date, precision, aujourdhui)) continue;
    annonces.push({
      region: "PAL",
      console: console_,
      titre,
      date,
      precision,
      image: d.image_url ?? null,
      physique: null,
      idSource: d.fs_id ?? "",
    });
  }
  return sansDoublon(annonces);
}

type ProduitEtatsUnis = {
  name?: string;
  nsuid?: string | null;
  platform?: string | { label?: string } | null;
  releaseDate?: string | null;
  sku?: string;
  softwarePublisher?: string | null;
  productImage?: { publicId?: string } | null;
};

/** Produits de la page « Coming soon » de Nintendo US (données `__NEXT_DATA__`), où qu'ils soient dans la page. */
function produits(donnees: unknown): ProduitEtatsUnis[] {
  const trouves: ProduitEtatsUnis[] = [];
  const parcourir = (o: unknown) => {
    if (Array.isArray(o)) return o.forEach(parcourir);
    if (!o || typeof o !== "object") return;
    const p = o as Record<string, unknown>;
    if (
      typeof p.name === "string" &&
      "releaseDate" in p &&
      "softwarePublisher" in p
    )
      trouves.push(p as ProduitEtatsUnis);
    Object.values(p).forEach(parcourir);
  };
  parcourir(donnees);
  return trouves;
}

/**
 * Page « Coming soon » de Nintendo US : jeux édités par Nintendo, Switch et Switch 2. Un produit sans nsuid est vendu
 * en boîte au My Nintendo Store : sa photo est la boîte américaine.
 */
export function lireEtatsUnis(donnees: unknown, aujourdhui: string): Annonce[] {
  const annonces: Annonce[] = [];
  for (const p of produits(donnees)) {
    if (!/^Nintendo$|^The Pok[eé]mon Company/.test(p.softwarePublisher ?? ""))
      continue;
    const plateforme =
      typeof p.platform === "string" ? p.platform : (p.platform?.label ?? "");
    const console_: ConsoleAnnonce | null =
      plateforme === "Nintendo Switch 2"
        ? "switch-2"
        : plateforme === "Nintendo Switch"
          ? "switch"
          : null;
    if (!console_) continue;
    const titre = sansMarques(p.name ?? "");
    if (!titre || HORS_JEU.test(titre)) continue;
    const { date, precision } = dateEtatsUnis(p.releaseDate);
    if (!annonceAVenir(date, precision, aujourdhui)) continue;
    const boite = !p.nsuid;
    const id = p.productImage?.publicId;
    annonces.push({
      region: "US",
      console: console_,
      titre,
      date,
      precision,
      image:
        boite && id
          ? `https://assets.nintendo.com/image/upload/f_png/q_auto/${encodeURI(id)}`
          : null,
      physique: boite ? true : null,
      idSource: p.nsuid ?? p.sku ?? "",
    });
  }
  return sansDoublon(annonces);
}
