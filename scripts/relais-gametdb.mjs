// Relais GameTDB (#53) : GameTDB refuse les serveurs de Vercel. Lancé par la tâche GitHub « Relais GameTDB »,
// ce script dépose dans le bucket privé « gametdb » de Supabase, pour chaque console :
//   - Wii U : wiiutdb.xml (la base du jour) et scans/{identifiant}.jpg (scan `coverHQ` de la face de la boîte) ;
//   - DS et 3DS (étape 9) : ds/dstdb.xml, 3ds/3dstdb.xml (bases réduites) et {ds,3ds}/scans/{identifiant}.jpg ;
//   - Wii (étape 8) : wii/wiitdb.xml (base RÉDUITE aux jeux Nintendo du commerce : 10 Mo → 300 Ko) et
//     wii/faces/{identifiant}.jpg (face avant DÉCOUPÉE dans le scan `coverfullHQ` de la boîte dépliée, sans la
//     tranche : #87 ; l'ancien dossier wii/scans n'est plus lu).
// Seulement les disques des jeux dont au moins une boîte est éditée par Nintendo, dans la première langue
// disponible (PAL : EN, puis FR, DE). Un scan déjà déposé n'est pas retéléchargé.
// Variables : SUPABASE_URL, SUPABASE_SECRET_KEY (secrets du dépôt ; jamais affichées).
// Node 24 lit directement le TypeScript de src/lib/import/relais-wii.ts (testé par Vitest).
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { strFromU8, unzipSync } from "fflate";
import { decouperFaceAvant, LANGUES_SCAN_WII, reduireBaseWii } from "../src/lib/import/relais-wii.ts";
import { languesScan, reduireBasePortable } from "../src/lib/import/relais-portables.ts";
import { avecReessais, decrireErreurStockage } from "../src/lib/import/reessais.ts";

const AGENT = { "User-Agent": "nintendo-db/1.0 (https://nintendo-db.vercel.app)" };

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const stockage = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY).storage.from("gametdb");

async function telecharger(url) {
  const reponse = await fetch(url, { headers: AGENT, signal: AbortSignal.timeout(30_000) });
  if (!reponse.ok) return null;
  return new Uint8Array(await reponse.arrayBuffer());
}

// Un envoi peut échouer de façon passagère (erreur sans message, 17/11/2026) : 3 essais, code HTTP dans le message (#92).
async function deposer(chemin, contenu, type) {
  await avecReessais(async () => {
    const { error } = await stockage.upload(chemin, contenu, { contentType: type, upsert: true });
    if (error) throw new Error(`${chemin} : ${decrireErreurStockage(error)}`);
  });
}

async function base(url) {
  const zip = await telecharger(url);
  if (!zip) throw new Error(`Base GameTDB introuvable : ${url}`);
  const xml = Object.values(unzipSync(zip, { filter: (f) => f.name.endsWith(".xml") }))[0];
  if (!xml) throw new Error("Aucun fichier XML dans l'archive");
  return xml;
}

/** Disques Wii U en boîte des jeux dont au moins une boîte est éditée par Nintendo. */
function disquesWiiU(xml, langues) {
  const $ = cheerio.load(strFromU8(xml), { xml: true });
  const parBase = new Map();
  $("game").each((_, el) => {
    const jeu = $(el);
    const id = jeu.children("id").text().trim();
    const region = jeu.children("region").text().trim();
    const titre = jeu.find("locale[lang=EN] > title").first().text();
    if (jeu.children("type").text() !== "WiiU" || !langues[region] || /\(download code\)/i.test(titre)) return;
    const nintendo = id.slice(4, 6) === "01" || /nintendo/i.test(jeu.children("publisher").text());
    const groupe = parBase.get(id.slice(0, 3)) ?? { nintendo: false, disques: [] };
    groupe.nintendo ||= nintendo;
    groupe.disques.push({ id, region });
    parBase.set(id.slice(0, 3), groupe);
  });
  return [...parBase.values()].filter((b) => b.nintendo).flatMap((b) => b.disques);
}

const CONSOLES = [
  {
    nom: "Wii U",
    dossier: "",
    scans: "scans",
    langues: { "NTSC-J": ["JA"], "NTSC-U": ["US"], PAL: ["EN", "FR", "DE"] },
    async preparer() {
      const xml = await base("https://www.gametdb.com/wiiutdb.zip?LANG=EN");
      return { fichier: "wiiutdb.xml", xml, disques: disquesWiiU(xml, this.langues) };
    },
    async scan(id, langue) {
      return telecharger(`https://art.gametdb.com/wiiu/coverHQ/${langue}/${id}.jpg`);
    },
  },
  {
    nom: "Wii",
    dossier: "wii/",
    // Faces avant recoupées sans la bande blanche de la tranche (#87) : nouveau dossier, donc toutes refaites.
    scans: "wii/faces",
    langues: LANGUES_SCAN_WII,
    async preparer() {
      const { xml, disques } = reduireBaseWii(strFromU8(await base("https://www.gametdb.com/wiitdb.zip?LANG=EN")));
      return { fichier: "wiitdb.xml", xml: new TextEncoder().encode(xml), disques };
    },
    async scan(id, langue) {
      const boite = await telecharger(`https://art.gametdb.com/wii/coverfullHQ/${langue}/${id}.png`);
      return boite && decouperFaceAvant(boite);
    },
  },
  // Étape 9 : DS et 3DS, face seule ; scan haute définition (768 × 680), sinon moyen (400 × 352, cartes japonaises).
  ...["ds", "3ds"].map((portable) => ({
    nom: portable.toUpperCase(),
    dossier: `${portable}/`,
    scans: `${portable}/scans`,
    languesDe: (id) => languesScan(id),
    async preparer() {
      const { xml, disques } = reduireBasePortable(
        portable,
        strFromU8(await base(`https://www.gametdb.com/${portable}tdb.zip?LANG=EN`)),
      );
      return { fichier: `${portable}tdb.xml`, xml: new TextEncoder().encode(xml), disques };
    },
    async scan(id, langue) {
      return (
        (await telecharger(`https://art.gametdb.com/${portable}/coverHQ/${langue}/${id}.jpg`)) ??
        (await telecharger(`https://art.gametdb.com/${portable}/coverM/${langue}/${id}.jpg`))
      );
    },
  })),
];

for (const console_ of CONSOLES) {
  // 1. La base.
  const { fichier, xml, disques } = await console_.preparer();
  await deposer(`${console_.dossier}${fichier}`, xml, "application/xml");
  console.log(`${console_.nom} : base déposée (${Math.round(xml.length / 1024)} Ko)`);

  // 2. Les scans manquants, 6 à la fois.
  const deja = await avecReessais(async () => {
    const { data, error } = await stockage.list(console_.scans, { limit: 2000 });
    if (error) throw new Error(`Liste des scans : ${decrireErreurStockage(error)}`);
    return data;
  });
  const presents = new Set(deja.map((f) => f.name));
  const aFaire = disques.filter((d) => !presents.has(`${d.id}.jpg`));
  let deposes = 0;
  const absents = [];
  for (let i = 0; i < aFaire.length; i += 6) {
    await Promise.all(
      aFaire.slice(i, i + 6).map(async ({ id, region }) => {
        for (const langue of console_.languesDe?.(id) ?? console_.langues[region]) {
          const scan = await console_.scan(id, langue);
          if (scan) {
            await deposer(`${console_.scans}/${id}.jpg`, scan, "image/jpeg");
            deposes++;
            return;
          }
        }
        absents.push(id);
      }),
    );
  }
  console.log(
    `${console_.nom} : ${disques.length} disques Nintendo ; ${presents.size} scans déjà là, ${deposes} déposés, ` +
      `${absents.length} sans scan sur GameTDB${absents.length ? ` : ${absents.sort().join(", ")}` : ""}`,
  );
}
