// Nettoyage et optimisation des images d'amiibo déjà en production :
// - détoure le fond blanc des figurines concernées (reprises en haute définition depuis Nintendo US w_1200 / Europe
//   quand la source répond, sinon depuis l'image déjà dans le bucket), puis recadre les marges vides ;
// - en mode « tous » (par défaut), optimise aussi le poids WebP (effort 6, alphaQuality 80) et recadre les marges des
//   autres amiibo depuis leur PNG d'origine (AmiiboAPI) dès que cela gagne >= 10 % ou retire >= 8 % de marges ;
// - respecte les verrous (`image_path`), change la version du chemin (cache-busting) et supprime les anciens WebP.
//
// Utilisation :
//   node scripts/amiibo-optimiser-images.mjs --mode tous
//   node scripts/amiibo-optimiser-images.mjs --mode fond-blanc
//   node scripts/amiibo-optimiser-images.mjs --mode tous --essai

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  imageAmiiboApi,
  imageNintendoUs,
  simplifier,
} from "../src/lib/amiibo/amiibo.ts";
import {
  aFondBlanc,
  doitDetourer,
  OPTIONS_WEBP_AMIIBO,
  retirerFondBlanc,
  SEUIL_RECADRAGE,
} from "../src/lib/amiibo/image.ts";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");

const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
  const i = args.indexOf(nom);
  return i >= 0 ? (args[i + 1] ?? defaut) : defaut;
};
const mode = option("--mode", "tous");
if (mode !== "tous" && mode !== "fond-blanc")
  throw new Error(`--mode invalide : ${mode} (attendu : tous ou fond-blanc)`);
const essai = args.includes("--essai");

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const baseBucket = `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/amiibo`;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const version = Date.now().toString(36);

/** Charge les URLs haute résolution Nintendo US (w_1200) et Nintendo Europe indexées par identifiant. */
async function chargerSourcesHauteRes() {
  const sources = new Map();
  try {
    const html = await (
      await fetch("https://www.nintendo.com/us/amiibo/line-up/")
    ).text();
    const donnees = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s.exec(
      html,
    )?.[1];
    if (donnees) {
      const us = JSON.parse(donnees).props.pageProps.page.amiibos;
      for (const u of us) {
        if (!u.slug || !u.figureAsset?.publicId) continue;
        sources.set(
          `us:${u.slug}`.slice(0, 123),
          imageNintendoUs(u.figureAsset.publicId),
        );
      }
    }
  } catch (e) {
    console.warn(`Nintendo US indisponible (${e.message}), repli sur le bucket`);
  }
  try {
    const r = await fetch(
      "https://searching.nintendo-europe.com/en/select?wt=json&q=*&fq=type:FIGURE&rows=1000&sort=date_from%20desc",
    );
    if (r.ok) {
      const docs = (await r.json()).response.docs;
      for (const f of docs) {
        if (!f.title || !f.figure_image_url_s) continue;
        const cle = `eu:${simplifier(f.title).replace(/ /g, "-")}`.slice(
          0,
          123,
        );
        sources.set(cle, f.figure_image_url_s);
      }
    }
  } catch (e) {
    console.warn(
      `Nintendo Europe indisponible (${e.message}), repli sur le bucket`,
    );
  }
  return sources;
}

async function telechargerBuffer(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  return Buffer.from(await r.arrayBuffer());
}

/** Prépare les variantes 300w et 600w (détourage si besoin, recadrage, WebP optimisé). */
async function preparerVariantes(brut, detourer) {
  let image = brut;
  let detouree = false;
  if (detourer) {
    const { data, info } = await sharp(image)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (aFondBlanc(data, info.width, info.height)) {
      const propre = retirerFondBlanc(data, info.width, info.height);
      image = await sharp(propre, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toBuffer();
      detouree = true;
    }
  }
  const avantMeta = await sharp(image).metadata();
  let recadree = image;
  let fill = 1;
  try {
    const trimmed = await sharp(image)
      .trim({ threshold: SEUIL_RECADRAGE })
      .png()
      .toBuffer({ resolveWithObject: true });
    recadree = trimmed.data;
    if (avantMeta.width && avantMeta.height) {
      fill = Math.max(
        trimmed.info.width / avantMeta.width,
        trimmed.info.height / avantMeta.height,
      );
    }
  } catch {
    // Image uniforme : garder telle quelle
  }
  const w300 = await sharp(recadree)
    .resize(300, 300, { fit: "inside", withoutEnlargement: true })
    .webp(OPTIONS_WEBP_AMIIBO)
    .toBuffer();
  const w600 = await sharp(recadree)
    .resize(600, 600, { fit: "inside", withoutEnlargement: true })
    .webp(OPTIONS_WEBP_AMIIBO)
    .toBuffer();
  return { w300, w600, detouree, fill };
}

// 1. Lire tous les amiibo en base par lots de 1 000
const amiibo = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("amiibo")
    .select("id, slug, identifiant, nom, type, image_path, verrous")
    .order("id")
    .range(de, de + 999);
  if (error) throw new Error(`amiibo : ${error.message}`);
  amiibo.push(...data);
  if (data.length < 1000) break;
}

const sourcesHauteRes = await chargerSourcesHauteRes();
console.log(
  `Amiibo en base : ${amiibo.length} | Sources HD chargées : ${sourcesHauteRes.size} | Mode : ${mode}${essai ? " (essai)" : ""}`,
);

let detoures = 0;
let optimises = 0;
let ignores = 0;
let octetsAvant = 0;
let octetsApres = 0;

for (const a of amiibo) {
  if (!a.image_path) {
    ignores++;
    continue;
  }
  const verrous = new Set(a.verrous ?? []);
  if (verrous.has("image_path")) {
    ignores++;
    continue;
  }

  const [b300Actuel, b600Actuel] = await Promise.all([
    telechargerBuffer(`${baseBucket}/${a.image_path}-300.webp`),
    telechargerBuffer(`${baseBucket}/${a.image_path}-600.webp`),
  ]);
  if (!b300Actuel || !b600Actuel) {
    console.warn(`  [manquant] ${a.slug} (${a.image_path})`);
    ignores++;
    continue;
  }

  const { data: rgbaActuel, info: infoActuel } = await sharp(b600Actuel)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blanc =
    doitDetourer(a.type) &&
    aFondBlanc(rgbaActuel, infoActuel.width, infoActuel.height);

  if (mode === "fond-blanc" && !blanc) continue;

  // Choisir la meilleure source sans recompression destructive quand possible
  let brut = b600Actuel;
  if (blanc) {
    const hd = sourcesHauteRes.get(a.identifiant);
    if (hd) {
      await attendre(1000); // une demande par seconde chez Nintendo
      const bufHd = await telechargerBuffer(hd);
      if (bufHd) brut = bufHd;
    }
  } else if (/^[0-9a-f]{16}$/.test(a.identifiant)) {
    const pngApi = await telechargerBuffer(imageAmiiboApi(a.identifiant));
    if (pngApi) brut = pngApi;
  }

  const { w300, w600, detouree, fill } = await preparerVariantes(
    brut,
    doitDetourer(a.type),
  );
  const poidsAvant = b300Actuel.length + b600Actuel.length;
  const poidsApres = w300.length + w600.length;
  const gain = (poidsAvant - poidsApres) / poidsAvant;

  // En mode « tous », ne remplacer un amiibo déjà transparent que s'il gagne >= 10 % ou retire >= 8 % de marges
  if (!blanc && gain < 0.1 && fill >= 0.92) continue;

  octetsAvant += poidsAvant;
  octetsApres += poidsApres;
  if (detouree) detoures++;
  else optimises++;

  const nouveauChemin = `${a.id}/figurine-${version}`;
  console.log(
    `  ${detouree ? "[fond blanc]" : "[optimisé] "} ${a.slug.padEnd(46)} ${(poidsAvant / 1024).toFixed(1)} -> ${(poidsApres / 1024).toFixed(1)} Ko${fill < 0.92 ? ` (marge ${(100 - fill * 100).toFixed(0)} %)` : ""}`,
  );

  if (essai) continue;

  for (const [taille, buf] of [
    [300, w300],
    [600, w600],
  ]) {
    const { error } = await supabase.storage
      .from("amiibo")
      .upload(`${nouveauChemin}-${taille}.webp`, buf, {
        contentType: "image/webp",
        upsert: true,
      });
    if (error)
      throw new Error(`${a.slug} (${taille}w) : ${error.message}`);
  }

  const { error: eDb } = await supabase
    .from("amiibo")
    .update({ image_path: nouveauChemin })
    .eq("id", a.id);
  if (eDb) throw new Error(`${a.slug} update : ${eDb.message}`);

  // Supprimer les anciens WebP pour ne laisser aucun fichier orphelin dans le bucket
  const { error: eSup } = await supabase.storage
    .from("amiibo")
    .remove([`${a.image_path}-300.webp`, `${a.image_path}-600.webp`]);
  if (eSup) console.warn(`  [nettoyage] ${a.slug} : ${eSup.message}`);
}

const koAvant = (octetsAvant / 1024).toFixed(1);
const koApres = (octetsApres / 1024).toFixed(1);
console.log(
  `\nTerminé : ${detoures} fond(s) blanc(s) retiré(s), ${optimises} image(s) optimisée(s), ${ignores} ignorée(s) · ${koAvant} -> ${koApres} Ko`,
);
