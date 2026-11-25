// Relais des annonces (US-33, ADR-20 point 5) : jeux de Nintendo pas encore sortis, lus dans les bases officielles de
// Nintendo Japon, Europe et US, déposés dans le bucket privé « gametdb » (annonces.json) ; l'import des annonces de
// l'administration (PR suivante) les lit là. Lecture seule chez Nintendo ; une source qui échoue n'arrête pas les autres.
// Depuis la session : npm run session -- scripts/relais-annonces.mjs [--essai] (--essai : affiche, ne dépose rien).
// Variables : SUPABASE_URL, SUPABASE_SECRET_KEY (jamais affichées).
import { createClient } from "@supabase/supabase-js";
import {
  lireEtatsUnis,
  lireEurope,
  lireJapon,
} from "../src/lib/import/annonces.ts";

const essai = process.argv.includes("--essai");
const aujourdhui = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Europe/Paris",
});
const ENTETES = { "User-Agent": "nintendo-db (relais des annonces)" };

async function lire(url, type = "json") {
  const reponse = await fetch(url, { headers: ENTETES });
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  return type === "json" ? reponse.json() : reponse.text();
}

/** Calendrier du Japon, du plus lointain au plus proche, jusqu'aux sorties passées. */
async function japon() {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const { result } = await lire(
      "https://search.nintendo.jp/nintendo_soft/search.json?fq=sche_s%3A1&sort=sodate%20desc&limit=300&page=" +
        page,
    );
    items.push(...result.items);
    const passes = result.items
      .filter((i) => /^\d{4}\.\d{1,2}\.\d{1,2}$/.test(i.sdate ?? ""))
      .every((i) => {
        const [a, m, j] = i.sdate.split(".");
        return `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}` < aujourdhui;
      });
    if (passes || !result.items.length || page * 300 >= result.total) break;
  }
  return lireJapon(items, aujourdhui);
}

async function europe() {
  const { response } = await lire(
    "https://searching.nintendo-europe.com/fr/select?wt=json&q=*&rows=500" +
      "&fq=" +
      encodeURIComponent(
        "type:GAME AND publisher:Nintendo AND dates_released_dts:[NOW TO *]",
      ) +
      "&fl=fs_id,title,publisher,dates_released_dts,pretty_date_s,system_names_txt,image_url",
  );
  return lireEurope(response.docs, aujourdhui);
}

async function etatsUnis() {
  const html = await lire(
    "https://www.nintendo.com/us/store/games/coming-soon/",
    "text",
  );
  const m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m)
    throw new Error("données de la page introuvables (la page a changé ?)");
  return lireEtatsUnis(JSON.parse(m[1]), aujourdhui);
}

const sources = {};
const annonces = [];
for (const [nom, lecture] of Object.entries({ japon, europe, etatsUnis })) {
  try {
    const lues = await lecture();
    annonces.push(...lues);
    sources[nom] = lues.length;
    console.log(`${nom} : ${lues.length} jeux à venir`);
  } catch (e) {
    sources[nom] = `échec : ${e.message}`;
    console.warn(`${nom} indisponible : ${e.message}`);
  }
}

for (const a of annonces)
  console.log(
    `  ${a.region} ${a.console.padEnd(8)} ${String(a.date ?? "—").padEnd(10)} ${a.precision.padEnd(8)} ${a.titre}`,
  );

if (essai) {
  console.log(`Essai : ${annonces.length} annonces, rien déposé.`);
} else {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
    throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
  const contenu = JSON.stringify(
    { lu_le: aujourdhui, sources, annonces },
    null,
    1,
  );
  const { error } = await createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
    .storage.from("gametdb")
    .upload("annonces.json", new TextEncoder().encode(contenu), {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw new Error(`Dépôt de annonces.json : ${error.message}`);
  console.log(
    `annonces.json déposé : ${annonces.length} annonces (${aujourdhui}).`,
  );
}
