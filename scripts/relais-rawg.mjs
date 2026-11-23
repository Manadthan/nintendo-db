// Relais RAWG (étape 28, SPEC US-26, DESIGN ADR-18 point 5, 22/11/2026) : cherche chaque jeu du catalogue chez RAWG
// (plateforme de sa console, titres US, PAL, romanisé puis japonais ; rapprochement de src/lib/captures/rawg.ts) et
// dépose le résultat, par console, dans le bucket PRIVÉ « gametdb » : rawg/{console}.json
//   [{ slug, titre, rawg: { id, slug, nom } | null, captures: [{ position, url, largeur, hauteur }] }]
// Le catalogue ne change pas : la session Claude montre une planche, puis écrit après l'accord du propriétaire
// (scripts/captures-rawg.mjs).
// Lancé par la tâche GitHub « Relais RAWG » : la clé passe dans l'adresse (?key=), la session ne peut pas l'y mettre.
//   RAWG_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY ; RELAIS_CONSOLES (ex. « nes,snes », vide : toutes) ;
//   RELAIS_TOUS (« oui » : aussi les jeux qui ont déjà un slug RAWG).
// Aucune adresse d'API n'est jamais écrite dans le journal (elle porte la clé).
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { choisirCaptures, plateformeRawg, rapprocher } from "../src/lib/captures/rawg.ts";

const env = process.env;
const manquants = ["RAWG_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((n) => !env[n]);
if (manquants.length) throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const voulues = (env.RELAIS_CONSOLES ?? "").split(",").map((c) => c.trim()).filter(Boolean);
const tous = env.RELAIS_TOUS === "oui";

let appels = 0;
/** Appel à RAWG, 3 essais (429 ou 5xx : attente croissante) ; l'erreur ne contient jamais l'adresse. */
async function rawg(chemin, params = {}) {
  const url = new URL(`https://api.rawg.io/api${chemin}`);
  url.search = new URLSearchParams({ ...params, key: env.RAWG_API_KEY }).toString();
  for (let essai = 1; ; essai++) {
    await pause(250);
    appels++;
    const reponse = await fetch(url).catch(() => null);
    if (reponse?.ok) return reponse.json();
    const statut = reponse?.status ?? "réseau";
    if (reponse?.status === 401) throw new Error("Clé RAWG refusée (401)");
    if (essai === 3) throw new Error(`RAWG : HTTP ${statut} sur ${chemin}`);
    await pause(5000 * essai);
  }
}

// 1. Catalogue.
let jeux = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select("slug, rawg_slug, consoles!inner(slug), releases(region, sortie, titre, titre_romanise)")
    .order("slug")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  jeux = jeux.concat(data);
  if (data.length < 1000) break;
}
const parConsole = {};
for (const j of jeux) (parConsole[j.consoles.slug] ??= []).push(j);

// 2. Recherche par console, dépôt d'un fichier par console.
const bilan = [];
for (const [console_, liste] of Object.entries(parConsole).sort()) {
  const plateforme = plateformeRawg(console_);
  if (!plateforme || (voulues.length && !voulues.includes(console_))) continue;
  const resultat = [];
  let trouves = 0;
  let erreurs = 0;
  for (const jeu of liste) {
    if (jeu.rawg_slug && !tous) continue;
    const par = Object.fromEntries(jeu.releases.map((r) => [r.region, r]));
    const titres = [...new Set([par.US?.titre, par.PAL?.titre, par.JAP?.titre_romanise, par.JAP?.titre].filter(Boolean))];
    const ligne = { slug: jeu.slug, titre: titres[0] ?? jeu.slug, rawg: null, captures: [] };
    resultat.push(ligne);
    try {
      for (const titre of titres) {
        const r = await rawg("/games", { search: titre, platforms: String(plateforme), page_size: "10" });
        const trouve = rapprocher(titres, r.results ?? [], plateforme);
        if (trouve) {
          ligne.rawg = { id: trouve.id, slug: trouve.slug, nom: trouve.name };
          break;
        }
      }
      if (ligne.rawg) {
        const s = await rawg(`/games/${ligne.rawg.id}/screenshots`, { page_size: "40" });
        ligne.captures = choisirCaptures(s.results ?? []);
        trouves++;
      }
    } catch (e) {
      if (String(e.message).includes("401")) throw e;
      ligne.erreur = e.message;
      erreurs++;
    }
  }
  const corps = JSON.stringify(resultat, null, 1);
  const { error } = await supabase.storage
    .from("gametdb")
    .upload(`rawg/${console_}.json`, corps, { contentType: "application/json", upsert: true });
  if (error) throw new Error(`Dépôt rawg/${console_}.json : ${error.message}`);
  const avecCaptures = resultat.filter((l) => l.captures.length).length;
  bilan.push({ console_, jeux: resultat.length, trouves, avecCaptures, erreurs });
  console.log(`${console_} : ${trouves} / ${resultat.length} trouvés, ${avecCaptures} avec captures, ${erreurs} erreur(s) — base déposée`);
}

// 3. Résumé.
const texte = [
  `## Relais RAWG (${new Date().toISOString().slice(0, 10)})`,
  `${appels} appels. Fichiers déposés dans gametdb/rawg/.`,
  "",
  "| Console | Jeux cherchés | Trouvés | Avec captures | Erreurs |",
  "|---|---|---|---|---|",
  ...bilan.map((b) => `| ${b.console_} | ${b.jeux} | ${b.trouves} | ${b.avecCaptures} | ${b.erreurs} |`),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
