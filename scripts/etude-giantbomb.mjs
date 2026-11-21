// Étude Giant Bomb (étape 26, DESIGN §11) : sur un échantillon de jeux rétro (NES à GameCube), compare nos sorties
// par région (date, code produit) à celles de l'API Giant Bomb. LECTURE SEULE : n'écrit rien dans la base.
// Lancé par la tâche GitHub « Étude Giant Bomb » (la session Claude reçoit 403 de giantbomb.com) :
//   GIANTBOMB_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY ; ETUDE_TAILLE (60 par défaut).
// Une requête par seconde et au plus ≈ 120 au total (limite annoncée : 200 par ressource et par heure).
// La clé n'est jamais affichée : les adresses appelées ne sont pas écrites dans le journal.
import { appendFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const { GIANTBOMB_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, GITHUB_STEP_SUMMARY } = process.env;
if (!GIANTBOMB_API_KEY || !SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("GIANTBOMB_API_KEY, SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const TAILLE = Number(process.env.ETUDE_TAILLE ?? 60);
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Nos consoles rétro → nom de la plateforme chez Giant Bomb. */
const PLATEFORMES = {
  nes: "Nintendo Entertainment System",
  snes: "Super Nintendo Entertainment System",
  n64: "Nintendo 64",
  gb: "Game Boy",
  gbc: "Game Boy Color",
  gba: "Game Boy Advance",
  vb: "Virtual Boy",
  gamecube: "GameCube",
};
/** Région Giant Bomb → notre région (le reste : ignoré et compté). */
const REGION = { Japan: "JAP", "United States": "US", "United Kingdom": "PAL", Europe: "PAL", Australia: "PAL" };

let appels = 0;
async function api(ressource, params) {
  const url = new URL(`https://www.giantbomb.com/api/${ressource}/`);
  url.search = new URLSearchParams({ api_key: GIANTBOMB_API_KEY, format: "json", ...params }).toString();
  await pause(1100);
  appels++;
  const reponse = await fetch(url, { headers: { "User-Agent": "nintendo-db/1.0 (catalogue de jeux Nintendo)" } });
  if (!reponse.ok) throw new Error(`${ressource} : HTTP ${reponse.status}`);
  const json = await reponse.json();
  if (json.status_code !== 1) throw new Error(`${ressource} : ${json.status_code} ${json.error}`);
  return json.results;
}

const simple = (t) => (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const jours = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);

// Échantillon reproductible (graine fixe) parmi les jeux des consoles rétro.
let jeux = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select("slug, consoles!inner(slug), releases(region, sortie, titre, date_sortie, precision_date, code_produit)")
    .in("consoles.slug", Object.keys(PLATEFORMES))
    .order("slug")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  jeux = jeux.concat(data);
  if (data.length < 1000) break;
}
let graine = 26;
const hasard = () => (graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648;
const echantillon = jeux.map((j) => [hasard(), j]).sort((a, b) => a[0] - b[0]).slice(0, TAILLE).map((x) => x[1]);
console.log(`${jeux.length} jeux rétro ; échantillon de ${echantillon.length}`);

const details = [];
const bilan = { jeux: echantillon.length, trouves: 0, sansSortiesGB: 0, regionsCommunes: 0, datesEgales: 0, datesProches: 0, datesEcart: 0, codesEgaux: 0, codesDifferents: 0, codesAjoutables: 0, regionsGBenPlus: 0, regionsNousEnPlus: 0 };
for (const jeu of echantillon) {
  const plateforme = PLATEFORMES[jeu.consoles.slug];
  const nos = Object.fromEntries(jeu.releases.filter((r) => r.sortie).map((r) => [r.region, r]));
  const titre = nos.US?.titre ?? nos.PAL?.titre ?? nos.JAP?.titre;
  const ligne = { console: jeu.consoles.slug, slug: jeu.slug, titre, trouve: null, regions: {} };
  details.push(ligne);
  try {
    const resultats = await api("search", { query: titre, resources: "game", field_list: "id,name,platforms", limit: "10" });
    const surConsole = resultats.filter((g) => (g.platforms ?? []).some((p) => p.name === plateforme));
    const choisi = surConsole.find((g) => simple(g.name) === simple(titre)) ?? surConsole[0];
    if (!choisi) continue;
    ligne.trouve = choisi.name;
    bilan.trouves++;
    const sorties = (
      await api("releases", { filter: `game:${choisi.id}`, field_list: "name,region,platform,release_date,product_code_value" })
    ).filter((s) => s.platform?.name === plateforme);
    if (!sorties.length) bilan.sansSortiesGB++;
    const gb = {};
    for (const s of sorties) {
      const r = REGION[s.region?.name];
      if (r && !gb[r]) gb[r] = s;
    }
    for (const r of ["JAP", "US", "PAL"]) {
      const a = nos[r];
      const b = gb[r];
      if (a && b) {
        bilan.regionsCommunes++;
        const d = a.date_sortie && b.release_date ? jours(a.date_sortie, b.release_date.slice(0, 10)) : null;
        if (d === 0) bilan.datesEgales++;
        else if (d !== null && Math.abs(d) <= 31) bilan.datesProches++;
        else if (d !== null) bilan.datesEcart++;
        const ca = (a.code_produit ?? "").trim();
        const cb = (b.product_code_value ?? "").trim();
        if (cb && !ca) bilan.codesAjoutables++;
        else if (ca && cb && ca.replace(/\W/g, "") === cb.replace(/\W/g, "")) bilan.codesEgaux++;
        else if (ca && cb) bilan.codesDifferents++;
        ligne.regions[r] = { nous: [a.date_sortie, ca || null], giantbomb: [b.release_date?.slice(0, 10) ?? null, cb || null], ecartJours: d };
      } else if (b) {
        bilan.regionsGBenPlus++;
        ligne.regions[r] = { nous: null, giantbomb: [b.release_date?.slice(0, 10) ?? null, b.product_code_value ?? null] };
      } else if (a) {
        bilan.regionsNousEnPlus++;
        ligne.regions[r] = { nous: [a.date_sortie, a.code_produit], giantbomb: null };
      }
    }
  } catch (e) {
    ligne.erreur = e.message;
    console.log(`${jeu.slug} : ${e.message}`);
    if (/100|107|HTTP 4/.test(e.message)) break; // clé refusée, limite atteinte ou accès bloqué : inutile d'insister
  }
}

writeFileSync("etude-giantbomb.json", JSON.stringify({ bilan, details }, null, 1));
const texte = [
  `## Étude Giant Bomb (${new Date().toISOString().slice(0, 10)})`,
  `${appels} appels à l'API ; ${bilan.trouves} jeux trouvés sur ${bilan.jeux} (${bilan.sansSortiesGB} sans sortie sur la console).`,
  "",
  "| Mesure | Nombre |",
  "|---|---|",
  ...Object.entries(bilan).map(([k, v]) => `| ${k} | ${v} |`),
  "",
  `Erreurs : ${details.filter((d) => d.erreur).length} ; non trouvés : ${details.filter((d) => !d.trouve && !d.erreur).map((d) => d.slug).join(", ") || "aucun"}`,
].join("\n");
console.log(texte);
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${texte}\n`);
