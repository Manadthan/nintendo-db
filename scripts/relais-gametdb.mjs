// Relais GameTDB (#53) : GameTDB refuse les serveurs de Vercel. Lancé par la tâche GitHub « Relais GameTDB »,
// ce script dépose dans le bucket privé « gametdb » de Supabase, pour chaque console :
//   - Wii U : wiiutdb.xml (la base du jour) et scans/{identifiant}.jpg (scan `coverHQ` de la face de la boîte) ;
//   - DS et 3DS (étape 9) : ds/dstdb.xml, 3ds/3dstdb.xml (bases réduites) et {ds,3ds}/scans/{identifiant}.jpg ;
//   - GameCube (étape 11) : gamecube/gctdb.xml (base Wii avec la GameCube, réduite) et gamecube/faces/{id}.jpg (face
//     découpée comme la Wii ; sinon petite image 160 × 224 de GameTDB) ;
//   - N64 et GBA (étape 14) : n64/libretro.xml, gba/libretro.xml, index des boîtes de libretro-thumbnails (noms des
//     fichiers du dépôt GitHub, lus par un clone sans contenu) ; l'import y cherche les boîtes et les copie lui-même ;
//   - Switch (étape 10) : switch/switchtdb.xml (base réduite) et switch/scans/{JAP,US,PAL}/{identifiant}.jpg : une
//     cartouche mondiale (« ALL ») a une boîte par région ;
//   - Wii (étape 8) : wii/wiitdb.xml (base RÉDUITE aux jeux Nintendo du commerce : 10 Mo → 300 Ko) et
//     wii/faces/{identifiant}.jpg (face avant DÉCOUPÉE dans le scan `coverfullHQ` de la boîte dépliée, sans la
//     tranche : #87 ; l'ancien dossier wii/scans n'est plus lu).
// Seulement les disques des jeux dont au moins une boîte est éditée par Nintendo, dans la première langue
// disponible (PAL : EN, puis FR, DE). Un scan déjà déposé n'est pas retéléchargé.
// Variables : SUPABASE_URL, SUPABASE_SECRET_KEY (secrets du dépôt ; jamais affichées).
// Node 24 lit directement le TypeScript de src/lib/import/relais-wii.ts (testé par Vitest).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { strFromU8, unzipSync } from "fflate";
import {
  decouperFaceAvant,
  estDisqueGameCubeDuCommerce,
  LANGUES_SCAN_WII,
  LANGUES_SCAN_WII_U,
  reduireBaseWii,
  versJpeg,
} from "../src/lib/import/relais-wii.ts";
import { languesScan, reduireBasePortable } from "../src/lib/import/relais-portables.ts";
import { reduireBaseSwitch, SCANS_SWITCH } from "../src/lib/import/relais-switch.ts";
import { DEPOTS_LIBRETRO, indexEnXml } from "../src/lib/import/libretro.ts";
import { avecReessais, decrireErreurStockage, telechargerAvecReessais } from "../src/lib/import/reessais.ts";
import { AUCUN_OFFICIEL, basesNintendo, FILTRES_JAPON, officiels } from "../src/lib/import/editeurs-officiels.ts";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const stockage = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY).storage.from("gametdb");

// GameTDB peut être lent (délai de 30 s dépassé le 18/11/2026) : 3 essais de 60 s ; un scan qui ne vient toujours
// pas est compté « sans scan » au lieu d'arrêter le relais.
const lents = [];
async function telecharger(url) {
  try {
    return await telechargerAvecReessais(url);
  } catch (e) {
    lents.push(url);
    console.warn(`Ignoré : ${e.message}`);
    return null;
  }
}

// Un envoi peut échouer de façon passagère (erreur sans message, 17/11/2026) : 3 essais, code HTTP dans le message (#92).
async function deposer(chemin, contenu, type) {
  await avecReessais(async () => {
    const { error } = await stockage.upload(chemin, contenu, { contentType: type, upsert: true });
    if (error) throw new Error(`${chemin} : ${decrireErreurStockage(error)}`);
  });
}

// Étape 22 (ADR-13) : éditeurs officiels, pour compléter un éditeur vide chez GameTDB (Switch, 3DS). Les deux bases
// sont publiques ; leur échec n'arrête pas le relais (les éditeurs vides restent écartés, comme avant).
async function json(url) {
  const reponse = await fetch(url, { headers: { "User-Agent": "nintendo-db (relais)" } });
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  return reponse.json();
}
async function editeursOfficiels() {
  try {
    const europe = [];
    for (let debut = 0; ; debut += 1000) {
      const page = await json(
        "https://searching.nintendo-europe.com/en/select?wt=json&q=*&rows=1000&sort=fs_id%20asc" +
          "&fq=type:GAME%20AND%20originally_for_t:(HAC%20OR%20CTR%20OR%20KTR)&fl=publisher,product_code_txt,physical_version_b,system_type" +
          `&start=${debut}`,
      );
      europe.push(...page.response.docs);
      if (debut + 1000 >= page.response.numFound) break;
    }
    const japon = [];
    for (const filtre of FILTRES_JAPON) {
      for (let numero = 1; ; numero++) {
        const { result } = await json(
          `https://search.nintendo.jp/nintendo_soft/search.json?opt_hard=${filtre}&limit=300&page=${numero}&opt_sshow=1`,
        );
        japon.push(...result.items.map((i) => ({ icode: i.icode, hard: i.hard, maker: i.maker, sform: i.sform })));
        if (numero * 300 >= result.total || !result.items.length) break;
      }
    }
    const sw = basesNintendo("switch", europe, japon);
    const ds3 = basesNintendo("3ds", europe, japon);
    console.log(
      `Éditeurs officiels : ${europe.length} jeux (Europe), ${japon.length} (Japon) ; bases Nintendo : ` +
        `Switch ${sw.europe.size} + ${sw.japon.size}, 3DS ${ds3.europe.size} + ${ds3.japon.size}`,
    );
    return { switch: officiels(sw), "3ds": officiels(ds3) };
  } catch (e) {
    console.warn(`Éditeurs officiels indisponibles (${e.message}) : règles de l'ADR-13 et de l'ADR-14 ignorées.`);
    return { switch: AUCUN_OFFICIEL, "3ds": AUCUN_OFFICIEL };
  }
}
const editeurs = await editeursOfficiels();

async function base(url) {
  // La base est indispensable : son échec (après les réessais) arrête le relais, avec l'adresse.
  const zip = await telechargerAvecReessais(url);
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
    langues: LANGUES_SCAN_WII_U,
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
  // Étape 11 : GameCube, même boîte dépliée que la Wii ; repli sur la petite image de la face (Japon surtout).
  {
    nom: "GameCube",
    dossier: "gamecube/",
    scans: "gamecube/faces",
    // Boîte dépliée dans chaque langue d'abord, puis seulement la petite image (une petite anglaise ne passe pas avant
    // une grande française).
    languesDe: (_id, region) => [
      ...LANGUES_SCAN_WII[region].map((l) => `coverfullHQ/${l}`),
      ...LANGUES_SCAN_WII[region].map((l) => `cover/${l}`),
    ],
    async preparer() {
      const { xml, disques } = reduireBaseWii(
        strFromU8(await base("https://www.gametdb.com/wiitdb.zip?LANG=EN&GAMECUBE=1")),
        estDisqueGameCubeDuCommerce,
      );
      return { fichier: "gctdb.xml", xml: new TextEncoder().encode(xml), disques };
    },
    async scan(id, chemin) {
      const image = await telecharger(`https://art.gametdb.com/wii/${chemin}/${id}.png`);
      if (!image) return null;
      return chemin.startsWith("coverfullHQ/") ? decouperFaceAvant(image) : versJpeg(image);
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
        editeurs[portable] ?? AUCUN_OFFICIEL,
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
  // Étape 10 : Switch, une boîte par région de la cartouche (haute définition, sinon scan moyen ; jamais la boîte
  // d'une autre région).
  {
    nom: "Switch",
    dossier: "switch/",
    scans: "switch/scans",
    dossiers: ["JAP", "US", "PAL"].map((r) => `switch/scans/${r}`),
    chemin: ({ id, region }) => `switch/scans/${region}/${id}.jpg`,
    languesDe: (_id, region) => SCANS_SWITCH[region],
    async preparer() {
      const { xml, disques } = reduireBaseSwitch(
        strFromU8(await base("https://www.gametdb.com/switchtdb.zip?LANG=EN")),
        editeurs.switch,
      );
      return { fichier: "switchtdb.xml", xml: new TextEncoder().encode(xml), disques };
    },
    async scan(id, chemin) {
      return telecharger(`https://art.gametdb.com/switch/${chemin}/${id}.jpg`);
    },
  },
];

for (const console_ of CONSOLES) {
  // 1. La base.
  const { fichier, xml, disques } = await console_.preparer();
  await deposer(`${console_.dossier}${fichier}`, xml, "application/xml");
  console.log(`${console_.nom} : base déposée (${Math.round(xml.length / 1024)} Ko)`);

  // 2. Les scans manquants, 6 à la fois.
  // Chemin d'un scan : {scans}/{id}.jpg, ou par région (Switch).
  const chemin = console_.chemin ?? (({ id }) => `${console_.scans}/${id}.jpg`);
  const presents = new Set();
  for (const dossier of console_.dossiers ?? [console_.scans]) {
    const deja = await avecReessais(async () => {
      const { data, error } = await stockage.list(dossier, { limit: 2000 });
      if (error) throw new Error(`Liste des scans : ${decrireErreurStockage(error)}`);
      return data;
    });
    for (const f of deja) presents.add(`${dossier}/${f.name}`);
  }
  const aFaire = disques.filter((d) => !presents.has(chemin(d)));
  let deposes = 0;
  const absents = [];
  for (let i = 0; i < aFaire.length; i += 6) {
    await Promise.all(
      aFaire.slice(i, i + 6).map(async ({ id, region }) => {
        for (const langue of console_.languesDe?.(id, region) ?? console_.langues[region]) {
          const scan = await console_.scan(id, langue);
          if (scan) {
            await deposer(chemin({ id, region }), scan, "image/jpeg");
            deposes++;
            return;
          }
        }
        absents.push(console_.chemin ? `${id} (${region})` : id);
      }),
    );
  }
  console.log(
    `${console_.nom} : ${disques.length} disques Nintendo ; ${presents.size} scans déjà là, ${deposes} déposés, ` +
      `${absents.length} sans scan sur GameTDB${absents.length ? ` : ${absents.sort().join(", ")}` : ""}`,
  );
}
if (lents.length) console.log(`${lents.length} scans sans réponse de GameTDB (réessayés au prochain relais).`);

// Étape 14 : index des boîtes libretro-thumbnails (N64, GBA). Clone sans contenu : seulement la liste des fichiers.
for (const [slug, depot] of Object.entries(DEPOTS_LIBRETRO)) {
  const dossier = mkdtempSync(join(tmpdir(), "libretro-"));
  try {
    execFileSync("git", ["clone", "-q", "--depth", "1", "--filter=blob:none", "--no-checkout",
      `https://github.com/libretro-thumbnails/${depot}.git`, dossier]);
    const noms = execFileSync("git", ["-C", dossier, "ls-tree", "-r", "--name-only", "HEAD", "Named_Boxarts/"], {
      encoding: "utf8",
      maxBuffer: 50_000_000,
    })
      .split("\n")
      .filter((n) => n.endsWith(".png"))
      .map((n) => n.slice("Named_Boxarts/".length, -".png".length));
    await deposer(`${slug}/libretro.xml`, new TextEncoder().encode(indexEnXml(noms)), "application/xml");
    console.log(`${slug.toUpperCase()} : index libretro-thumbnails déposé (${noms.length} boîtes)`);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
}
