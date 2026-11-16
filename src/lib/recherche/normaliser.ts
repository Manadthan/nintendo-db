/**
 * Texte comparable pour la recherche (US-05, DESIGN ADR-05) : « Pokémon » et « pokemon » deviennent identiques.
 *
 * 1. NFKC : caractères pleine largeur ramenés à leur forme simple (« Ｗｉｉ » → « Wii »).
 * 2. Accents latins retirés (U+0300 à U+036F) puis recomposition NFC : les signes sonores japonais
 *    (ゼ, パ…) sont d'autres plages et restent intacts, sinon « ゼ » trouverait « セ ».
 * 3. Minuscules ; apostrophes collées (« Yoshi's » → « yoshis ») ; autre ponctuation → espace.
 */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
