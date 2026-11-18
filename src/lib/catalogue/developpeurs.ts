/**
 * Studios d'un jeu (filtre « Développeur », US-06, #89). Les sources écrivent un même studio de plusieurs façons
 * (« LEVEL-5 », « Level 5 », « Game Freak, Inc. ») : le nom est nettoyé **à l'affichage**, sans réimport (BILAN,
 * leçon 8). Les divisions de Nintendo restent distinctes ; « Nintendo (first party) » les regroupe.
 */

/** Entrée du filtre qui regroupe tous les studios internes de Nintendo (choix du propriétaire, 18/11/2026). */
export const NINTENDO_FIRST_PARTY = "Nintendo (first party)";

/** Mentions juridiques retirées des noms (« Inc. », « Co., Ltd. », « Corporation »…). */
const MENTIONS =
  /(?:,?\s+|^)(?:co\.?,?\s*ltd\.?|co\.,?|inc\.?|ltd\.?|llc|corporation|corp\.?)(?=$|[\s,&/])/gi;

/**
 * Clé d'un studio : minuscules, sans accents, espaces ni ponctuation. « Platinum Games », « PlatinumGames » et
 * « PLATINUMGAMES » ont la même clé : c'est elle qui sert à comparer et à filtrer.
 */
export const cleStudio = (nom: string) =>
  nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

/** Noms retenus pour les variantes que la clé ne suffit pas à rapprocher (« Nd Cube » et « NDcube » : même clé). */
const ALIAS: Record<string, string> = {
  level5: "Level-5",
  ndcube: "NDcube",
  squareenix: "Square Enix",
  alphadream: "AlphaDream",
  hal: "HAL Laboratory",
  monolithsoft: "Monolith Soft",
  hallaboratory: "HAL Laboratory",
  sora: "Sora",
  projectsora: "Sora",
  koeitecmo: "Koei Tecmo",
  koeitecmogames: "Koei Tecmo",
  tecmokoei: "Koei Tecmo",
  tecmokoeigames: "Koei Tecmo",
  nst: "Nintendo Software Technology",
  nintendosoftwaretechnology: "Nintendo Software Technology",
  nintendosoftwaretechnologynst: "Nintendo Software Technology",
  ubisoftparis: "Ubisoft Paris",
  mercurystream: "MercurySteam",
  mercurysteam: "MercurySteam",
  monolithsoftware: "Monolith Soft",
  namcobandai: "Bandai Namco",
  camelot: "Camelot Software Planning",
  gamefreak: "Game Freak",
  intelligentsystems: "Intelligent Systems",
  goodfeel: "Good-Feel",
  headstronggames: "Headstrong Games",
  arika: "Arika",
  chunsoft: "Chunsoft",
  agenda: "Agenda",
  vanpool: "Vanpool",
  grezzo: "Grezzo",
  arzest: "Arzest",
  bandainamcostudios: "Bandai Namco Studios",
  platinumgames: "PlatinumGames",
  tsmusic: "T's Music",
  noisemarigul: "Noise",
  fromsoftware: "FromSoftware",
};

/**
 * Studios internes de Nintendo et filiales détenues à 100 % (« first party ») : les divisions (EAD, EPD, SPD…) et
 * Retro Studios, Monolith Soft, NST, NDcube, 1-Up Studio, Next Level Games, Nintendo Cube. HAL Laboratory,
 * Intelligent Systems ou Game Freak, indépendants, n'en font pas partie.
 */
const FIRST_PARTY = new Set([
  "Retro Studios",
  "Monolith Soft",
  "Nintendo Software Technology",
  "NDcube",
  "1-Up Studio",
  "Next Level Games",
]);

export const estFirstParty = (studio: string) =>
  /^Nintendo(\s|$)/.test(studio) || FIRST_PARTY.has(studio);

/** Nom nettoyé d'un studio : mentions juridiques retirées, variante connue → nom retenu. */
export function nomStudio(brut: string): string {
  const nom = brut.replace(MENTIONS, "").replace(/\s+/g, " ").trim();
  return ALIAS[cleStudio(nom)] ?? nom;
}

/**
 * Studios d'un champ « développeur » (« Nintendo EAD Tokyo, 1-Up Studio », « Level-5 & Capcom »,
 * « Game Freak, Inc. ») : séparés, nettoyés, sans doublon.
 */
export function studios(developpeur: string | null): string[] {
  if (!developpeur) return [];
  const sansMentions = developpeur.replace(MENTIONS, "");
  return [
    ...new Set(
      sansMentions
        .split(/\s*(?:,|&|\/|\band\b)\s*/i)
        .map(nomStudio)
        .filter((s) => s.length > 1),
    ),
  ];
}

/**
 * Studios proposés dans le filtre, sans doublon de clé : pour chaque studio, la graphie la plus fréquente
 * (« Team Ninja » plutôt que « Team NINJA ») et le nombre de jeux ; triés du plus grand nombre de jeux au plus petit.
 */
export function regrouperStudios(
  parJeu: string[][],
): { nom: string; nombre: number }[] {
  const groupes = new Map<string, Map<string, number>>();
  for (const liste of parJeu)
    for (const nom of new Set(liste)) {
      const graphies = groupes.get(cleStudio(nom)) ?? new Map<string, number>();
      graphies.set(nom, (graphies.get(nom) ?? 0) + 1);
      groupes.set(cleStudio(nom), graphies);
    }
  return [...groupes.values()]
    .map((graphies) => {
      const [nom] = [...graphies].sort((a, b) => b[1] - a[1])[0]!;
      const nombre = [...graphies.values()].reduce((s, n) => s + n, 0);
      return { nom, nombre };
    })
    .sort((a, b) => b.nombre - a.nombre || a.nom.localeCompare(b.nom, "fr"));
}
