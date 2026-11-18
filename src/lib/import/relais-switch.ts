// Relais et import GameTDB de la Switch (étape 10, DESIGN v1.4 §1 quater). Utilisé par scripts/relais-gametdb.mjs
// (Node, sans alias « @/ ») et par l'import : imports relatifs ou de paquets seulement.
import * as cheerio from "cheerio";

/** Éditeur Nintendo, y compris en japonais (même règle que relais-portables.ts, non importé : Node lit ce fichier seul). */
const EDITEUR_NINTENDO = /nintendo|任天堂/i;

type RegionSite = "JAP" | "US" | "PAL";

/**
 * Régions du site couvertes par le champ `region` d'une cartouche. Switch : « ALL » = cartouche mondiale, vendue
 * dans les 3 régions ; listes « USA,EUR », « JPN,TWN »… ; Chine, Corée et Taïwan seuls ne sont pas suivis.
 * Les autres consoles : NTSC-J, NTSC-U, PAL.
 */
export function regionsGameTdb(champ: string): RegionSite[] {
  const regions = new Set<RegionSite>();
  for (const partie of champ.split(",").map((p) => p.trim())) {
    if (partie === "ALL")
      ["JAP", "US", "PAL"].forEach((r) => regions.add(r as RegionSite));
    if (partie === "JPN" || partie === "NTSC-J") regions.add("JAP");
    if (partie === "USA" || partie === "NTSC-U") regions.add("US");
    if (partie === "EUR" || partie === "PAL") regions.add("PAL");
  }
  return (["JAP", "US", "PAL"] as const).filter((r) => regions.has(r));
}

/**
 * Cartouche Switch du commerce : type `Switch` (pas `eShop`), identifiant de 4 caractères + une **lettre** (un
 * chiffre final marque une édition spéciale ou un pack américain : « Starter Pack », « Double Pack », « Dreamer
 * Edition »…), au moins une région suivie, ni démo, ni logiciel, ni outil.
 */
export function estCartoucheSwitchDuCommerce(
  type: string,
  id: string,
  region: string,
  titre: string,
  genre: string,
): boolean {
  if (type !== "Switch" || !/^[A-Z0-9]{4}[A-Z]$/.test(id)) return false;
  if (!regionsGameTdb(region).length) return false;
  if (
    genre
      .split(",")
      .some((g) =>
        ["demo", "software", "sampler"].includes(g.trim().toLowerCase()),
      )
  )
    return false;
  return !/\bdemo\b|download|kiosk|not for resale|install tool/i.test(titre);
}

/**
 * Rang d'une cartouche parmi celles d'un même jeu dans une région : la lettre finale la plus basse est la cartouche
 * d'origine (A, B, C…) ; G, H, K… sont des rééditions avec extension (« + Expansion Pass », « Bundle »).
 */
export const rangCartouche = (id: string): number =>
  id.length === 5 ? id.charCodeAt(4) : 0;

/**
 * Scans essayés pour chaque région, dans l'ordre (chemin `art.gametdb.com/switch/{…}/{id}.jpg`) : haute définition
 * 1166 × 1888, sinon scan moyen 352 × 570 (le seul qui existe le plus souvent pour le Japon). Jamais la boîte d'une
 * autre région.
 */
export const SCANS_SWITCH: Record<RegionSite, string[]> = {
  JAP: ["coverHQ/JA", "coverM/JA"],
  US: ["coverHQ/US", "coverM/US"],
  PAL: ["coverHQ/EN", "coverHQ/FR", "coverHQ/DE", "coverM/EN", "coverM/FR"],
};

/**
 * Base Switch réduite (25 Mo → quelques centaines de Ko) aux cartouches du commerce des jeux dont au moins une
 * cartouche est éditée par Nintendo ; et la liste des scans à déposer, une par cartouche et région couverte.
 */
export function reduireBaseSwitch(xml: string): {
  xml: string;
  disques: { id: string; region: RegionSite }[];
} {
  const $ = cheerio.load(xml, { xml: true });
  const parBase = new Map<
    string,
    { nintendo: boolean; disques: { id: string; region: string }[] }
  >();
  $("game").each((_, el) => {
    const jeu = $(el);
    const champ = (nom: string) => jeu.children(nom).first().text().trim();
    const id = champ("id");
    const titre = jeu.find("locale[lang=EN] > title").first().text().trim();
    if (
      !estCartoucheSwitchDuCommerce(
        champ("type"),
        id,
        champ("region"),
        titre,
        champ("genre"),
      )
    )
      return;
    const base = parBase.get(id.slice(0, 4)) ?? {
      nintendo: false,
      disques: [],
    };
    base.nintendo ||= EDITEUR_NINTENDO.test(champ("publisher"));
    base.disques.push({ id, region: champ("region") });
    parBase.set(id.slice(0, 4), base);
  });
  const gardes = [...parBase.values()]
    .filter((b) => b.nintendo)
    .flatMap((b) => b.disques);
  const ids = new Set(gardes.map((d) => d.id));
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
    if (!ids.delete(jeu.children("id").first().text().trim())) {
      jeu.remove();
      return;
    }
    jeu.children().each((_, c) => {
      if (c.type === "tag" && !champsGardes.has(c.tagName)) $(c).remove();
    });
    jeu.find("locale").children(":not(title)").remove();
  });
  $("datafile").children(":not(game, SwitchTDB, genres)").remove();
  $("genres loc:not([lang=FR])").remove();
  return {
    xml: $.xml().replace(/\n\s*\n/g, "\n"),
    disques: gardes.flatMap((d) =>
      regionsGameTdb(d.region).map((region) => ({ id: d.id, region })),
    ),
  };
}
