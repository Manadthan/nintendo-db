// Étude ScreenScraper (étape 26, DESIGN §11, 22/11/2026) : pour chaque version sortie SANS jaquette, cherche le jeu
// chez ScreenScraper et regarde s'il a une boîte de face (« box-2D ») de la bonne région. LECTURE SEULE : rien n'est
// écrit dans la base ni téléchargé. Décision du propriétaire : jaquettes d'abord, dates et éditeurs ensuite.
// Lancé par la tâche GitHub « Étude ScreenScraper » (la session Claude reçoit 403 de screenscraper.fr) :
//   SCREENSCRAPER_DEVID, SCREENSCRAPER_DEVPASSWORD, SCREENSCRAPER_USER, SCREENSCRAPER_PASSWORD,
//   SUPABASE_URL, SUPABASE_SECRET_KEY ; ETUDE_LIMITE (nombre de jeux au plus, 300 par défaut).
// Une requête toutes les 1,5 s (un seul fil). Les identifiants ne sont jamais écrits : ni les adresses appelées, ni
// les adresses des images (ScreenScraper y recopie les identifiants) ne vont dans le journal ou le rapport.
import { appendFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const requis = ["SCREENSCRAPER_DEVID", "SCREENSCRAPER_DEVPASSWORD", "SCREENSCRAPER_USER", "SCREENSCRAPER_PASSWORD", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const manquants = requis.filter((n) => !env[n]);
if (manquants.length) throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const LIMITE = Number(env.ETUDE_LIMITE ?? 300);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Nos consoles → identifiant du système chez ScreenScraper (Switch 2 : absent). */
const SYSTEMES = { nes: 3, snes: 4, n64: 14, gamecube: 13, wii: 16, "wii-u": 18, switch: 225, gb: 9, gbc: 10, gba: 12, vb: 11, ds: 15, "3ds": 17 };
/** Région des médias ScreenScraper → notre région. « wor » (monde) est compté à part. */
const REGIONS = { JAP: ["jp"], US: ["us"], PAL: ["eu", "uk", "fr", "de", "sp", "it", "au", "nl", "se", "dk", "fi", "pt"] };

let appels = 0;
class Arret extends Error {}
async function api(fichier, params) {
  const url = new URL(`https://api.screenscraper.fr/api2/${fichier}`);
  url.search = new URLSearchParams({
    devid: env.SCREENSCRAPER_DEVID,
    devpassword: env.SCREENSCRAPER_DEVPASSWORD,
    softname: "nintendo-db",
    ssid: env.SCREENSCRAPER_USER,
    sspassword: env.SCREENSCRAPER_PASSWORD,
    output: "json",
    ...params,
  }).toString();
  for (let essai = 1; ; essai++) {
    await pause(1500);
    appels++;
    const reponse = await fetch(url);
    const texte = await reponse.text();
    if (reponse.status === 429 && essai < 3) continue; // trop de fils : on attend et on réessaie
    if (reponse.status === 404) return null; // jeu introuvable
    if (!reponse.ok) {
      const message = `${fichier} : HTTP ${reponse.status} ${texte.slice(0, 120).replace(/\s+/g, " ")}`;
      // 401/403 identifiants, 423 API fermée, 426 logiciel refusé, 430/431 quota du jour : inutile d'insister.
      if ([401, 403, 423, 426, 430, 431].includes(reponse.status)) throw new Arret(message);
      throw new Error(message);
    }
    try {
      return JSON.parse(texte).response;
    } catch {
      throw new Error(`${fichier} : réponse illisible (${texte.slice(0, 80).replace(/\s+/g, " ")})`);
    }
  }
}

const simple = (t) => (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// 1. Le compte : quota du jour (seuls ces champs sont lus, le reste n'est pas affiché).
const compte = (await api("ssuserInfos.php", {}))?.ssuser ?? {};
const quota = {
  niveau: compte.niveau,
  fils: compte.maxthreads,
  requetesParJour: compte.maxrequestsperday,
  requetesAujourdhui: compte.requeststoday,
  echecsParJour: compte.maxrequestskoperday,
};
console.log("Compte ScreenScraper :", JSON.stringify(quota));

// 2. Les versions sorties sans jaquette, groupées par jeu.
let lignes = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select("slug, consoles!inner(slug), releases(region, sortie, titre, titre_romanise, jaquette_path)")
    .order("slug")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  lignes = lignes.concat(data);
  if (data.length < 1000) break;
}
const jeux = lignes
  .map((j) => ({ ...j, manquantes: j.releases.filter((r) => r.sortie && !r.jaquette_path).map((r) => r.region).sort() }))
  .filter((j) => j.manquantes.length)
  .slice(0, LIMITE);
console.log(`${jeux.length} jeux avec au moins une version sans jaquette`);

// 3. Recherche de chaque jeu et des boîtes disponibles.
const details = [];
const parConsole = {};
const vide = () => ({ versions: 0, exacte: 0, mondeSeule: 0, autreRegion: 0, sansBoite: 0, nonTrouve: 0, erreur: 0 });
let arret = null;
for (const jeu of jeux) {
  const console_ = jeu.consoles.slug;
  const compteur = (parConsole[console_] ??= vide());
  const par = Object.fromEntries(jeu.releases.map((r) => [r.region, r]));
  const titres = [par.US?.titre, par.PAL?.titre, par.JAP?.titre_romanise, par.JAP?.titre].filter(Boolean);
  const ligne = { console: console_, slug: jeu.slug, titre: titres[0], manquantes: jeu.manquantes, trouve: null, approche: false, boites: [], verdict: {} };
  details.push(ligne);
  const noter = (cle) => {
    for (const r of jeu.manquantes) {
      compteur.versions++;
      compteur[cle]++;
      ligne.verdict[r] = cle;
    }
  };
  if (!SYSTEMES[console_] || !titres.length || arret) {
    if (!arret) noter("nonTrouve");
    continue;
  }
  try {
    const reponse = await api("jeuRecherche.php", { systemeid: String(SYSTEMES[console_]), recherche: titres[0] });
    const candidats = (reponse?.jeux ?? []).filter((g) => g?.id && Number(g.systeme?.id) === SYSTEMES[console_]);
    const nos = new Set(titres.map(simple));
    const exact = candidats.find((g) => (g.noms ?? []).some((n) => nos.has(simple(n.text))));
    const choisi = exact ?? candidats[0];
    if (!choisi) {
      noter("nonTrouve");
      continue;
    }
    ligne.trouve = { id: choisi.id, nom: (choisi.noms ?? [])[0]?.text ?? null };
    ligne.approche = !exact;
    const boites = (choisi.medias ?? []).filter((m) => m.type === "box-2D").map((m) => m.region);
    ligne.boites = [...new Set(boites)].sort();
    for (const r of jeu.manquantes) {
      compteur.versions++;
      const cle = REGIONS[r].some((x) => boites.includes(x)) ? "exacte" : boites.includes("wor") ? "mondeSeule" : boites.length ? "autreRegion" : "sansBoite";
      compteur[cle]++;
      ligne.verdict[r] = cle;
    }
  } catch (e) {
    ligne.erreur = e.message;
    console.log(`${jeu.slug} : ${e.message}`);
    if (e instanceof Arret) arret = e.message;
    for (const r of jeu.manquantes) {
      compteur.versions++;
      compteur.erreur++;
      ligne.verdict[r] = "erreur";
    }
  }
}

// 4. Rapport : résumé de la tâche + détail en pièce jointe (sans aucune adresse).
const total = Object.values(parConsole).reduce((t, c) => {
  for (const [k, v] of Object.entries(c)) t[k] += v;
  return t;
}, vide());
writeFileSync("etude-screenscraper.json", JSON.stringify({ quota, appels, arret, total, parConsole, details }, null, 1));
const colonnes = Object.keys(vide());
const texte = [
  `## Étude ScreenScraper (${new Date().toISOString().slice(0, 10)})`,
  `Compte : ${quota.requetesAujourdhui ?? "?"} requêtes aujourd'hui sur ${quota.requetesParJour ?? "?"} ; ${quota.fils ?? "?"} fil(s). ${appels} appels pendant l'étude.`,
  arret ? `**Arrêt anticipé** : ${arret}` : "",
  `${details.filter((d) => d.approche).length} jeux rapprochés sans titre identique (à vérifier dans le détail).`,
  "",
  `| Console | ${colonnes.join(" | ")} |`,
  `|---|${colonnes.map(() => "---").join("|")}|`,
  ...Object.entries({ ...parConsole, TOTAL: total }).map(([k, c]) => `| ${k} | ${colonnes.map((x) => c[x]).join(" | ")} |`),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
if (arret) process.exitCode = 1;
