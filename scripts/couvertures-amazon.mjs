// Couvertures des guides copiées depuis Amazon Japon (26/11/2026, SPEC v1.52 US-27, DESIGN ADR-19 point 2 révisé).
// Décision du propriétaire du 26/11 : Amazon pour tous les guides (plus grandes et plus nettes que Google Books, et
// présentes pour les 45 guides sans Google Books), copiées dans le bucket public `guides` ; risque des conditions
// d'Amazon accepté. Depuis la session Claude (skill script-prod ; hôte images-na.ssl-images-amazon.com joint) :
//   npm run session -- scripts/couvertures-amazon.mjs --planche /dossier          (téléchargement + planche, rien n'est écrit)
//   npm run session -- scripts/couvertures-amazon.mjs --ecrire /dossier           (écrit les couvertures de la planche)
//   npm run session -- scripts/couvertures-amazon.mjs --ecrire /dossier --sauf 3,17 (sans les n° 3 et 17)
// L'écriture relit couvertures-amazon.json et les images déposées avec la planche : ce qu'on a regardé est ce qui est
// écrit. Un guide verrouillé (`verrous` contient « couverture ») n'est jamais touché. Amazon : une requête par seconde.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  adresseCouvertureAmazon,
  cheminCouverture,
  estCouverture,
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

// La planche ne lit pas `couverture` : elle peut tourner avant la migration 0035 en production.
async function guides(colonnes = "isbn, titre, editeur, verrous") {
  const { data, error } = await supabase
    .from("guides")
    .select(colonnes)
    .order("isbn");
  if (error) throw new Error(`lecture des guides : ${error.message}`);
  return data;
}

// ——— 1. Téléchargement et planche (lecture seule) ———
async function preparer(dossier, limite) {
  mkdirSync(join(dossier, "amazon"), { recursive: true });
  const tous = await guides();
  const retenus = [];
  const sans = [];
  let verrouilles = 0;
  for (const g of tous.slice(0, limite ?? tous.length)) {
    if (g.verrous.includes("couverture")) {
      verrouilles++;
      continue;
    }
    const adresse = adresseCouvertureAmazon(g.isbn);
    const fichier = join(dossier, "amazon", `${g.isbn}.jpg`);
    if (!adresse) {
      sans.push(`${g.isbn} (ISBN 979)`);
      continue;
    }
    if (!existsSync(fichier)) {
      const reponse = await fetch(adresse);
      const octets = Buffer.from(await reponse.arrayBuffer());
      await pause(1000);
      if (!reponse.ok) {
        sans.push(`${g.isbn} (HTTP ${reponse.status})`);
        continue;
      }
      writeFileSync(fichier, octets);
    }
    const taille = await sharp(fichier)
      .metadata()
      .catch(() => ({}));
    if (!estCouverture(taille)) {
      sans.push(`${g.isbn} (pas de couverture)`);
      continue;
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
    // Même conversion que les jaquettes (WebP 82), à la taille d'origine : Amazon ne donne pas plus grand.
    const webp = await sharp(join(dossier, "amazon", `${g.isbn}.jpg`))
      .rotate()
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
