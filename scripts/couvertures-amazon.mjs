// Couvertures des guides copiées depuis Amazon Japon (26/11/2026, SPEC v1.52 US-27, DESIGN ADR-19 point 2 révisé).
// Décision du propriétaire du 26/11 : Amazon pour tous les guides (plus grandes et plus nettes que Google Books, et
// présentes pour les 45 guides sans Google Books), copiées dans le bucket public `guides` ; risque des conditions
// d'Amazon accepté. Depuis la session Claude (skill script-prod ; hôte images-na.ssl-images-amazon.com joint) :
//   npm run session -- scripts/couvertures-amazon.mjs --planche /dossier          (téléchargement + planche, rien n'est écrit)
//   npm run session -- scripts/couvertures-amazon.mjs --ecrire /dossier           (écrit les couvertures de la planche)
//   npm run session -- scripts/couvertures-amazon.mjs --ecrire /dossier --sauf 3,17 (sans les n° 3 et 17)
//   … --planche /dossier --nouveaux   (seulement les guides encore sans couverture copiée : ajouts après le 26/11)
// L'écriture relit couvertures-amazon.json et les images déposées avec la planche : ce qu'on a regardé est ce qui est
// écrit. Un guide verrouillé (`verrous` contient « couverture ») n'est jamais touché. Amazon : une requête par seconde.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  adresseCouvertureAmazon,
  adressePageAmazon,
  cheminCouverture,
  estCouverture,
  extraireCouverturePageAmazon,
} from "../src/lib/guides/amazon.ts";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const option = (nom) => {
  const i = process.argv.indexOf(nom);
  return i > 0 ? process.argv[i + 1] : null;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const FICHIER = "couvertures-amazon.json";
const ENTETES_AMAZON = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "accept-language": "ja-JP,ja;q=0.9",
};

// La planche ne lit pas `couverture` : elle peut tourner avant la migration 0035 en production.
async function guides(colonnes = "isbn, titre, editeur, verrous") {
  let lignes = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("guides")
      .select(colonnes)
      .order("isbn")
      .range(de, de + 999);
    if (error) throw new Error(`lecture des guides : ${error.message}`);
    lignes = lignes.concat(data);
    if (data.length < 1000) return lignes;
  }
}

/** Télécharge la couverture Amazon : chemin rapide /images/P/, sinon secours via la fiche amazon.co.jp/dp/{ISBN10}. */
async function telechargerCouvertureAmazon(isbn, fichier) {
  const adresse = adresseCouvertureAmazon(isbn);
  if (!adresse) return { ok: false, raison: "ISBN 979" };
  const reponse = await fetch(adresse, {
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  await pause(500);
  if (reponse?.ok) {
    const octets = Buffer.from(await reponse.arrayBuffer());
    const taille = await sharp(octets)
      .metadata()
      .catch(() => ({}));
    if (estCouverture(taille)) {
      writeFileSync(fichier, octets);
      return { ok: true, taille };
    }
  }
  const page = adressePageAmazon(isbn);
  if (!page) return { ok: false, raison: "pas de couverture" };
  const rPage = await fetch(page, {
    headers: ENTETES_AMAZON,
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  await pause(900);
  if (!rPage?.ok) {
    return {
      ok: false,
      raison: rPage ? `page HTTP ${rPage.status}` : "page injoignable",
    };
  }
  const urlImage = extraireCouverturePageAmazon(await rPage.text());
  if (!urlImage) return { ok: false, raison: "pas de couverture" };
  const rImg = await fetch(urlImage, {
    headers: ENTETES_AMAZON,
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!rImg?.ok) return { ok: false, raison: "image fiche injoignable" };
  const octets = Buffer.from(await rImg.arrayBuffer());
  const taille = await sharp(octets)
    .metadata()
    .catch(() => ({}));
  if (!estCouverture(taille)) return { ok: false, raison: "pas de couverture" };
  writeFileSync(fichier, octets);
  return { ok: true, taille };
}

// ——— 1. Téléchargement et planche (lecture seule) ———
async function preparer(dossier, limite) {
  mkdirSync(join(dossier, "amazon"), { recursive: true });
  const nouveaux = process.argv.includes("--nouveaux");
  const tous = (
    await guides(
      `isbn, titre, editeur, verrous${nouveaux ? ", couverture" : ""}`,
    )
  ).filter((g) => !nouveaux || !g.couverture);
  const retenus = [];
  const sans = [];
  let verrouilles = 0;
  for (const g of tous.slice(0, limite ?? tous.length)) {
    if (g.verrous.includes("couverture")) {
      verrouilles++;
      continue;
    }
    const fichier = join(dossier, "amazon", `${g.isbn}.jpg`);
    let taille;
    if (existsSync(fichier)) {
      taille = await sharp(fichier)
        .metadata()
        .catch(() => ({}));
    }
    if (!estCouverture(taille ?? {})) {
      const res = await telechargerCouvertureAmazon(g.isbn, fichier);
      if (!res.ok) {
        sans.push(`${g.isbn} (${res.raison})`);
        continue;
      }
      taille = res.taille;
    }
    retenus.push({
      isbn: g.isbn,
      titre: g.titre,
      editeur: g.editeur,
      taille: `${taille.width}×${taille.height}`,
    });
  }
  writeFileSync(
    join(dossier, FICHIER),
    JSON.stringify({ guides: retenus }, null, 1),
  );
  await planche(dossier, retenus);
  console.log(
    `${retenus.length} couverture(s) Amazon ; ${sans.length} guide(s) sans ; ${verrouilles} verrouillé(s)`,
  );
  for (const s of sans) console.log(`  sans : ${s}`);
  console.log(`planche : ${join(dossier, "planche-amazon.jpg")}`);
}

const echappe = (t) =>
  t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

/** Planche numérotée : couverture, n°, taille, début du titre. */
async function planche(dossier, retenus) {
  const L = 200,
    H = 286,
    LEG = 56,
    COLS = 6;
  const couches = [];
  for (const [i, g] of retenus.entries()) {
    const x = (i % COLS) * L,
      y = Math.floor(i / COLS) * (H + LEG);
    const image = await sharp(join(dossier, "amazon", `${g.isbn}.jpg`))
      .resize(L - 8, H - 8, { fit: "contain", background: "#ffffff" })
      .toBuffer();
    const legende =
      `<svg width="${L}" height="${LEG}"><rect width="100%" height="100%" fill="#ffffff"/>` +
      `<text x="4" y="17" font-size="15" font-weight="bold" font-family="WenQuanYi Zen Hei" fill="#b00">${i + 1}</text>` +
      `<text x="40" y="17" font-size="12" font-family="WenQuanYi Zen Hei" fill="#444">${g.taille}</text>` +
      `<text x="4" y="38" font-size="12" font-family="WenQuanYi Zen Hei">${echappe(g.titre.slice(0, 15))}</text></svg>`;
    couches.push(
      { input: image, left: x + 4, top: y + 4 },
      { input: Buffer.from(legende), left: x, top: y + H },
    );
  }
  await sharp({
    create: {
      width: COLS * L,
      height: Math.max(1, Math.ceil(retenus.length / COLS)) * (H + LEG),
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(couches)
    .jpeg({ quality: 80 })
    .toFile(join(dossier, "planche-amazon.jpg"));
}

// ——— 2. Écriture des couvertures de la planche ———
async function ecrire(dossier, sauf) {
  const { guides: retenus } = JSON.parse(
    readFileSync(join(dossier, FICHIER), "utf8"),
  );
  const actuels = new Map(
    (await guides("isbn, couverture, verrous")).map((g) => [g.isbn, g]),
  );
  let ecrites = 0;
  const ignores = [];
  for (const [i, g] of retenus.entries()) {
    const actuel = actuels.get(g.isbn);
    if (sauf.has(i + 1)) {
      ignores.push(`n° ${i + 1} ${g.isbn} : écarté sur la planche`);
      continue;
    }
    if (!actuel) {
      ignores.push(`n° ${i + 1} ${g.isbn} : guide absent de la base`);
      continue;
    }
    if (actuel.verrous.includes("couverture")) {
      ignores.push(`n° ${i + 1} ${g.isbn} : verrouillé`);
      continue;
    }
    // Conversion WebP 82, bornée à 768 px de large (les fiches Amazon Japon montent jusqu'à 1920 px).
    const webp = await sharp(join(dossier, "amazon", `${g.isbn}.jpg`))
      .rotate()
      .resize({ width: 768, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const chemin = cheminCouverture(g.isbn, actuel.couverture);
    const { error: e1 } = await supabase.storage
      .from("guides")
      .upload(chemin, webp, { contentType: "image/webp", upsert: true });
    if (e1) throw new Error(`dépôt ${chemin} : ${e1.message}`);
    const { error: e2 } = await supabase
      .from("guides")
      .update({ couverture: chemin })
      .eq("isbn", g.isbn);
    if (e2) throw new Error(`guide ${g.isbn} : ${e2.message}`);
    if (actuel.couverture) {
      const { error: e3 } = await supabase.storage
        .from("guides")
        .remove([actuel.couverture]);
      if (e3)
        console.log(`  ancienne ${actuel.couverture} gardée : ${e3.message}`);
    }
    ecrites++;
  }
  console.log(
    `${ecrites} couverture(s) écrite(s) ; ${ignores.length} ignorée(s)`,
  );
  for (const s of ignores) console.log(`  ${s}`);
}

const dossierPlanche = option("--planche");
const dossierEcriture = option("--ecrire");
if (dossierPlanche)
  await preparer(dossierPlanche, Number(option("--limite")) || undefined);
else if (dossierEcriture)
  await ecrire(
    dossierEcriture,
    new Set((option("--sauf") ?? "").split(",").filter(Boolean).map(Number)),
  );
else console.log("--planche /dossier, ou --ecrire /dossier [--sauf n,n]");
