// Éditeur officiel quand GameTDB n'en donne pas (étape 22, SPEC v1.33, DESIGN ADR-13) : bases de Nintendo Europe
// (searching.nintendo-europe.com) et de Nintendo Japon (search.nintendo.jp), lues par le relais. Utilisé par
// scripts/relais-gametdb.mjs (Node, sans alias « @/ ») : imports relatifs ou de paquets seulement.

/** Jeu de la base de Nintendo Europe (champs lus). */
export type DocEurope = {
  title?: string;
  publisher?: string | null;
  product_code_txt?: string[] | null;
};

/** Jeu de la base de Nintendo Japon (champs lus). */
export type ItemJapon = {
  icode: string | null;
  hard: string;
  maker: string | null;
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

/** Bases de code éditées par Nintendo (identifiant sans la lettre de région : « ANVY » pour ANVYA), par source. */
export type BasesNintendo = { europe: Set<string>; japon: Set<string> };

/** Bases des jeux que Nintendo Europe (publisher) ou Nintendo Japon (maker) disent édités par Nintendo. */
export function basesNintendo(
  console_: ConsoleOfficielle,
  europe: DocEurope[],
  japon: ItemJapon[],
): BasesNintendo {
  const c = CONSOLES[console_];
  const bases: BasesNintendo = { europe: new Set(), japon: new Set() };
  for (const d of europe) {
    if (!NINTENDO_EUROPE.test(d.publisher ?? "")) continue;
    for (const code of d.product_code_txt ?? []) {
      // « HACPANVYA » : console (3), type (1), identifiant.
      if (c.prefixes.includes(code.slice(0, 3)) && code.length > 4)
        bases.europe.add(code.slice(4, 4 + c.base));
    }
  }
  for (const i of japon) {
    if (i.hard === c.japon && i.icode && NINTENDO_JAPON.test(i.maker ?? ""))
      bases.japon.add(i.icode.slice(0, c.base));
  }
  return bases;
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
    const parties = region.split(",").map((r) => r.trim());
    const japon = parties.some((r) => ["ALL", "JPN", "NTSC-J"].includes(r));
    const ouest = parties.some((r) =>
      ["ALL", "USA", "EUR", "NTSC-U", "PAL"].includes(r),
    );
    return (
      (japon && bases.japon.has(base)) || (ouest && bases.europe.has(base))
    );
  };
}
