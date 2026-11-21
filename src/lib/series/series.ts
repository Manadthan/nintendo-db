// Séries d'un jeu (étape 23, SPEC v1.37 US-06, DESIGN ADR-15) : liste de référence, règles sur le titre et noms
// Wikidata ramenés à ces noms. Lu aussi par scripts/series-wikidata.mjs (Node, sans alias « @/ ») : aucun import.

/** Une série de référence : nom affiché, motifs cherchés dans un titre simplifié, série parente. */
export type Serie = {
  nom: string;
  /** Motifs sur le titre simplifié (minuscules, sans accents ni ponctuation) ; aussi appliqués aux noms Wikidata. */
  motifs: RegExp[];
  parent?: string;
};

/** Motifs latins (mots entiers) ; un motif japonais est cherché tel quel, les mots n'étant pas séparés. */
const m = (...motifs: string[]) =>
  motifs.map((x) =>
    /[\u3040-\u30ff\u4e00-\u9fff]/.test(x)
      ? new RegExp(simplifier(x))
      : new RegExp(`(^| )${x}( |$)`),
  );

/** Liste de référence (noms français quand ils existent, sinon anglais). Une sous-série nomme sa parente. */
export const SERIES: readonly Serie[] = [
  { nom: "Mario", motifs: m("mario", "マリオ") },
  { nom: "Mario Kart", motifs: m("mario kart"), parent: "Mario" },
  { nom: "Mario Party", motifs: m("mario party"), parent: "Mario" },
  { nom: "Paper Mario", motifs: m("paper mario"), parent: "Mario" },
  { nom: "Mario & Luigi", motifs: m("mario luigi"), parent: "Mario" },
  { nom: "Mario Tennis", motifs: m("mario tennis"), parent: "Mario" },
  { nom: "Mario Golf", motifs: m("mario golf"), parent: "Mario" },
  { nom: "Mario Strikers", motifs: m("mario strikers", "super mario strikers"), parent: "Mario" },
  { nom: "Mario & Sonic aux Jeux olympiques", motifs: m("mario sonic"), parent: "Mario" },
  { nom: "Mario + Lapins Crétins", motifs: m("mario rabbids", "mario lapins cretins"), parent: "Mario" },
  { nom: "Super Mario Maker", motifs: m("mario maker"), parent: "Mario" },
  { nom: "Dr. Mario", motifs: m("dr mario"), parent: "Mario" },
  { nom: "Luigi's Mansion", motifs: m("luigis mansion"), parent: "Mario" },
  { nom: "Captain Toad", motifs: m("captain toad"), parent: "Mario" },
  { nom: "Yoshi", motifs: m("yoshi", "yoshis") },
  { nom: "Wario", motifs: m("wario", "warioware") },
  { nom: "WarioWare", motifs: m("warioware"), parent: "Wario" },
  { nom: "Donkey Kong", motifs: m("donkey kong", "diddy kong") },
  { nom: "Donkey Kong Country", motifs: m("donkey kong country"), parent: "Donkey Kong" },
  { nom: "Donkey Kong Land", motifs: m("donkey kong land"), parent: "Donkey Kong" },
  { nom: "The Legend of Zelda", motifs: m("zelda", "ゼルダ", "links crossbow training") },
  { nom: "Hyrule Warriors", motifs: m("hyrule warriors"), parent: "The Legend of Zelda" },
  { nom: "Metroid", motifs: m("metroid") },
  { nom: "Metroid Prime", motifs: m("metroid prime"), parent: "Metroid" },
  { nom: "Kirby", motifs: m("kirby", "カービィ") },
  { nom: "Pokémon", motifs: m("pokemon", "pokepark", "ポケモン", "ポケットモンスター", "pocket monsters") },
  { nom: "Pokémon Donjon Mystère", motifs: m("pokemon mystery dungeon", "pokemon donjon mystere"), parent: "Pokémon" },
  { nom: "Pokémon Ranger", motifs: m("pokemon ranger"), parent: "Pokémon" },
  { nom: "Pokémon Stadium", motifs: m("pokemon stadium"), parent: "Pokémon" },
  { nom: "PokéPark", motifs: m("pokepark"), parent: "Pokémon" },
  { nom: "Fire Emblem", motifs: m("fire emblem", "ファイアーエムブレム") },
  { nom: "Xenoblade Chronicles", motifs: m("xenoblade") },
  { nom: "Star Fox", motifs: m("star fox", "starfox", "lylat wars") },
  { nom: "F-Zero", motifs: m("f zero") },
  { nom: "Pikmin", motifs: m("pikmin") },
  { nom: "Animal Crossing", motifs: m("animal crossing", "doubutsu no mori", "どうぶつの森") },
  { nom: "Splatoon", motifs: m("splatoon") },
  { nom: "Super Smash Bros.", motifs: m("smash bros", "super smash brothers") },
  { nom: "Kid Icarus", motifs: m("kid icarus") },
  { nom: "Mother", motifs: m("earthbound", "mother [0-9]") },
  { nom: "Golden Sun", motifs: m("golden sun") },
  { nom: "Advance Wars", motifs: m("advance wars", "famicom wars", "game boy wars", "nintendo wars") },
  { nom: "1080°", motifs: m("1080 snowboarding", "1080 avalanche") },
  { nom: "Picross", motifs: m("picross") },
  { nom: "Programme d'entraînement cérébral", motifs: m("brain age", "brain training", "entrainement cerebral") },
  { nom: "Professeur Layton", motifs: m("layton") },
  { nom: "Wii Sports", motifs: m("wii sports") },
  { nom: "Wii Fit", motifs: m("wii fit") },
  { nom: "Wii Party", motifs: m("wii party") },
  { nom: "Nintendogs", motifs: m("nintendogs") },
  { nom: "Tomodachi", motifs: m("tomodachi") },
  { nom: "Rhythm Paradise", motifs: m("rhythm paradise", "rhythm heaven", "rhythm tengoku") },
  { nom: "Bayonetta", motifs: m("bayonetta") },
  { nom: "Custom Robo", motifs: m("custom robo") },
  { nom: "Excite", motifs: m("excitebike", "excite truck", "excitebots") },
  { nom: "Punch-Out!!", motifs: m("punch out") },
  { nom: "Pilotwings", motifs: m("pilotwings") },
  { nom: "Wave Race", motifs: m("wave race") },
  { nom: "Chibi-Robo", motifs: m("chibi robo") },
  { nom: "Fossil Fighters", motifs: m("fossil fighters", "kaseki horider") },
  { nom: "La Nouvelle Maison du Style", motifs: m("style savvy", "nouvelle maison du style", "style boutique") },
  { nom: "Starfy", motifs: m("starfy", "stafy") },
  { nom: "Kururin", motifs: m("kururin") },
  { nom: "Hamtaro", motifs: m("hamtaro", "hamutaro") },
  { nom: "NES Remix", motifs: m("nes remix") },
  { nom: "Puzzle League", motifs: m("puzzle league", "panel de pon") },
  { nom: "Band Brothers", motifs: m("band brothers", "daigasso") },
  { nom: "Sin and Punishment", motifs: m("sin and punishment", "sin punishment") },
  { nom: "Endless Ocean", motifs: m("endless ocean") },
  { nom: "Arms", motifs: [/^arms$/] },
  { nom: "Game & Watch", motifs: m("game watch") },
  { nom: "Mega Man", motifs: m("mega man", "megaman", "rockman") },
  { nom: "Dragon Quest", motifs: m("dragon quest", "dragon warrior") },
  { nom: "Tetris", motifs: m("tetris") },
  { nom: "Mario Baseball", motifs: m("mario superstar baseball", "mario super sluggers"), parent: "Mario" },
];

const PAR_NOM = new Map(SERIES.map((s) => [s.nom, s]));

/** Noms Wikidata qui ne sont pas des séries de jeux (une console, une gamme) : ignorés. */
const IGNORES = new Set(["wii", "nintendo", "nintendo switch", "game boy", "touch generations"]);

/** Titre simplifié : minuscules, sans accents, apostrophes collées, ponctuation remplacée par des espaces. */
export function simplifier(texte: string): string {
  return texte
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const trouve = (texte: string) => {
  const t = simplifier(texte);
  return SERIES.filter((s) => s.motifs.some((motif) => motif.test(t))).map((s) => s.nom);
};

/** Séries reconnues dans les titres d'un jeu (toutes régions). */
export function seriesDuTitre(titres: (string | null | undefined)[]): string[] {
  return completer(titres.flatMap((t) => (t ? trouve(t) : [])));
}

/**
 * Nom Wikidata → nom de référence : la série dont le nom ou un motif correspond ; une série hors liste garde son
 * libellé (`connue: false`, à signaler) ; null pour un nom ignoré ou un élément sans libellé (« Q12345 »).
 */
export function serieWikidata(libelle: string): { nom: string; connue: boolean } | null {
  const t = simplifier(libelle);
  if (!t || IGNORES.has(t) || /^q[0-9]+$/.test(t)) return null;
  const exacte = SERIES.find((s) => simplifier(s.nom) === t);
  if (exacte) return { nom: exacte.nom, connue: true };
  const parMotif = trouve(libelle);
  // Le motif le plus précis : une sous-série plutôt que sa parente (« Mario Kart » plutôt que « Mario »).
  const precise = parMotif.find((n) => PAR_NOM.get(n)?.parent) ?? parMotif[0];
  return precise ? { nom: precise, connue: true } : { nom: libelle.trim(), connue: false };
}

/** Ajoute les séries parentes, retire les doublons, trie par ordre alphabétique (français). */
export function completer(series: string[]): string[] {
  const toutes = new Set<string>();
  for (const s of series) {
    toutes.add(s);
    for (let p = PAR_NOM.get(s)?.parent; p; p = PAR_NOM.get(p)?.parent) toutes.add(p);
  }
  return [...toutes].sort((a, b) => a.localeCompare(b, "fr"));
}

/** Saisie « Mario, Dr. Mario » (administration) → liste nettoyée, sans doublons, triée. */
export function lireSeries(saisie: string): string[] {
  const noms = saisie.split(/[,\n]/).map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean);
  return [...new Set(noms)].sort((a, b) => a.localeCompare(b, "fr"));
}
