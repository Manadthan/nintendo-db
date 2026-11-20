// Éditeur officiel (étape 22, SPEC v1.33 et v1.35, DESIGN ADR-13 et ADR-14) : bases de Nintendo Europe
// (searching.nintendo-europe.com) et de Nintendo Japon (search.nintendo.jp), lues par le relais. Utilisé par
// scripts/relais-gametdb.mjs (Node, sans alias « @/ ») : imports relatifs ou de paquets seulement.

/** Jeu de la base de Nintendo Europe (champs lus). */
export type DocEurope = {
  title?: string;
  publisher?: string | null;
  product_code_txt?: string[] | null;
  /** Vendu en boîte (carte, cartouche) : « true », ou `system_type` « 3ds_cartridge… », « nintendoswitch_gamecard… ». */
  physical_version_b?: boolean | null;
  system_type?: string[] | null;
};

/** Jeu de la base de Nintendo Japon (champs lus). */
export type ItemJapon = {
  icode: string | null;
  hard: string;
  maker: string | null;
  /** Format : « CTR » (carte), « CTR_DOWNLOADABLE » (carte et téléchargement), « CTRWARE » (téléchargement seul). */
  sform?: string | null;
};

export type ConsoleOfficielle = "switch" | "3ds";

/** Préfixes des codes européens, filtre de la base japonaise et longueur de la base (identifiant sans sa région). */
const CONSOLES: Record<
  ConsoleOfficielle,
  { prefixes: string[]; japon: string; base: number }
> = {
  switch: { prefixes: ["HAC"], japon: "1_HAC", base: 4 },
  "3ds": { prefixes: ["CTR", "KTR"], japon: "2_CTR", base: 3 },
};

/** Filtres de la base japonaise à télécharger. */
export const FILTRES_JAPON = Object.values(CONSOLES).map((c) => c.japon);

const NINTENDO_EUROPE = /nintendo/i;
/** Au Japon, les jeux Pokémon sont édités par The Pokémon Company (« ポケモン »), distribués par Nintendo. */
const NINTENDO_JAPON = /任天堂|ポケモン/;

/** Formats japonais d'un jeu vendu en boîte (carte seule, ou carte et téléchargement). */
const BOITE_JAPON = /^(CTR|KTR|HAC)(_DOWNLOADABLE)?$/;
const enBoiteEurope = (d: DocEurope) =>
  d.physical_version_b === true ||
  (d.system_type ?? []).some((t) => /cartridge|gamecard/.test(t));

/**
 * Bases de code éditées par Nintendo (identifiant sans la lettre de région : « ANVY » pour ANVYA), par source ; et
 * celles qui y sont aussi vendues en boîte (`boiteEurope`, `boiteJapon`).
 */
export type BasesNintendo = {
  europe: Set<string>;
  japon: Set<string>;
  boiteEurope: Set<string>;
  boiteJapon: Set<string>;
};

/** Bases des jeux que Nintendo Europe (publisher) ou Nintendo Japon (maker) disent édités par Nintendo. */
export function basesNintendo(
  console_: ConsoleOfficielle,
  europe: DocEurope[],
  japon: ItemJapon[],
): BasesNintendo {
  const c = CONSOLES[console_];
  const bases: BasesNintendo = {
    europe: new Set(),
    japon: new Set(),
    boiteEurope: new Set(),
    boiteJapon: new Set(),
  };
  for (const d of europe) {
    if (!NINTENDO_EUROPE.test(d.publisher ?? "")) continue;
    for (const code of d.product_code_txt ?? []) {
      // « HACPANVYA » : console (3), type (1), identifiant.
      if (c.prefixes.includes(code.slice(0, 3)) && code.length > 4) {
        bases.europe.add(code.slice(4, 4 + c.base));
        if (enBoiteEurope(d)) bases.boiteEurope.add(code.slice(4, 4 + c.base));
      }
    }
  }
  for (const i of japon) {
    if (i.hard === c.japon && i.icode && NINTENDO_JAPON.test(i.maker ?? "")) {
      bases.japon.add(i.icode.slice(0, c.base));
      if (BOITE_JAPON.test(i.sform ?? ""))
        bases.boiteJapon.add(i.icode.slice(0, c.base));
    }
  }
  return bases;
}

/** Régions d'une carte GameTDB : japonaise, américaine, européenne (« ALL » : les trois). */
function regionsCarte(region: string) {
  const parties = region.split(",").map((r) => r.trim());
  const a = (...noms: string[]) => parties.some((r) => noms.includes(r));
  return {
    japon: a("ALL", "JPN", "NTSC-J"),
    us: a("ALL", "USA", "NTSC-U"),
    europe: a("ALL", "EUR", "PAL"),
  };
}

/** Ce que les bases officielles disent d'une carte GameTDB (base, région), pour le relais (ADR-13). */
export type Officiels = {
  /** Éditeur vide : édité par Nintendo (base japonaise pour une carte japonaise, européenne pour les autres). */
  edite: (base: string, region: string) => boolean;
  /**
   * Éditeur renseigné : Nintendo l'édite dans la région même de la carte (Nintendo Europe pour une carte européenne,
   * Nintendo Japon pour une japonaise) et l'emporte sur GameTDB (Dragon Quest Builders : « Square Enix »). Jamais pour
   * une carte seulement américaine : pas de base officielle américaine.
   */
  editeIci: (base: string, region: string) => boolean;
  /**
   * Carte 3DS classée « 3DSWare » (téléchargement) mais vendue en boîte par Nintendo (Fire Emblem Fates, Ever Oasis) :
   * base de sa région ; une carte américaine suit l'Europe ou le Japon (choix du propriétaire, 20/11/2026).
   */
  enBoite: (base: string, region: string) => boolean;
};

/** Sans bases officielles (échec de leur téléchargement) : rien ne change. */
export const AUCUN_OFFICIEL: Officiels = {
  edite: () => false,
  editeIci: () => false,
  enBoite: () => false,
};

export function officiels(bases: BasesNintendo): Officiels {
  return {
    edite: editeOfficiellement(bases),
    editeIci: (base, region) => {
      const r = regionsCarte(region);
      return (
        (r.japon && bases.japon.has(base)) ||
        (r.europe && bases.europe.has(base))
      );
    },
    enBoite: (base, region) => {
      const r = regionsCarte(region);
      const europe = bases.boiteEurope.has(base);
      const japon = bases.boiteJapon.has(base);
      return (
        (r.japon && japon) ||
        (r.europe && europe) ||
        (r.us && (europe || japon))
      );
    },
  };
}

/**
 * Une carte GameTDB sans éditeur est-elle éditée par Nintendo ? La base japonaise vaut pour une carte japonaise, la
 * base européenne pour une carte américaine ou européenne (Shovel Knight : Nintendo au Japon, Yacht Club ailleurs) ;
 * une cartouche Switch « ALL » suit l'une ou l'autre.
 */
export function editeOfficiellement(
  bases: BasesNintendo,
): (base: string, region: string) => boolean {
  return (base, region) => {
    const r = regionsCarte(region);
    return (
      (r.japon && bases.japon.has(base)) ||
      ((r.us || r.europe) && bases.europe.has(base))
    );
  };
}
