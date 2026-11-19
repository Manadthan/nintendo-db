// Fabrique la fixture des notes Metacritic (étape 13, US-17) : pour chaque article Wikipédia, seulement l'encadré du
// jeu (« Infobox video game ») et celui des critiques (« Video game reviews »), là où l'import lit la note.
// Usage : node scripts/fixture-metacritic.mjs <réponse API.json> > src/lib/import/__fixtures__/metacritic-wikipedia.json
// Réponse : https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&formatversion=2&titles=…
import { readFileSync } from "node:fs";

/** Bloc `{{Nom …}}` complet (accolades équilibrées), ou "". */
function bloc(texte, nom) {
  const debut = texte.search(new RegExp(`\\{\\{\\s*${nom}`, "i"));
  if (debut < 0) return "";
  let profondeur = 0;
  for (let i = debut; i < texte.length - 1; i++) {
    if (texte[i] === "{" && texte[i + 1] === "{") { profondeur++; i++; }
    else if (texte[i] === "}" && texte[i + 1] === "}") { profondeur--; i++; if (profondeur === 0) return texte.slice(debut, i + 1); }
  }
  return "";
}

const reponse = JSON.parse(readFileSync(process.argv[2], "utf8"));
const articles = Object.fromEntries(
  reponse.query.pages.map((p) => {
    const w = p.revisions?.[0]?.slots?.main?.content ?? "";
    return [p.title, `${bloc(w, "Infobox video game")}\n${bloc(w, "Video game reviews")}`];
  }),
);
process.stdout.write(JSON.stringify({ redirections: reponse.query.redirects ?? [], articles }, null, 1) + "\n");
