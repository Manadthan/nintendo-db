// Séries de tout le catalogue (étape 23, SPEC v1.37, DESIGN ADR-15) : règles sur le titre + Wikidata (P179 « fait
// partie de la série »), ramenées aux noms de référence de src/lib/series/series.ts, plus les séries parentes.
// Lancé depuis la session Claude (skill script-prod) :
//   npm run session -- scripts/series-wikidata.mjs --essai [--rapport fichier.json]   (n'écrit rien)
//   npm run session -- scripts/series-wikidata.mjs [--rapport fichier.json]
//   --limite N : seulement les N premiers jeux (essai rapide)
// Les API de Wikipédia et Wikidata refusent l'adresse partagée de la session (429) : pages publiques seulement, une
// requête par seconde (≈ 40 min). Un jeu au verrou « series » (corrigé à la main, US-11) n'est jamais touché.
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { completer, serieWikidata, seriesDuTitre } from "../src/lib/series/series.ts";

const essai = process.argv.includes("--essai");
const iRapport = process.argv.indexOf("--rapport");
const rapport = iRapport > 0 ? process.argv[iRapport + 1] : null;
const iLimite = process.argv.indexOf("--limite");
const limite = iLimite > 0 ? Number(process.argv[iLimite + 1]) : Infinity;
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const ENTETES = { "User-Agent": "nintendo-db/1.0 (catalogue de jeux Nintendo, une requête par seconde)" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
/** Éléments Wikidata « jeu vidéo » (et variantes : jeu, remake, compilation). */
const JEU_VIDEO = new Set(["Q7889", "Q21125433", "Q865493", "Q64170203"]);

/** Pages restées inaccessibles (réseau, refus répétés) : comptées dans le bilan, le script continue. */
const inaccessibles = [];
/** Page publique : une requête par seconde ; refus (429) ou erreur réseau → attente croissante (5 essais). */
async function lire(adresse) {
  for (let essaiN = 1; essaiN <= 5; essaiN++) {
    await pause(1100);
    try {
      const reponse = await fetch(adresse, { headers: ENTETES });
      if (reponse.ok) return reponse.text();
      if (reponse.status === 404) return null;
    } catch {
      // Coupure ou refus passager du réseau (vu le 21/11/2026 : 403 du proxy au milieu de l'essai complet).
    }
    await pause(15000 * essaiN);
  }
  inaccessibles.push(adresse);
  return null;
}

const entites = new Map();
async function entite(q) {
  if (!entites.has(q)) {
    const texte = await lire(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`);
    const tout = texte ? JSON.parse(texte).entities : {};
    entites.set(q, tout[q] ?? Object.values(tout)[0] ?? null);
  }
  return entites.get(q);
}
const valeurs = (e, p) => (e?.claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);

/** Séries Wikidata d'un jeu (libellés bruts) : page Wikipédia (lien gardé, sinon titre anglais) → élément → P179. */
async function seriesWikidata(jeu, titreAnglais) {
  const page =
    jeu.wikipedia_url ?? (titreAnglais ? `https://en.wikipedia.org/wiki/${encodeURIComponent(titreAnglais.replace(/ /g, "_"))}` : null);
  const html = page ? await lire(page) : null;
  const q = html?.match(/"wgWikibaseItemId":"(Q\d+)"/)?.[1];
  const e = q ? await entite(q) : null;
  if (!e || !valeurs(e, "P31").some((v) => JEU_VIDEO.has(v))) return { trouve: false, libelles: [] };
  const libelles = [];
  for (const s of valeurs(e, "P179")) {
    const es = await entite(s);
    libelles.push(es?.labels?.fr?.value ?? es?.labels?.en?.value ?? s);
  }
  return { trouve: true, libelles };
}

const COLONNES = "id, slug, verrous, wikipedia_url, consoles(slug), releases(region, titre, titre_romanise)";
/** Avant la migration 0023 (essai seulement), la colonne `series` manque : séries actuelles vides. */
let avecColonne = true;
let jeux = [];
for (let de = 0; ; de += 1000) {
  let { data, error } = await supabase
    .from("games")
    .select(avecColonne ? `series, ${COLONNES}` : COLONNES)
    .order("slug")
    .range(de, de + 999);
  if (error?.code === "42703" && essai) {
    avecColonne = false;
    ({ data, error } = await supabase.from("games").select(COLONNES).order("slug").range(de, de + 999));
  }
  if (error) throw new Error(error.message);
  jeux = jeux.concat(data.map((j) => ({ series: [], ...j })));
  if (data.length < 1000) break;
}
jeux = jeux.slice(0, limite);

const bilan = { jeux: jeux.length, verrouilles: 0, trouvesWikidata: 0, avecSerie: 0, titreSeul: 0, wikidataSeul: 0, lesDeux: 0, ecrits: 0 };
const horsListe = {};
const details = [];
for (const [i, jeu] of jeux.entries()) {
  if (jeu.verrous.includes("series")) {
    bilan.verrouilles++;
    continue;
  }
  const titres = jeu.releases.flatMap((r) => [r.titre, r.titre_romanise]);
  const parTitre = seriesDuTitre(titres);
  const anglais = jeu.releases.find((r) => r.region === "US")?.titre ?? jeu.releases.find((r) => r.region === "PAL")?.titre;
  const wd = await seriesWikidata(jeu, anglais);
  if (wd.trouve) bilan.trouvesWikidata++;
  const parWikidata = [];
  for (const libelle of wd.libelles) {
    const s = serieWikidata(libelle);
    if (!s) continue;
    parWikidata.push(s.nom);
    if (!s.connue) horsListe[s.nom] = (horsListe[s.nom] ?? 0) + 1;
  }
  const series = completer([...parTitre, ...parWikidata]);
  if (series.length) bilan.avecSerie++;
  if (parTitre.length && parWikidata.length) bilan.lesDeux++;
  else if (parTitre.length) bilan.titreSeul++;
  else if (parWikidata.length) bilan.wikidataSeul++;
  const avant = [...jeu.series].sort((a, b) => a.localeCompare(b, "fr"));
  const change = avant.join("|") !== series.join("|");
  details.push({ console: jeu.consoles.slug, slug: jeu.slug, avant, series, wikidata: wd.libelles, change });
  if (change && !essai) {
    const { error } = await supabase.from("games").update({ series }).eq("id", jeu.id);
    if (error) throw new Error(`${jeu.slug} : ${error.message}`);
    bilan.ecrits++;
  }
  if ((i + 1) % 100 === 0) console.log(`${i + 1} / ${jeux.length}…`);
}

if (rapport) writeFileSync(rapport, JSON.stringify({ bilan, horsListe, inaccessibles, details }, null, 1));
console.log(
  `${bilan.jeux} jeux (${bilan.verrouilles} verrouillés, non touchés) ; élément Wikidata : ${bilan.trouvesWikidata} ; ` +
    `avec série : ${bilan.avecSerie} (titre seul ${bilan.titreSeul}, Wikidata seul ${bilan.wikidataSeul}, les deux ${bilan.lesDeux}) ; ` +
    `${details.filter((d) => d.change).length} à changer, ${essai ? "rien écrit (--essai)" : `${bilan.ecrits} écrits`}`,
);
if (inaccessibles.length) console.log(`Pages inaccessibles après 5 essais (${inaccessibles.length}) : ${inaccessibles.slice(0, 10).join(", ")}`);
const hors = Object.entries(horsListe).sort((a, b) => b[1] - a[1]);
console.log(`Séries Wikidata hors liste (${hors.length}) : ${hors.map(([n, c]) => `${n} (${c})`).join(", ") || "aucune"}`);
