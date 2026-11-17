// Relais GameTDB (#53) : GameTDB refuse les serveurs de Vercel. Lancé par la tâche GitHub « Relais GameTDB »,
// ce script dépose dans le bucket privé « gametdb » de Supabase :
//   - wiiutdb.xml : la base Wii U du jour ;
//   - scans/{identifiant}.jpg : le scan de boîte de chaque disque des jeux édités par Nintendo (code 01),
//     dans la première langue disponible (PAL : EN, puis FR, DE). Un scan déjà déposé n'est pas retéléchargé.
// Variables : SUPABASE_URL, SUPABASE_SECRET_KEY (secrets du dépôt ; jamais affichées).
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { strFromU8, unzipSync } from "fflate";

const URL_BASE = "https://www.gametdb.com/wiiutdb.zip?LANG=EN";
const LANGUES = { "NTSC-J": ["JA"], "NTSC-U": ["US"], PAL: ["EN", "FR", "DE"] };
const AGENT = { "User-Agent": "nintendo-db/1.0 (https://nintendo-db.vercel.app)" };

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const stockage = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY).storage.from("gametdb");

async function telecharger(url) {
  const reponse = await fetch(url, { headers: AGENT, signal: AbortSignal.timeout(30_000) });
  if (!reponse.ok) return null;
  return new Uint8Array(await reponse.arrayBuffer());
}

async function deposer(chemin, contenu, type) {
  const { error } = await stockage.upload(chemin, contenu, { contentType: type, upsert: true });
  if (error) throw new Error(`${chemin} : ${error.message}`);
}

// 1. La base.
const zip = await telecharger(URL_BASE);
if (!zip) throw new Error("Base GameTDB introuvable");
const fichiers = unzipSync(zip, { filter: (f) => f.name.endsWith(".xml") });
const xml = Object.values(fichiers)[0];
if (!xml) throw new Error("Aucun fichier XML dans l'archive");
await deposer("wiiutdb.xml", xml, "application/xml");
console.log(`Base déposée (${Math.round(xml.length / 1024)} Ko)`);

// 2. Les disques en boîte des jeux dont au moins une boîte est éditée par Nintendo.
const $ = cheerio.load(strFromU8(xml), { xml: true });
const parBase = new Map();
$("game").each((_, el) => {
  const jeu = $(el);
  const id = jeu.children("id").text().trim();
  const region = jeu.children("region").text().trim();
  const titre = jeu.find("locale[lang=EN] > title").first().text();
  if (jeu.children("type").text() !== "WiiU" || !LANGUES[region] || /\(download code\)/i.test(titre)) return;
  const nintendo = id.slice(4, 6) === "01" || /nintendo/i.test(jeu.children("publisher").text());
  const base = parBase.get(id.slice(0, 3)) ?? { nintendo: false, disques: [] };
  base.nintendo ||= nintendo;
  base.disques.push({ id, region });
  parBase.set(id.slice(0, 3), base);
});
const disques = [...parBase.values()].filter((b) => b.nintendo).flatMap((b) => b.disques);

// 3. Les scans manquants, 6 à la fois.
const { data: deja, error } = await stockage.list("scans", { limit: 2000 });
if (error) throw new Error(`Liste des scans : ${error.message}`);
const presents = new Set(deja.map((f) => f.name));
const aFaire = disques.filter((d) => !presents.has(`${d.id}.jpg`));
let deposes = 0;
const absents = [];
for (let i = 0; i < aFaire.length; i += 6) {
  await Promise.all(
    aFaire.slice(i, i + 6).map(async ({ id, region }) => {
      for (const langue of LANGUES[region]) {
        const scan = await telecharger(`https://art.gametdb.com/wiiu/coverHQ/${langue}/${id}.jpg`);
        if (scan) {
          await deposer(`scans/${id}.jpg`, scan, "image/jpeg");
          deposes++;
          return;
        }
      }
      absents.push(id);
    }),
  );
}
console.log(
  `${disques.length} disques Nintendo ; ${presents.size} scans déjà là, ${deposes} déposés, ` +
    `${absents.length} sans scan sur GameTDB${absents.length ? ` : ${absents.sort().join(", ")}` : ""}`,
);
