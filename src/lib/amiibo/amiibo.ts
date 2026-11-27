// Amiibo (étape 30, SPEC US-29 à US-31, DESIGN ADR-21 points 3 et 4) : lecture des sources, fusion, slugs et
// rattachement des jeux compatibles au catalogue. Module pur, sans import : lu aussi par scripts/amiibo.mjs (Node,
// sans alias « @/ »). Sources (étude §1 octodecies, §1 novodecies) :
// - AmiiboAPI (dépôt GitHub N3evin/AmiiboAPI, MIT) : base de 932 amiibo, dates JP / NA / EU, jeux compatibles ;
// - Nintendo US (données de la page des amiibo) : amiibo de 2026, photos des figurines et des boîtes ;
// - Nintendo Europe (Solr, type:FIGURE) : dates PAL ; amiibo absents ailleurs (Resident Evil…) ;
// - Nintendo Japon (search.nintendo.jp, hard = 9_amiibo) : nom japonais et date JAP des amiibo récents.

export type TypeAmiibo = "figurine" | "carte" | "peluche" | "bracelet" | "bloc";
export type RegionAmiibo = "JAP" | "US" | "PAL";
export type Precision = "jour" | "mois" | "annee";
export type SortieAmiibo = {
  region: RegionAmiibo;
  date: string;
  precision: Precision;
};
export type JeuCompatible = {
  titre: string;
  console: string;
  usage: string | null;
};
export type Origine = "amiiboapi" | "nintendo-us" | "nintendo-eu";

export type Amiibo = {
  identifiant: string;
  nom: string;
  nomJap: string | null;
  type: TypeAmiibo;
  serieAmiibo: string;
  serieJeux: string | null;
  personnage: string | null;
  editeur: string;
  sorties: SortieAmiibo[];
  jeux: JeuCompatible[];
  image: string | null;
  boite: string | null;
  /** Code de la figurine chez Nintendo (Europe « BCAB », Japon « bcab ») : relie les deux sources. */
  code: string | null;
  origine: Origine;
};

// --- AmiiboAPI -------------------------------------------------------------------------------------------------

type Dict = Record<string, string>;
export type AmiiboApi = {
  amiibos: Record<
    string,
    {
      name: string;
      release: Partial<Record<"jp" | "na" | "eu" | "au", string | null>>;
    }
  >;
  amiibo_series: Dict;
  game_series: Dict;
  types: Dict;
  characters: Dict;
};
type UsageApi = { Usage: string; write?: boolean };
type JeuApi = { gameName: string; amiiboUsage?: UsageApi[] };
export type JeuxApi = {
  amiibos: Record<
    string,
    Partial<Record<"gamesSwitch" | "gamesWiiU" | "games3DS", JeuApi[]>>
  >;
};

const TYPES: Record<string, TypeAmiibo> = {
  "00": "figurine",
  "01": "carte",
  "02": "peluche",
  "03": "bracelet",
  "04": "bloc",
};
const CONSOLES_API = {
  gamesSwitch: "Switch",
  gamesWiiU: "Wii U",
  games3DS: "3DS",
} as const;

/** Type lu dans l'identifiant AmiiboAPI (7e et 8e chiffres hexadécimaux), ou null s'il est inconnu. */
export function typeDepuisIdentifiant(identifiant: string): TypeAmiibo | null {
  const hex = identifiant.replace(/^0x/, "").toLowerCase();
  return /^[0-9a-f]{16}$/.test(hex) ? (TYPES[hex.slice(6, 8)] ?? null) : null;
}

/** Séries amiibo d'autres éditeurs (liste fixe, ADR-21 point 3) ; tout le reste est « Nintendo ». */
const EDITEURS: [RegExp, string][] = [
  [
    /street fighter|mega ?man|monster hunter|resident evil|biohazard/i,
    "Capcom",
  ],
  [/yu-?gi-?oh|power pros/i, "Konami"],
  [/shovel knight/i, "Yacht Club Games"],
  [/skylanders/i, "Activision"],
  [/diablo/i, "Blizzard"],
  [/dark souls/i, "FromSoftware"],
];

export function editeurDeSerie(serie: string): string {
  return EDITEURS.find(([motif]) => motif.test(serie))?.[1] ?? "Nintendo";
}

/** Date AAAA-MM-JJ d'une source, ou null. */
function dateValide(texte: string | null | undefined): string | null {
  const d = (texte ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

/** Adresse de l'image AmiiboAPI d'un amiibo (dossier images/ du dépôt). */
export function imageAmiiboApi(identifiant: string): string {
  const hex = identifiant.replace(/^0x/, "").toLowerCase();
  return `https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/images/icon_${hex.slice(0, 8)}-${hex.slice(8)}.png`;
}

/** Amiibo d'AmiiboAPI : type, séries, dates JAP / US / PAL (date AU ignorée), jeux compatibles. */
export function lireAmiiboApi(base: AmiiboApi, jeux: JeuxApi): Amiibo[] {
  const resultat: Amiibo[] = [];
  for (const [cle, a] of Object.entries(base.amiibos)) {
    const hex = cle.replace(/^0x/, "").toLowerCase();
    const type = typeDepuisIdentifiant(hex);
    if (!type) continue;
    const serieAmiibo = base.amiibo_series[`0x${hex.slice(12, 14)}`] ?? "";
    const sorties: SortieAmiibo[] = [];
    for (const [source, region] of [
      ["jp", "JAP"],
      ["na", "US"],
      ["eu", "PAL"],
    ] as const) {
      const date = dateValide(a.release[source]);
      if (date) sorties.push({ region, date, precision: "jour" });
    }
    const compatibles: JeuCompatible[] = [];
    for (const [groupe, console] of Object.entries(CONSOLES_API)) {
      for (const j of jeux.amiibos[cle]?.[
        groupe as keyof typeof CONSOLES_API
      ] ?? []) {
        const usages = (j.amiiboUsage ?? [])
          .map((u) => u.Usage.trim())
          .filter(Boolean);
        compatibles.push({
          titre: j.gameName.trim(),
          console,
          usage: usages.join(" ; ") || null,
        });
      }
    }
    resultat.push({
      identifiant: hex,
      nom: a.name.trim(),
      nomJap: null,
      type,
      serieAmiibo,
      serieJeux: base.game_series[`0x${hex.slice(0, 3)}`] ?? null,
      personnage: base.characters[`0x${hex.slice(0, 4)}`] ?? null,
      editeur: editeurDeSerie(serieAmiibo),
      sorties,
      jeux: compatibles,
      image: imageAmiiboApi(hex),
      boite: null,
      code: null,
      origine: "amiiboapi",
    });
  }
  return resultat;
}

// --- Noms comparables et slugs -----------------------------------------------------------------------------------

/** Minuscules, sans accents, « ™ », ni ponctuation ; « & » lu « and ». */
export function simplifier(texte: string): string {
  return texte
    .replace(/[™®©]/g, "") // avant NFKD, qui changerait « ™ » en « TM »
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Nom comparable entre sources : sans la série ajoutée par Nintendo US (« Sylux - Metroid Prime 4: Beyond Series »). */
export function nomComparable(nom: string): string {
  return simplifier(nom.replace(/\s+-\s+[^-]*\bseries\s*$/i, ""));
}

const tiret = (t: string) => simplifier(t).replace(/ /g, "-");

/**
 * Slug unique de chaque amiibo : le nom ; en cas de doublon, la série ; puis la fin de l'identifiant ; si elle ne
 * départage pas (Palamute 2021 et 2022 finissent tous deux par « 1802 »), l'année de sortie ; en dernier recours,
 * tout l'identifiant.
 */
export function attribuerSlugs(amiibo: readonly Amiibo[]): Map<string, string> {
  const doublons = (cles: string[]) => {
    const vus = new Map<string, number>();
    for (const c of cles) vus.set(c, (vus.get(c) ?? 0) + 1);
    return (c: string) => (vus.get(c) ?? 0) > 1;
  };
  const brut = (a: Amiibo) =>
    a.identifiant.replace(/^[a-z]+:/, "").replace(/[^a-z0-9]/g, "");
  const annee = (a: Amiibo) =>
    a.sorties.map((s) => s.date.slice(0, 4)).sort()[0] ?? "";
  const etapes: ((a: Amiibo, base: string) => string)[] = [
    (a, base) => `${base}-${tiret(a.serieAmiibo)}`.replace(/-$/, ""),
    (a, base) => `${base}-${brut(a).slice(-4)}`,
    (a, base) =>
      `${base.replace(/-[a-z0-9]{4}$/, "")}-${annee(a)}`.replace(/-$/, ""),
    (a, base) => `${base}-${brut(a)}`,
  ];
  let slugs = amiibo.map((a) => tiret(a.nom));
  for (const etape of etapes) {
    const enDouble = doublons(slugs);
    slugs = slugs.map((slug, i) =>
      enDouble(slug) ? etape(amiibo[i]!, slug) : slug,
    );
  }
  return new Map(
    amiibo.map((a, i) => [a.identifiant, slugs[i]!.slice(0, 140)]),
  );
}

// --- Nintendo US -------------------------------------------------------------------------------------------------

export type AmiiboUs = {
  name: string;
  releaseDate: string | null;
  releaseDateDisplay?: string | null;
  figureAsset?: { publicId: string } | null;
  boxartAsset?: { publicId: string } | null;
  slug: string;
  series?: string | null;
};

/** Adresse d'une image Nintendo US (Cloudinary, PNG 1 200 px pour garder 600 px nets après recadrage). */
export function imageNintendoUs(publicId: string): string {
  return `https://assets.nintendo.com/image/upload/f_png,w_1200/${publicId.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Coffrets et produits génériques, pas un amiibo : cartes vendues par série (« Animal Crossing amiibo cards series 1 »,
 * « Card Starter Set »), packs, « Power-Up Band » seul, ou nom égal à la série (« Mario Sports Superstars »).
 */
export function estCoffretDeCartes(nom: string, serie = ""): boolean {
  if (/\bnew leaf\b/i.test(nom)) return true; // « Animal Crossing: New Leaf » (cartes « Welcome amiibo »)
  if (/\bcards?\b|\bpack\b|\bstarter set\b|^power-?up band$/i.test(nom.trim()))
    return true;
  return serie.trim() !== "" && nomComparable(nom) === nomComparable(serie);
}

const MOTS_VIDES = new Set([
  "the",
  "and",
  "outfit",
  "series",
  "amiibo",
  "figure",
]);
/** Mots d'un nom ; lettres isolées réunies (« R.O.B. » → « rob », « K. K. Slider » → « kk slider »). */
const mots = (nom: string) =>
  simplifier(nom.replace(/\s+-\s+[^-]*\bseries\s*$/i, ""))
    .replace(/\bcolou?rs?\b/g, "color")
    .replace(/\b([a-z0-9])\b(?: ([a-z0-9])\b)+/g, (m) => m.replace(/ /g, ""))
    .split(" ")
    .filter((m) => m && !MOTS_VIDES.has(m))
    .map((m) => (m.length > 4 && m.endsWith("s") ? m.slice(0, -1) : m)); // « Lumas » = « Luma »
const cleMots = (nom: string) => [...mots(nom)].sort().join(" ");
const compact = (nom: string) => mots(nom).join("");
const JOUR = 86_400_000;
const ecartJours = (a: string, b: string) =>
  Math.abs(Date.parse(a) - Date.parse(b)) / JOUR;

/**
 * Quand l'un des deux est récent (2025 et après) : faux si aucune de leurs dates n'est à moins de 4 mois (un an si
 * l'une n'est connue qu'à l'année). « Diana » de 2026 n'est pas la carte « Diana » de 2015 ; « Young Link » de 2027
 * n'est pas celui de 2019. Entre amiibo anciens, Nintendo US donne parfois la date d'une réédition : pas de contrôle.
 */
function datesCompatibles(a: Amiibo, sortie: SortieAmiibo | null): boolean {
  if (!sortie || a.sorties.length === 0) return true;
  if (sortie.date < "2025" && a.sorties.every((s) => s.date < "2025"))
    return true;
  return a.sorties.some(
    (s) =>
      ecartJours(s.date, sortie.date) <=
      (s.precision === "jour" && sortie.precision === "jour" ? 120 : 366),
  );
}

/**
 * Amiibo déjà connus qui sont le même que « nom » (au nom identique, une carte compte ; sinon jamais une carte ; deux sorties à plus de 4 mois d'écart ne sont pas le même amiibo). Dans l'ordre : même nom ; mêmes mots,
 * même dans un autre ordre (« Cat Mario » = « Mario - Cat », « Mario (Classic Colours) » = « Mario - Classic Color »,
 * « Mii Sword Fighter » = « Mii Swordfighter ») ; sinon, parmi les amiibo sortis à 3 jours près, celui qui partage
 * le plus de mots, s'il est seul en tête. Rien sinon : ce sera un nouvel amiibo, en rouge sur la planche.
 */
export function trouverPareils(
  liste: readonly Amiibo[],
  nom: string,
  sortie: SortieAmiibo | null,
  serie = "",
): Amiibo[] {
  const plausibles = liste.filter((a) => datesCompatibles(a, sortie));
  const exact = plausibles.filter(
    (a) => nomComparable(a.nom) === nomComparable(nom),
  );
  if (exact.length > 0) return exact; // une carte au nom identique compte (« Shadow Mewtwo »)
  const figures = plausibles.filter((a) => a.type !== "carte");
  for (const egal of [
    (a: Amiibo) => cleMots(a.nom) === cleMots(nom),
    (a: Amiibo) => compact(a.nom) === compact(nom),
  ]) {
    const trouves = figures.filter(egal);
    if (trouves.length > 0) return trouves;
  }
  if (!sortie || sortie.precision !== "jour") return [];
  // Une parenthèse qui répète la série ne compte pas : « Big Man (Splatoon Raiders) » n'est pas
  // « Shiver (Splatoon Raiders) ».
  const parenthese = /\(([^()]*)\)\s*$/.exec(nom)?.[1] ?? "";
  const deSerie = new Set(
    parenthese && serie && nomComparable(parenthese) === nomComparable(serie)
      ? mots(parenthese)
      : [],
  );
  const voulus = new Set(mots(nom).filter((m) => !deSerie.has(m)));
  const scores = figures
    .filter((a) =>
      a.sorties.some(
        (s) => s.precision === "jour" && ecartJours(s.date, sortie.date) <= 3,
      ),
    )
    .map((a) => ({ a, n: mots(a.nom).filter((m) => voulus.has(m)).length }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n);
  return scores.length > 0 &&
    (scores.length === 1 || scores[0]!.n > scores[1]!.n)
    ? [scores[0]!.a]
    : [];
}

/** Date US et sa précision : « 2027 » affiché ⇒ année seule (Nintendo US met alors le 31/12). */
function sortieUs(a: AmiiboUs): SortieAmiibo | null {
  const date = dateValide(a.releaseDate);
  if (!date) return null;
  const annee = /^\d{4}$/.test((a.releaseDateDisplay ?? "").trim());
  return { region: "US", date, precision: annee ? "annee" : "jour" };
}

/**
 * Complète la liste avec Nintendo US : boîte et photo des amiibo déjà connus (même nom), nouveaux amiibo pour ceux
 * qu'AmiiboAPI n'a pas (2026). Les coffrets de cartes sont ignorés.
 */
export function completerAvecUs(
  amiibo: readonly Amiibo[],
  us: readonly AmiiboUs[],
): Amiibo[] {
  const resultat = amiibo.map((a) => ({ ...a, sorties: [...a.sorties] }));
  for (const u of us) {
    if (estCoffretDeCartes(u.name, u.series ?? "")) continue;
    const memes = trouverPareils(
      resultat,
      u.name,
      sortieUs(u),
      u.series ?? "",
    ).filter((a) => a.type !== "carte");
    const boite = u.boxartAsset?.publicId
      ? imageNintendoUs(u.boxartAsset.publicId)
      : null;
    if (memes.length > 0) {
      // Plusieurs figurines du même nom (Link…) : la boîte n'est donnée que si une seule correspond.
      if (memes.length === 1 && boite) memes[0]!.boite = boite;
      continue;
    }
    const sortie = sortieUs(u);
    const serie = (u.series ?? "").trim();
    const nouvel: Amiibo = {
      identifiant: `us:${u.slug}`.slice(0, 123),
      nom: u.name
        .replace(/\s+-\s+[^-]*\bseries\s*$/i, "")
        .replace(/™/g, "")
        .trim(),
      nomJap: null,
      type: "figurine",
      serieAmiibo: serie,
      serieJeux: null,
      personnage: null,
      editeur: editeurDeSerie(serie),
      sorties: sortie ? [sortie] : [],
      jeux: [],
      image: u.figureAsset?.publicId
        ? imageNintendoUs(u.figureAsset.publicId)
        : null,
      boite,
      code: null,
      origine: "nintendo-us",
    };
    resultat.push(nouvel);
  }
  return resultat;
}

// --- Nintendo Europe ---------------------------------------------------------------------------------------------

export type FigureEurope = {
  fs_id: string;
  title: string;
  date_from?: string | null;
  pretty_date_s?: string | null;
  game_series_txt?: string[] | null;
  figure_number_s?: string | null;
  figure_image_url_s?: string | null;
};

/** Date PAL et sa précision : « 2026 » affiché ⇒ année seule (Nintendo Europe met alors le 31/12). */
function sortieEurope(f: FigureEurope): SortieAmiibo | null {
  const date = dateValide(f.date_from);
  if (!date) return null;
  const annee = /^\d{4}$/.test((f.pretty_date_s ?? "").trim());
  return { region: "PAL", date, precision: annee ? "annee" : "jour" };
}

/** Code de la figurine en minuscules (« BCAB » → « bcab »), ou null. */
function codeFigure(f: FigureEurope): string | null {
  const code = (f.figure_number_s ?? "").trim().toLowerCase();
  return /^[a-z0-9]{3,8}$/.test(code) ? code : null;
}

/** Complète avec Nintendo Europe : date PAL si elle manque, nouvel amiibo s'il n'est nulle part ailleurs. */
export function completerAvecEurope(
  amiibo: readonly Amiibo[],
  figures: readonly FigureEurope[],
): Amiibo[] {
  const resultat = amiibo.map((a) => ({ ...a, sorties: [...a.sorties] }));
  for (const f of figures) {
    if (estCoffretDeCartes(f.title)) continue;
    const sortie = sortieEurope(f);
    const memes = trouverPareils(
      resultat,
      f.title,
      sortie,
      (f.game_series_txt ?? [])[0] ?? "",
    );
    if (memes.length > 0) {
      for (const a of memes) {
        if (sortie && !a.sorties.some((s) => s.region === "PAL"))
          a.sorties.push(sortie);
        a.code ??= codeFigure(f);
      }
      continue;
    }
    const serie = (f.game_series_txt ?? [])[0]?.trim() ?? "";
    resultat.push({
      identifiant: `eu:${tiret(f.title)}`.slice(0, 123),
      nom: f.title.trim(),
      nomJap: null,
      type: "figurine",
      serieAmiibo: serie,
      serieJeux: null,
      personnage: null,
      editeur: editeurDeSerie(`${serie} ${f.title}`),
      sorties: sortie ? [sortie] : [],
      jeux: [],
      image: f.figure_image_url_s ?? null,
      boite: null,
      code: codeFigure(f),
      origine: "nintendo-eu",
    });
  }
  return resultat;
}

// --- Nintendo Japon ----------------------------------------------------------------------------------------------

export type AmiiboJapon = {
  title: string;
  icode?: string | null;
  dsdate?: string | null;
  series?: string | null;
  maker?: string | null;
};

/** Éditeurs japonais d'amiibo (champ « maker ») ; 任天堂 = Nintendo. */
const EDITEURS_JAPON: Record<string, string> = {
  任天堂: "Nintendo",
  カプコン: "Capcom",
  コナミ: "Konami",
  "フロム・ソフトウェア": "FromSoftware",
};

/** Clé de série japonaise : dernier segment de « am_kirbyairriders_カービィのエアライダーシリーズ_kirbyairriders ». */
function cleSerieJapon(serie: string | null | undefined): string {
  return (
    (serie ?? "")
      .split("_")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") ?? ""
  );
}

function appliquerJapon(a: Amiibo, j: AmiiboJapon): void {
  a.nomJap ??= j.title.trim();
  const date = dateValide(j.dsdate);
  if (date && !a.sorties.some((s) => s.region === "JAP"))
    a.sorties.push({ region: "JAP", date, precision: "jour" });
  const editeur = EDITEURS_JAPON[(j.maker ?? "").trim()];
  if (a.origine !== "amiiboapi" && editeur && a.editeur === "Nintendo")
    a.editeur = editeur;
}

/**
 * Nom japonais, date JAP et éditeur : d'abord par le code de la figurine (Europe « BCAB » = Japon « bcab ») ; sinon,
 * pour un amiibo sans date JAP, par la même série et le même jour qu'une sortie US ou PAL, seulement si ce
 * rapprochement est unique dans les deux sens (deux amiibo Kirby Air Riders du même jour restent sans date JAP).
 */
export function completerAvecJapon(
  amiibo: readonly Amiibo[],
  japon: readonly AmiiboJapon[],
): Amiibo[] {
  const resultat = amiibo.map((a) => ({ ...a, sorties: [...a.sorties] }));
  const parCode = new Map(
    resultat.filter((a) => a.code).map((a) => [a.code!.toLowerCase(), a]),
  );
  const restants: AmiiboJapon[] = [];
  for (const j of japon) {
    const a = parCode.get((j.icode ?? "").toLowerCase());
    if (a) appliquerJapon(a, j);
    else restants.push(j);
  }
  const sansJap = resultat.filter(
    (a) => !a.sorties.some((s) => s.region === "JAP"),
  );
  const correspond = (a: Amiibo, j: AmiiboJapon) => {
    const cle = cleSerieJapon(j.series);
    const date = dateValide(j.dsdate);
    const serieA = simplifier(`${a.serieAmiibo} ${a.serieJeux ?? ""}`).replace(
      / /g,
      "",
    );
    return Boolean(
      cle &&
      date &&
      serieA.includes(cle) &&
      a.sorties.some((s) => s.precision === "jour" && s.date === date),
    );
  };
  for (const j of restants) {
    const candidats = sansJap.filter((a) => correspond(a, j));
    if (candidats.length !== 1) continue;
    const a = candidats[0]!;
    if (restants.filter((autre) => correspond(a, autre)).length === 1)
      appliquerJapon(a, j);
  }
  return resultat;
}

// --- Jeux compatibles --------------------------------------------------------------------------------------------

export type JeuCatalogue = {
  id: string;
  console: string;
  titres: readonly string[];
};
export type JeuRattache = JeuCompatible & { gameId: string | null };

/** Nos consoles pour une console d'AmiiboAPI (« Switch » : la Switch 2 lit aussi les jeux Switch). */
const CONSOLES_CATALOGUE: Record<string, string[]> = {
  Switch: ["switch", "switch-2"],
  "Wii U": ["wii-u"],
  "3DS": ["3ds"],
};

const titreComparable = (t: string) => simplifier(t).replace(/^the /, "");

/** Jeu du catalogue au titre identique (accents, « ™ », « The » en tête ignorés) et sur la bonne console, sinon rien. */
export function rattacherJeux(
  jeux: readonly JeuCompatible[],
  catalogue: readonly JeuCatalogue[],
): JeuRattache[] {
  return jeux.map((j) => {
    const consoles = CONSOLES_CATALOGUE[j.console] ?? [];
    const voulu = titreComparable(j.titre);
    const trouve = catalogue.find(
      (c) =>
        consoles.includes(c.console) &&
        c.titres.some((t) => titreComparable(t) === voulu),
    );
    return { ...j, gameId: trouve?.id ?? null };
  });
}
