// Étude eBay (étape 25, DESIGN §11, 22/11/2026) : peut-on estimer le prix d'un jeu par version (JAP / US / PAL) ?
// LECTURE SEULE : rien n'est écrit dans la base. Mesure, sur un échantillon du catalogue (2 jeux par console : le
// mieux noté et un autre choisi par le slug), les annonces EN COURS (API Browse, ouverte par défaut) et vérifie si
// l'accès aux ventes TERMINÉES (Marketplace Insights, accès sur demande) est ouvert pour nos clés.
// Lancé par la tâche GitHub « Étude eBay » : EBAY_CLIENT_ID, EBAY_CLIENT_SECRET (clés de production),
// SUPABASE_URL, SUPABASE_SECRET_KEY ; ETUDE_PAR_CONSOLE (jeux par console, 2 par défaut).
// Les clés et les jetons ne sont jamais écrits ; le rapport ne garde que des titres d'annonces et des prix.
import { appendFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const requis = ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const manquants = requis.filter((n) => !env[n]);
if (manquants.length) throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const PAR_CONSOLE = Number(env.ETUDE_PAR_CONSOLE ?? 2);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const API = "https://api.ebay.com";
const CATEGORIE_JEUX = "139973"; // « Video Games » (jeux seuls, sans consoles ni accessoires)

/** Nom de la console tel qu'on le tape dans eBay. */
const NOMS = {
  nes: "NES", snes: "Super Nintendo", n64: "Nintendo 64", gamecube: "GameCube", wii: "Wii", "wii-u": "Wii U",
  switch: "Switch", "switch-2": "Switch 2", gb: "Game Boy", gbc: "Game Boy Color", gba: "Game Boy Advance",
  vb: "Virtual Boy", ds: "DS", "3ds": "3DS",
};
/** Version → marchés eBay interrogés (eBay Japon a fermé : la version JAP se cherche sur eBay US, « japanese »). */
const MARCHES = [
  { region: "US", marche: "EBAY_US" },
  { region: "JAP", marche: "EBAY_US", ajout: "japanese" },
  { region: "PAL", marche: "EBAY_FR" },
  { region: "PAL", marche: "EBAY_GB" },
];

const simple = (t) => (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const contient = (titre, mots) => mots.some((m) => ` ${titre} `.includes(` ${m} `));
const HORS_SUJET = ["lot", "bundle", "guide", "manual", "manuel", "notice", "box only", "case only", "empty", "boite vide", "steelbook", "amiibo", "repro", "reproduction", "replacement", "console", "poster", "artwork", "insert"];
const JAPON = ["jp", "jap", "japan", "japanese", "japon", "japonais", "ntsc j", "import"];
const PAL = ["pal", "fr", "fra", "uk", "eur", "europe", "version francaise"];
const COMPLET = ["cib", "complete", "complet", "boxed", "in box", "en boite", "avec boite", "new", "neuf", "sealed", "scelle"];
const SEUL = ["loose", "cart only", "cartridge only", "disc only", "game only", "cartouche seule", "jeu seul", "sans boite", "loose cart"];

const mediane = (v) => {
  if (!v.length) return null;
  const t = [...v].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return Math.round((t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2) * 100) / 100;
};

/** Jeton d'application (client credentials) : null + raison si eBay refuse cette autorisation. */
async function jeton(scope) {
  const reponse = await fetch(`${API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }).toString(),
  });
  const corps = await reponse.json().catch(() => ({}));
  if (!reponse.ok) return { jeton: null, raison: `HTTP ${reponse.status} ${corps.error ?? ""} ${corps.error_description ?? ""}`.trim() };
  return { jeton: corps.access_token, raison: null };
}

let appels = 0;
async function rechercher(chemin, marche, params, cle) {
  const url = new URL(`${API}${chemin}`);
  url.search = new URLSearchParams(params).toString();
  await pause(300);
  appels++;
  const reponse = await fetch(url, { headers: { Authorization: `Bearer ${cle}`, "X-EBAY-C-MARKETPLACE-ID": marche } });
  const corps = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    const message = corps.errors?.[0]?.message ?? "";
    return { erreur: `HTTP ${reponse.status} ${message}`.trim() };
  }
  return corps;
}

// 1. Accès : Browse (annonces en cours) et Marketplace Insights (ventes terminées).
const browse = await jeton("https://api.ebay.com/oauth/api_scope");
const insights = await jeton("https://api.ebay.com/oauth/api_scope/buy.marketplace.insights");
console.log(`Browse : ${browse.jeton ? "ouvert" : `refusé (${browse.raison})`}`);
console.log(`Marketplace Insights : ${insights.jeton ? "ouvert" : `refusé (${insights.raison})`}`);
if (!browse.jeton) throw new Error("Clés refusées par eBay : vérifier EBAY_CLIENT_ID et EBAY_CLIENT_SECRET (production).");

// 2. Échantillon : par console, le jeu le mieux noté, puis d'autres choisis par le slug (ordre stable).
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
  const autres = jeux.filter((j) => j !== note).sort((a, b) => simple(a.slug.split("").reverse().join("")).localeCompare(simple(b.slug.split("").reverse().join(""))));
  for (const j of [note, ...autres].slice(0, PAR_CONSOLE)) echantillon.push({ console: console_, jeu: j });
}
console.log(`${echantillon.length} jeux dans l'échantillon`);

// 3. Annonces en cours, par version et par marché.
const details = [];
for (const { console: slugConsole, jeu } of echantillon) {
  const par = Object.fromEntries(jeu.releases.map((r) => [r.region, r]));
  for (const { region, marche, ajout } of MARCHES) {
    const version = par[region];
    if (!version?.sortie) continue;
    const titre = region === "JAP" ? par.US?.titre ?? par.PAL?.titre ?? version.titre_romanise ?? version.titre : version.titre;
    const q = [titre, NOMS[slugConsole], ajout].filter(Boolean).join(" ");
    const ligne = { console: slugConsole, slug: jeu.slug, region, marche, q };
    details.push(ligne);
    let r = await rechercher("/buy/browse/v1/item_summary/search", marche, { q, category_ids: CATEGORIE_JEUX, limit: "50" }, browse.jeton);
    if (r.erreur) {
      ligne.categorie = false; // catégorie inconnue de ce marché : nouvel essai sans elle
      r = await rechercher("/buy/browse/v1/item_summary/search", marche, { q, limit: "50" }, browse.jeton);
    }
    if (r.erreur) {
      ligne.erreur = r.erreur;
      continue;
    }
    const mots = simple(titre).split(" ").filter((m) => m.length > 2 || /\d/.test(m));
    const annonces = (r.itemSummaries ?? []).map((a) => ({ titre: a.title, prix: Number(a.price?.value), devise: a.price?.currency, etat: a.condition ?? null }));
    const pertinentes = annonces.filter((a) => {
      const t = simple(a.titre);
      if (!mots.every((m) => contient(t, [m]))) return false;
      if (contient(t, HORS_SUJET)) return false;
      if (region === "JAP") return contient(t, JAPON);
      if (region === "US") return !contient(t, JAPON) && !contient(t, PAL);
      return true;
    });
    const prix = pertinentes.filter((a) => Number.isFinite(a.prix)).map((a) => a.prix);
    Object.assign(ligne, {
      total: r.total ?? 0,
      lues: annonces.length,
      pertinentes: pertinentes.length,
      complet: pertinentes.filter((a) => contient(simple(a.titre), COMPLET)).length,
      seul: pertinentes.filter((a) => contient(simple(a.titre), SEUL)).length,
      devise: pertinentes[0]?.devise ?? null,
      mediane: mediane(prix),
      min: prix.length ? Math.min(...prix) : null,
      max: prix.length ? Math.max(...prix) : null,
      exemples: pertinentes.slice(0, 3).map((a) => `${a.titre} — ${a.prix} ${a.devise}`),
      ecartees: annonces.filter((a) => !pertinentes.includes(a)).slice(0, 3).map((a) => a.titre),
    });
  }
}

// 4. Ventes terminées : 3 essais seulement si l'accès est ouvert.
const ventes = [];
if (insights.jeton) {
  for (const d of details.filter((x) => x.region === "US").slice(0, 3)) {
    const r = await rechercher("/buy/marketplace_insights/v1_beta/item_sales/search", "EBAY_US", { q: d.q, category_ids: CATEGORIE_JEUX, limit: "50" }, insights.jeton);
    const prix = (r.itemSales ?? []).map((v) => Number(v.lastSoldPrice?.value)).filter(Number.isFinite);
    ventes.push({ q: d.q, erreur: r.erreur ?? null, ventes: r.total ?? prix.length, mediane: mediane(prix) });
  }
}

// 5. Rapport : résumé de la tâche + détail en pièce jointe (sans clé ni jeton).
const acces = { browse: browse.jeton ? "ouvert" : browse.raison, insights: insights.jeton ? "ouvert" : insights.raison };
const parMarche = {};
for (const d of details) {
  const k = `${d.region} (${d.marche})`;
  const c = (parMarche[k] ??= { versions: 0, avecPrix: 0, aucuneAnnonce: 0, erreur: 0, lues: 0, pertinentes: 0, complet: 0, seul: 0 });
  c.versions++;
  if (d.erreur) c.erreur++;
  else if (d.mediane != null) c.avecPrix++;
  else c.aucuneAnnonce++;
  for (const x of ["lues", "pertinentes", "complet", "seul"]) c[x] += d[x] ?? 0;
}
writeFileSync("etude-ebay.json", JSON.stringify({ acces, appels, parMarche, ventes, details }, null, 1));
const colonnes = ["versions", "avecPrix", "aucuneAnnonce", "erreur", "lues", "pertinentes", "complet", "seul"];
const texte = [
  `## Étude eBay (${new Date().toISOString().slice(0, 10)})`,
  `Annonces en cours (Browse) : **${acces.browse}**. Ventes terminées (Marketplace Insights) : **${acces.insights}**.`,
  `${echantillon.length} jeux, ${details.length} versions × marché, ${appels} appels.`,
  "",
  `| Version (marché) | ${colonnes.join(" | ")} |`,
  `|---|${colonnes.map(() => "---").join("|")}|`,
  ...Object.entries(parMarche).map(([k, c]) => `| ${k} | ${colonnes.map((x) => c[x]).join(" | ")} |`),
  "",
  "| Jeu | Version | Marché | Pertinentes / lues | Médiane | Min – max |",
  "|---|---|---|---|---|---|",
  ...details.map((d) => `| ${d.console}/${d.slug} | ${d.region} | ${d.marche} | ${d.erreur ?? `${d.pertinentes} / ${d.lues}`} | ${d.mediane ?? "—"} ${d.devise ?? ""} | ${d.min ?? "—"} – ${d.max ?? "—"} |`),
  ...(ventes.length ? ["", "Ventes terminées (essai) :", ...ventes.map((v) => `- ${v.q} : ${v.erreur ?? `${v.ventes} ventes, médiane ${v.mediane}`}`)] : []),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
