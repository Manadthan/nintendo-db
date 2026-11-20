// Relais et import GameTDB des portables DS et 3DS (étape 9, DESIGN v1.3 §1 ter). Utilisé par
// scripts/relais-gametdb.mjs (Node, sans alias « @/ ») et par l'import : imports relatifs ou de paquets seulement.
import * as cheerio from "cheerio";

export type Portable = "ds" | "3ds";

/** Éditeur Nintendo, y compris écrit en japonais (« 任天堂 » : 94 cartes DS, 124 cartes 3DS). */
export const EDITEUR_NINTENDO = /nintendo|任天堂/i;

/** Régions GameTDB suivies. */
const REGIONS_SUIVIES = new Set(["NTSC-J", "NTSC-U", "PAL"]);

const REGLES: Record<
  Portable,
  { types: Set<string>; garde: (id: string) => boolean }
> = {
  // DS : toutes les initiales. Les identifiants en Y ne sont pas tous des démos (Kirby Super Star Ultra YKWE,
  // Professeur Layton YLTP… : SPEC v1.33) ; les démos et bornes sont écartées par leur titre et leur genre.
  ds: { types: new Set(["DS", "DSi"]), garde: () => true },
  // 3DS : U = jeux Super Nintendo (New 3DS), J = eShop, V = boîtes de codes, H = logiciel.
  "3ds": {
    types: new Set(["3DS", "New3DS"]),
    garde: (id) => /^[ABCE]/.test(id),
  },
};

/** Régions d'une carte d'après la 4ᵉ lettre de son identifiant (O = internationale : États-Unis et Europe). */
const REGION_PAR_LETTRE: Record<string, string> = {
  J: "NTSC-J",
  E: "NTSC-U",
  O: "NTSC-U,PAL",
  P: "PAL",
  D: "PAL",
  F: "PAL",
  S: "PAL",
  I: "PAL",
  H: "PAL",
  U: "PAL",
  X: "PAL",
  Y: "PAL",
  Z: "PAL",
  V: "PAL",
};

/**
 * Région d'une carte : le champ `region` de GameTDB, sinon (champ vide : Pokémon Noir IRBO) celle de la 4ᵉ lettre de
 * son identifiant (SPEC v1.33). Les cartes coréennes (K) restent hors des régions suivies.
 */
export const regionCarte = (id: string, region: string): string =>
  region || (REGION_PAR_LETTRE[id.charAt(3)] ?? "");

/** Genres et titres des cartes qui ne sont pas des jeux vendus en boîte. */
const GENRES_HORS_JEU = /\b(demo|software|sampler)\b/i;
const TITRES_HORS_JEU =
  /\(demo|download|kiosk|taikenban|not for resale|update ver/i;

/** Carte du commerce d'une portable : type, identifiant, région suivie, ni démo, ni logiciel. */
export function estCarteDuCommerce(
  portable: Portable,
  type: string,
  id: string,
  region: string,
  titre: string,
  genre: string,
): boolean {
  const regle = REGLES[portable];
  return (
    regle.types.has(type) &&
    /^[A-Z0-9]{4}$/.test(id) &&
    regle.garde(id) &&
    region.split(",").every((r) => REGIONS_SUIVIES.has(r)) &&
    !GENRES_HORS_JEU.test(genre) &&
    !TITRES_HORS_JEU.test(titre)
  );
}

/** Langue du scan d'une carte, d'après la 4ᵉ lettre de son identifiant (P = Europe anglaise, D = Allemagne…). */
const LANGUE_PAR_LETTRE: Record<string, string> = {
  J: "JA",
  E: "US",
  D: "DE",
  F: "FR",
  S: "ES",
  I: "IT",
  H: "NL",
};

/** Langues de scan à essayer, dans l'ordre : celle de la carte, puis l'anglais, l'américain et le japonais. */
export function languesScan(id: string): string[] {
  const premiere = LANGUE_PAR_LETTRE[id.charAt(3)] ?? "EN";
  return [...new Set([premiere, "EN", "US", "JA"])];
}

/**
 * Rang d'une carte européenne pour choisir son titre (DESIGN §1 ter) : la carte anglaise (P), puis les cartes
 * multilingues (U, X, Y, Z…), puis celles d'un seul pays (D, F, S, I, H), dont le titre « anglais » est souvent
 * celui du pays (« Professor Layton und… »).
 */
export function rangCartePal(id: string): number {
  const lettre = id.charAt(3);
  if (lettre === "P") return 0;
  return lettre in LANGUE_PAR_LETTRE ? 2 : 1;
}

export type CarteRelais = { id: string; region: string };

/**
 * Base réduite d'une portable : cartes du commerce des jeux dont au moins une carte est éditée par Nintendo (champ
 * `publisher`, l'identifiant n'a pas de code d'éditeur), champs lus par l'import, genres en français.
 */
export function reduireBasePortable(
  portable: Portable,
  xml: string,
  /** Carte sans éditeur éditée par Nintendo selon Nintendo Europe ou Japon (ADR-13) : base, région → oui / non. */
  editeOfficiellement: (base: string, region: string) => boolean = () => false,
): { xml: string; disques: CarteRelais[] } {
  const $ = cheerio.load(xml, { xml: true });
  const parBase = new Map<
    string,
    { nintendo: boolean; disques: CarteRelais[] }
  >();
  $("game").each((_, el) => {
    const jeu = $(el);
    const champ = (nom: string) => jeu.children(nom).first().text().trim();
    const id = champ("id");
    const region = regionCarte(id, champ("region"));
    const titre = jeu.find("locale[lang=EN] > title").first().text().trim();
    if (
      !estCarteDuCommerce(
        portable,
        champ("type"),
        id,
        region,
        titre,
        champ("genre"),
      )
    )
      return;
    const base = parBase.get(id.slice(0, 3)) ?? {
      nintendo: false,
      disques: [],
    };
    base.nintendo ||=
      EDITEUR_NINTENDO.test(champ("publisher")) ||
      (!champ("publisher") && editeOfficiellement(id.slice(0, 3), region));
    base.disques.push({ id, region });
    parBase.set(id.slice(0, 3), base);
  });
  const gardes = [...parBase.values()].filter((b) => b.nintendo);
  const ids = new Set(gardes.flatMap((b) => b.disques.map((d) => d.id)));
  const champsGardes = new Set([
    "id",
    "type",
    "region",
    "locale",
    "developer",
    "publisher",
    "date",
    "genre",
  ]);
  $("game").each((_, el) => {
    const jeu = $(el);
    const id = jeu.children("id").first().text().trim();
    // Une même carte peut apparaître deux fois : seule la première, retenue, est gardée.
    if (!ids.delete(id)) {
      jeu.remove();
      return;
    }
    jeu.children().each((_, c) => {
      if (c.type === "tag" && !champsGardes.has(c.tagName)) $(c).remove();
    });
    // Région déduite de l'identifiant quand GameTDB n'en donne pas : l'import lit ce champ.
    const region = jeu.children("region").first();
    if (!region.text().trim()) region.text(regionCarte(id, ""));
    // Éditeur vide complété par la liste officielle (ADR-13) : l'import lit ce champ ; un éditeur renseigné reste.
    const editeur = jeu.children("publisher").first();
    if (
      !editeur.text().trim() &&
      editeOfficiellement(id.slice(0, 3), region.text().trim())
    ) {
      if (editeur.length) editeur.text("Nintendo");
      else jeu.append("<publisher>Nintendo</publisher>");
    }
    jeu.find("locale").children(":not(title)").remove();
  });
  $("datafile").children(":not(game, DSTDB, TDB3DS, genres)").remove();
  $("genres loc:not([lang=FR])").remove();
  return {
    xml: $.xml().replace(/\n\s*\n/g, "\n"),
    disques: gardes.flatMap((b) => b.disques),
  };
}
