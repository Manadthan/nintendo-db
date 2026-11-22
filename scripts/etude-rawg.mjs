// Étude RAWG (étape 28, DESIGN ADR-18, 22/11/2026) : RAWG reconnaît-il nos jeux, et combien de captures donne-t-il ?
// LECTURE SEULE : rien n'est écrit dans la base. Échantillon : par console, le jeu le mieux noté puis d'autres
// choisis par le slug (ordre stable, comme l'étude eBay). Pour chaque jeu : recherche RAWG filtrée sur la plateforme
// de la console, par titre US, puis PAL, puis romanisé ; rapprochement « exact » (titre normalisé identique et
// console présente), « approché » (premier résultat d'un autre titre : jamais accepté par l'import) ou « absent » ;
// nombre de captures (/games/{id}/screenshots) ; version réduite media.rawg.io/media/resize/640/-/… vérifiée.
// Lancé par la tâche GitHub « Étude RAWG » : RAWG_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY ; ETUDE_PAR_CONSOLE.
// La clé passe dans l'adresse (?key=) : aucune adresse d'API n'est jamais écrite dans le journal ni le rapport.
import { appendFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const manquants = ["RAWG_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((n) => !env[n]);
if (manquants.length) throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const PAR_CONSOLE = Number(env.ETUDE_PAR_CONSOLE ?? 4);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Notre console → noms possibles de la plateforme chez RAWG (lus dans /platforms, normalisés). */
const PLATEFORMES = {
  nes: ["nes", "nintendo entertainment system"],
  snes: ["snes", "super nintendo", "super nintendo entertainment system"],
  n64: ["nintendo 64"],
  gamecube: ["gamecube", "nintendo gamecube"],
  wii: ["wii", "nintendo wii"],
  "wii-u": ["wii u", "nintendo wii u"],
  switch: ["nintendo switch"],
  "switch-2": ["nintendo switch 2", "switch 2"],
  gb: ["game boy"],
  gbc: ["game boy color"],
  gba: ["game boy advance"],
  vb: ["virtual boy"],
  ds: ["nintendo ds"],
  "3ds": ["nintendo 3ds"],
};

const simple = (t) =>
  (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

let appels = 0;
/** Appel à l'API RAWG ; l'erreur ne contient jamais l'adresse (elle porte la clé). */
async function rawg(chemin, params = {}) {
  const url = new URL(`https://api.rawg.io/api${chemin}`);
  url.search = new URLSearchParams({ ...params, key: env.RAWG_API_KEY }).toString();
  await pause(250);
  appels++;
  const reponse = await fetch(url);
  if (!reponse.ok) return { erreur: `HTTP ${reponse.status} sur ${chemin}` };
  return reponse.json();
}

// 1. Plateformes RAWG : identifiant de chaque console.
const plateformes = [];
for (let page = 1; page <= 3; page++) {
  const r = await rawg("/platforms", { page_size: "50", page: String(page) });
  if (r.erreur) throw new Error(`Clé RAWG refusée ou API indisponible (${r.erreur})`);
  plateformes.push(...r.results);
  if (!r.next) break;
}
const idPlateforme = {};
for (const [console_, noms] of Object.entries(PLATEFORMES)) {
  const p = plateformes.find((x) => noms.includes(simple(x.name)));
  idPlateforme[console_] = p ? { id: p.id, nom: p.name, jeux: p.games_count } : null;
}
console.log("Plateformes :", JSON.stringify(idPlateforme));

// 2. Échantillon.
let lignes = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select("slug, metacritic_note, consoles!inner(slug), releases(region, sortie, titre, titre_romanise)")
    .order("slug")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  lignes = lignes.concat(data);
  if (data.length < 1000) break;
}
const parConsole = {};
for (const j of lignes) (parConsole[j.consoles.slug] ??= []).push(j);
const echantillon = [];
for (const [console_, jeux] of Object.entries(parConsole)) {
  const note = [...jeux].sort((a, b) => (b.metacritic_note ?? -1) - (a.metacritic_note ?? -1))[0];
  const inverse = (s) => s.split("").reverse().join("");
  const autres = jeux.filter((j) => j !== note).sort((a, b) => inverse(a.slug).localeCompare(inverse(b.slug)));
  for (const j of [note, ...autres].slice(0, PAR_CONSOLE)) echantillon.push({ console: console_, jeu: j });
}
console.log(`${echantillon.length} jeux dans l'échantillon`);

// 3. Recherche, rapprochement, captures.
const details = [];
const brutes = []; // quelques réponses brutes, pour écrire les fixtures des tests (sans clé)
let resizeVerifie = null;
for (const { console: slugConsole, jeu } of echantillon) {
  const par = Object.fromEntries(jeu.releases.map((r) => [r.region, r]));
  const titres = [...new Set([par.US?.titre, par.PAL?.titre, par.JAP?.titre_romanise, par.JAP?.titre].filter(Boolean))];
  const ligne = { console: slugConsole, slug: jeu.slug, titres, mode: "absent" };
  details.push(ligne);
  const plateforme = idPlateforme[slugConsole];
  if (!plateforme) {
    ligne.mode = "sans plateforme";
    continue;
  }
  let approche = null;
  for (const titre of titres) {
    const r = await rawg("/games", { search: titre, platforms: String(plateforme.id), page_size: "5" });
    if (r.erreur) {
      ligne.erreur = r.erreur;
      break;
    }
    if (brutes.length < 4) brutes.push({ recherche: titre, plateforme: plateforme.id, reponse: r });
    const resultats = r.results ?? [];
    const exact = resultats.find((g) => simple(g.name) === simple(titre));
    if (exact) {
      Object.assign(ligne, { mode: "exact", titre, rawg: { id: exact.id, slug: exact.slug, nom: exact.name } });
      break;
    }
    if (!approche && resultats[0]) approche = { titre, rawg: { id: resultats[0].id, slug: resultats[0].slug, nom: resultats[0].name } };
  }
  if (ligne.mode === "absent" && approche) Object.assign(ligne, { mode: "approché", ...approche });
  if (!ligne.rawg) continue;
  const s = await rawg(`/games/${ligne.rawg.id}/screenshots`, { page_size: "40" });
  if (s.erreur) {
    ligne.erreur = s.erreur;
    continue;
  }
  const captures = (s.results ?? []).filter((c) => !c.is_deleted && !c.hidden);
  ligne.captures = captures.length;
  ligne.exemples = captures.slice(0, 2).map((c) => ({ image: c.image, largeur: c.width, hauteur: c.height }));
  if (brutes.length < 6) brutes.push({ captures: ligne.rawg.slug, reponse: s });
  // Version réduite (non documentée) : vérifiée une fois sur une vraie capture.
  if (resizeVerifie === null && captures[0]?.image?.includes("/media/")) {
    const reduite = captures[0].image.replace("/media/", "/media/resize/640/-/");
    const r = await fetch(reduite);
    const octets = (await r.arrayBuffer()).byteLength;
    const grande = await fetch(captures[0].image);
    const octetsGrande = (await grande.arrayBuffer()).byteLength;
    resizeVerifie = { reduite, statut: r.status, type: r.headers.get("content-type"), octets, octetsGrande };
  }
}

// 4. Rapport.
const parConsoleResume = {};
for (const d of details) {
  const c = (parConsoleResume[d.console] ??= { jeux: 0, exact: 0, approché: 0, absent: 0, "sans plateforme": 0, avec6: 0, aucune: 0 });
  c.jeux++;
  c[d.mode]++;
  if (d.mode === "exact" && d.captures >= 6) c.avec6++;
  if (d.mode === "exact" && !d.captures) c.aucune++;
}
writeFileSync("etude-rawg.json", JSON.stringify({ appels, idPlateforme, resizeVerifie, parConsole: parConsoleResume, details, brutes }, null, 1));
const colonnes = ["jeux", "exact", "approché", "absent", "sans plateforme", "avec6", "aucune"];
const texte = [
  `## Étude RAWG (${new Date().toISOString().slice(0, 10)})`,
  `${echantillon.length} jeux, ${appels} appels. Version réduite : ${resizeVerifie ? `HTTP ${resizeVerifie.statut}, ${resizeVerifie.type}, ${resizeVerifie.octets} octets (grande : ${resizeVerifie.octetsGrande})` : "non vérifiée"}.`,
  "",
  "Plateformes : " + Object.entries(idPlateforme).map(([c, p]) => `${c} = ${p ? `${p.nom} (${p.id}, ${p.jeux} jeux)` : "**absente**"}`).join(" ; "),
  "",
  `| Console | ${colonnes.join(" | ")} |`,
  `|---|${colonnes.map(() => "---").join("|")}|`,
  ...Object.entries(parConsoleResume).map(([k, c]) => `| ${k} | ${colonnes.map((x) => c[x]).join(" | ")} |`),
  "",
  "| Jeu | Mode | Titre cherché | Jeu RAWG | Captures |",
  "|---|---|---|---|---|",
  ...details.map((d) => `| ${d.console}/${d.slug} | ${d.erreur ?? d.mode} | ${d.titre ?? d.titres[0] ?? "—"} | ${d.rawg ? `${d.rawg.nom} (${d.rawg.slug})` : "—"} | ${d.captures ?? "—"} |`),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
