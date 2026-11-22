// Relais ScreenScraper (étape 26, DESIGN §11, 22/11/2026) : pour chaque version sortie SANS jaquette, cherche le jeu
// chez ScreenScraper (même recherche que l'étude) et dépose sa boîte de face de la bonne région, en JPEG, dans le
// bucket PRIVÉ « gametdb » : screenscraper/{console}/{jeu}/{JAP|US|PAL}.jpg. Le catalogue ne change pas : la session
// Claude montre ces boîtes en planche, puis les enregistre avec scripts/jaquettes-screenscraper.mjs après l'accord
// du propriétaire. Les rapprochements sans titre identique sont écartés.
// Lancé par la tâche GitHub « Relais ScreenScraper » (la session Claude reçoit 403 de screenscraper.fr) :
//   SCREENSCRAPER_DEVID, SCREENSCRAPER_DEVPASSWORD, SCREENSCRAPER_USER, SCREENSCRAPER_PASSWORD,
//   SUPABASE_URL, SUPABASE_SECRET_KEY.
// Les identifiants ne sont jamais écrits : les adresses des images (ScreenScraper y recopie les identifiants) non plus.
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const env = process.env;
const requis = ["SCREENSCRAPER_DEVID", "SCREENSCRAPER_DEVPASSWORD", "SCREENSCRAPER_USER", "SCREENSCRAPER_PASSWORD", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const manquants = requis.filter((n) => !env[n]);
if (manquants.length) throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Nos consoles → identifiant du système chez ScreenScraper (Switch 2 : absent). */
const SYSTEMES = { nes: 3, snes: 4, n64: 14, gamecube: 13, wii: 16, "wii-u": 18, switch: 225, gb: 9, gbc: 10, gba: 12, vb: 11, ds: 15, "3ds": 17 };
/** Régions des médias ScreenScraper acceptées pour chacune des nôtres, par ordre de préférence. */
const REGIONS = { JAP: ["jp"], US: ["us"], PAL: ["eu", "uk", "fr", "de", "sp", "it", "au", "nl", "se", "dk", "fi", "pt"] };

class Arret extends Error {}
const identifiants = () => ({
  devid: env.SCREENSCRAPER_DEVID,
  devpassword: env.SCREENSCRAPER_DEVPASSWORD,
  softname: "nintendo-db",
  ssid: env.SCREENSCRAPER_USER,
  sspassword: env.SCREENSCRAPER_PASSWORD,
});
/** Une requête toutes les 1,5 s (un seul fil) ; 429 : on réessaie ; 401/403/423/426/430/431 : on s'arrête. */
async function appeler(url, quoi) {
  for (let essai = 1; ; essai++) {
    await pause(1500);
    const reponse = await fetch(url);
    if (reponse.status === 429 && essai < 3) continue;
    if (reponse.status === 404) return null;
    if (!reponse.ok) {
      const message = `${quoi} : HTTP ${reponse.status}`;
      if ([401, 403, 423, 426, 430, 431].includes(reponse.status)) throw new Arret(message);
      throw new Error(message);
    }
    return reponse;
  }
}
async function rechercher(systemeid, recherche) {
  const url = new URL("https://api.screenscraper.fr/api2/jeuRecherche.php");
  url.search = new URLSearchParams({ ...identifiants(), output: "json", systemeid: String(systemeid), recherche }).toString();
  const reponse = await appeler(url, "recherche");
  return reponse ? ((await reponse.json()).response?.jeux ?? []) : [];
}

const simple = (t) => (t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Les versions sorties sans jaquette, groupées par jeu.
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
  .filter((j) => j.manquantes.length && SYSTEMES[j.consoles.slug]);
console.log(`${jeux.length} jeux avec au moins une version sans jaquette`);

const deposees = [];
const ecartees = [];
let arret = null;
for (const jeu of jeux) {
  const console_ = jeu.consoles.slug;
  const par = Object.fromEntries(jeu.releases.map((r) => [r.region, r]));
  const titres = [par.US?.titre, par.PAL?.titre, par.JAP?.titre_romanise, par.JAP?.titre].filter(Boolean);
  if (!titres.length) continue;
  try {
    const candidats = (await rechercher(SYSTEMES[console_], titres[0])).filter(
      (g) => g?.id && Number(g.systeme?.id) === SYSTEMES[console_],
    );
    const nos = new Set(titres.map(simple));
    const choisi = candidats.find((g) => (g.noms ?? []).some((n) => nos.has(simple(n.text))));
    if (!choisi) {
      ecartees.push(`${console_}/${jeu.slug} : ${candidats.length ? "titre différent" : "introuvable"}`);
      continue;
    }
    for (const region of jeu.manquantes) {
      const boites = (choisi.medias ?? []).filter((m) => m.type === "box-2D" && m.url);
      const media = REGIONS[region].map((r) => boites.find((m) => m.region === r)).find(Boolean);
      if (!media) {
        ecartees.push(`${console_}/${jeu.slug} ${region} : pas de boîte de cette région`);
        continue;
      }
      const reponse = await appeler(media.url, "image");
      if (!reponse) {
        ecartees.push(`${console_}/${jeu.slug} ${region} : image absente`);
        continue;
      }
      const jpeg = await sharp(Buffer.from(await reponse.arrayBuffer()), { limitInputPixels: 40_000_000 })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 92 })
        .toBuffer();
      const chemin = `screenscraper/${console_}/${jeu.slug}/${region}.jpg`;
      const { error } = await supabase.storage.from("gametdb").upload(chemin, jpeg, { contentType: "image/jpeg", upsert: true });
      if (error) throw new Error(`${chemin} : ${error.message}`);
      deposees.push(`${chemin} (${media.region} ; « ${choisi.noms?.[0]?.text ?? "?"} »)`);
    }
  } catch (e) {
    console.log(`${console_}/${jeu.slug} : ${e.message}`);
    if (e instanceof Arret) {
      arret = e.message;
      break;
    }
    ecartees.push(`${console_}/${jeu.slug} : ${e.message}`);
  }
}

const texte = [
  `## Relais ScreenScraper (${new Date().toISOString().slice(0, 10)})`,
  `${deposees.length} boîte(s) déposée(s) dans gametdb/screenscraper ; ${ecartees.length} écartée(s).`,
  arret ? `**Arrêt anticipé** : ${arret}` : "",
  "",
  "<details><summary>Déposées</summary>\n",
  ...deposees.map((d) => `- ${d}`),
  "</details>\n<details><summary>Écartées</summary>\n",
  ...ecartees.map((d) => `- ${d}`),
  "</details>",
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
if (arret) process.exitCode = 1;
