// Étude des dates et éditeurs rétro (étape 26, 2e partie, DESIGN §11, 22/11/2026) : sur un échantillon de jeux NES à
// GameCube, compare nos sorties par région (date, éditeur) à celles de ScreenScraper. LECTURE SEULE : rien n'est
// écrit dans la base. Le jeu est trouvé par code produit (jeuInfos, serialnum), sinon par un titre identique ; un
// rapprochement incertain est écarté (pas de comparaison sur un autre jeu).
// Lancé par la tâche GitHub « Étude ScreenScraper dates » (la session Claude reçoit 403 de screenscraper.fr) :
//   SCREENSCRAPER_DEVID, SCREENSCRAPER_DEVPASSWORD, SCREENSCRAPER_USER, SCREENSCRAPER_PASSWORD,
//   SUPABASE_URL, SUPABASE_SECRET_KEY ; ETUDE_TAILLE (nombre de jeux tirés au hasard, 150 par défaut).
// Rapport : résumé de la tâche ; chaque écart est écrit dans le journal (lignes « ÉCART »). Les identifiants ne sont
// jamais écrits.
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const requis = ["SCREENSCRAPER_DEVID", "SCREENSCRAPER_DEVPASSWORD", "SCREENSCRAPER_USER", "SCREENSCRAPER_PASSWORD", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const manquants = requis.filter((n) => !env[n]);
if (manquants.length) throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const TAILLE = Number(env.ETUDE_TAILLE ?? 150);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Consoles rétro → identifiant du système chez ScreenScraper. */
const SYSTEMES = { nes: 3, snes: 4, n64: 14, gamecube: 13, gb: 9, gbc: 10, gba: 12, vb: 11 };
/** Régions des dates ScreenScraper acceptées pour chacune des nôtres, par ordre de préférence. */
const REGIONS = { JAP: ["jp"], US: ["us"], PAL: ["eu", "uk", "fr", "de", "sp", "it", "au"] };

class Arret extends Error {}
const identifiants = () => ({
  devid: env.SCREENSCRAPER_DEVID,
  devpassword: env.SCREENSCRAPER_DEVPASSWORD,
  softname: "nintendo-db",
  ssid: env.SCREENSCRAPER_USER,
  sspassword: env.SCREENSCRAPER_PASSWORD,
  output: "json",
});
/** Une requête toutes les 1,5 s (un seul fil) ; 429 : on réessaie ; 401/403/423/426/430/431 : on s'arrête. */
async function appeler(fichier, params) {
  const url = new URL(`https://api.screenscraper.fr/api2/${fichier}`);
  url.search = new URLSearchParams({ ...identifiants(), ...params }).toString();
  for (let essai = 1; ; essai++) {
    await pause(1500);
    const reponse = await fetch(url);
    if (reponse.status === 429 && essai < 3) continue;
    if (reponse.status === 404) return null;
    if (!reponse.ok) {
      const message = `${fichier} : HTTP ${reponse.status}`;
      if ([401, 403, 423, 426, 430, 431].includes(reponse.status)) throw new Arret(message);
      throw new Error(message);
    }
    return (await reponse.json()).response;
  }
}

const simple = (t) => (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** Éditeur ramené à l'essentiel : « Nintendo Co., Ltd. » et « Nintendo » sont le même. */
const societe = (t) => simple(t).replace(/\b(co|ltd|inc|corp|corporation|of america|america|europe|gmbh|limited)\b/g, "").replace(/\s+/g, " ").trim();

// Échantillon reproductible (graine fixe) parmi les jeux des consoles rétro.
let jeux = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select("slug, consoles!inner(slug), releases(region, sortie, titre, titre_romanise, date_sortie, precision_date, code_produit, editeur)")
    .in("consoles.slug", Object.keys(SYSTEMES))
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

const vide = () => ({ jeux: 0, trouves: 0, versions: 0, dateEgale: 0, memeMois: 0, memeAnnee: 0, jourOuMoisDifferent: 0, dateEcart: 0, dateAjoutable: 0, sansDateSS: 0, editeurEgal: 0, editeurDifferent: 0, editeurAjoutable: 0 });
const parConsole = {};
let arret = null;
for (const jeu of echantillon) {
  const console_ = jeu.consoles.slug;
  const c = (parConsole[console_] ??= vide());
  c.jeux++;
  const sorties = jeu.releases.filter((r) => r.sortie);
  const par = Object.fromEntries(sorties.map((r) => [r.region, r]));
  const titres = [par.US?.titre, par.PAL?.titre, par.JAP?.titre_romanise, par.JAP?.titre].filter(Boolean);
  try {
    let ss = null;
    for (const code of new Set(sorties.map((r) => r.code_produit).filter(Boolean))) {
      const r = await appeler("jeuInfos.php", { systemeid: String(SYSTEMES[console_]), romtype: "rom", serialnum: code, romnom: `${titres[0]}.zip` }).catch((e) => {
        if (e instanceof Arret) throw e;
        return null;
      });
      if (Number(r?.jeu?.systeme?.id) === SYSTEMES[console_]) {
        ss = r.jeu;
        break;
      }
    }
    const nos = new Set(titres.map(simple));
    for (const titre of ss ? [] : titres) {
      const r = await appeler("jeuRecherche.php", { systemeid: String(SYSTEMES[console_]), recherche: titre });
      ss = (r?.jeux ?? []).find((g) => g?.id && Number(g.systeme?.id) === SYSTEMES[console_] && (g.noms ?? []).some((n) => nos.has(simple(n.text)))) ?? null;
      if (ss) break;
    }
    if (!ss) continue;
    c.trouves++;
    const editeurSS = ss.editeur?.text ?? null;
    for (const r of sorties) {
      c.versions++;
      const d = REGIONS[r.region].map((x) => (ss.dates ?? []).find((y) => y.region === x)?.text).find(Boolean) ?? null;
      const nous = r.date_sortie;
      let verdict = null;
      if (!d) c.sansDateSS++;
      else if (!nous) {
        c.dateAjoutable++;
        verdict = "date ajoutable";
      } else {
        // Comparaison à la précision commune (ScreenScraper donne parfois l'année seule).
        const n = d.length >= 10 && r.precision_date === "jour" ? 10 : d.length >= 7 && r.precision_date !== "annee" ? 7 : 4;
        if (nous.slice(0, n) === d.slice(0, n)) c[n === 10 ? "dateEgale" : n === 7 ? "memeMois" : "memeAnnee"]++;
        else if (nous.slice(0, 4) === d.slice(0, 4)) {
          c.jourOuMoisDifferent++;
          verdict = "même année, jour ou mois différent";
        } else {
          c.dateEcart++;
          verdict = "année différente";
        }
      }
      if (verdict) console.log(`ÉCART ${console_}/${jeu.slug} ${r.region} : nous ${nous ?? "—"} (${r.precision_date ?? "?"}), ScreenScraper ${d} — ${verdict}`);
      if (!editeurSS) continue;
      const [a, b] = [societe(r.editeur), societe(editeurSS)];
      if (!r.editeur) c.editeurAjoutable++;
      else if (a.includes(b) || b.includes(a)) c.editeurEgal++;
      else {
        c.editeurDifferent++;
        console.log(`ÉCART ${console_}/${jeu.slug} ${r.region} : éditeur « ${r.editeur} », ScreenScraper « ${editeurSS} »`);
      }
    }
  } catch (e) {
    console.log(`${console_}/${jeu.slug} : ${e.message}`);
    if (e instanceof Arret) {
      arret = e.message;
      break;
    }
  }
}

const total = Object.values(parConsole).reduce((t, c) => {
  for (const [k, v] of Object.entries(c)) t[k] += v;
  return t;
}, vide());
const colonnes = Object.keys(vide());
const texte = [
  `## Étude ScreenScraper : dates et éditeurs rétro (${new Date().toISOString().slice(0, 10)})`,
  arret ? `**Arrêt anticipé** : ${arret}` : "",
  "Dates comparées à la précision commune ; écarts détaillés dans le journal (lignes « ÉCART »).",
  "",
  `| Console | ${colonnes.join(" | ")} |`,
  `|---|${colonnes.map(() => "---").join("|")}|`,
  ...Object.entries({ ...parConsole, TOTAL: total }).map(([k, c]) => `| ${k} | ${colonnes.map((x) => c[x]).join(" | ")} |`),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
if (arret) process.exitCode = 1;
