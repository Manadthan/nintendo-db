// Amiibo (étape 30, SPEC US-31, DESIGN ADR-21 point 4, 25/11/2026) : tous les amiibo, depuis la session Claude
// (skill script-prod). Décision du propriétaire : planche regardée d'abord, écriture ensuite.
//   npm run session -- scripts/amiibo.mjs --planche /dossier
//       lit AmiiboAPI (GitHub), Nintendo US, Europe et Japon, fusionne (src/lib/amiibo/amiibo.ts), rattache les jeux
//       compatibles au catalogue ; écrit /dossier/amiibo.json, une planche JPEG par série (60 amiibo par planche) et
//       /dossier/jeux.md (jeux compatibles de chaque numéro). Rien n'est écrit en base.
//   npm run session -- scripts/amiibo.mjs --ecrire /dossier --sauf 3,17 --sans-jeu 5:Animal Crossing: New Horizons
//       écrit les amiibo gardés (images WebP 300 / 600 dans le bucket amiibo, sorties, jeux) ; les numéros écartés vont
//       dans amiibo_exclus ; --sans-jeu n:titre retire une ligne de jeu fausse (plusieurs, séparées par « | »).
// Relancer ne crée pas de doublon (identifiant unique) et respecte les verrous (champs corrigés à la main).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  attribuerSlugs,
  completerAvecEurope,
  completerAvecJapon,
  completerAvecUs,
  lireAmiiboApi,
  rattacherJeux,
} from "../src/lib/amiibo/amiibo.ts";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const option = (nom) => {
  const i = process.argv.indexOf(nom);
  return i > 0 ? process.argv[i + 1] : null;
};
const planche = option("--planche");
const dossierEcriture = option("--ecrire");
if (!planche && !dossierEcriture)
  throw new Error("--planche /dossier ou --ecrire /dossier");
const sauf = new Set(
  (option("--sauf") ?? "").split(",").filter(Boolean).map(Number),
);
const sansJeu = (option("--sans-jeu") ?? "")
  .split("|")
  .filter(Boolean)
  .map((x) => {
    const [n, ...titre] = x.split(":");
    return { n: Number(n), titre: titre.join(":").trim() };
  });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const json = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
  return r.json();
};

// --- 1. Planche -------------------------------------------------------------------------------------------------
if (planche) {
  mkdirSync(join(planche, "images"), { recursive: true });
  const BRUT =
    "https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/database";
  const base = await json(`${BRUT}/amiibo.json`);
  const jeuxApi = await json(`${BRUT}/games_info.json`);
  await attendre(1000);
  const page = await (
    await fetch("https://www.nintendo.com/us/amiibo/line-up/")
  ).text();
  const donnees = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s.exec(
    page,
  )?.[1];
  if (!donnees)
    throw new Error("Nintendo US : données de la page introuvables");
  const us = JSON.parse(donnees).props.pageProps.page.amiibos;
  await attendre(1000);
  const europe = (
    await json(
      "https://searching.nintendo-europe.com/en/select?wt=json&q=*&fq=type:FIGURE&rows=1000&sort=date_from%20desc",
    )
  ).response.docs;
  await attendre(1000);
  const japon = (
    await json(
      "https://search.nintendo.jp/nintendo_soft/search.json?opt_hard=9_amiibo&limit=300&page=1&opt_sshow=1",
    )
  ).result.items;
  console.log(
    `Sources : AmiiboAPI ${Object.keys(base.amiibos).length}, US ${us.length}, Europe ${europe.length}, Japon ${japon.length}`,
  );

  let amiibo = completerAvecJapon(
    completerAvecEurope(
      completerAvecUs(lireAmiiboApi(base, jeuxApi), us),
      europe,
    ),
    japon,
  );
  const { data: exclus, error: eEx } = await supabase
    .from("amiibo_exclus")
    .select("identifiant");
  if (eEx) throw new Error(`amiibo_exclus : ${eEx.message}`);
  const ecartes = new Set(exclus.map((x) => x.identifiant));
  amiibo = amiibo.filter((a) => !ecartes.has(a.identifiant));

  // Catalogue : titres des 3 régions de chaque jeu, par lots de 1 000.
  const catalogue = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("games")
      .select("id, consoles!inner(slug), releases(titre)")
      .order("id")
      .range(de, de + 999);
    if (error) throw new Error(`games : ${error.message}`);
    for (const j of data)
      catalogue.push({
        id: j.id,
        console: j.consoles.slug,
        titres: j.releases.map((r) => r.titre).filter(Boolean),
      });
    if (data.length < 1000) break;
  }
  const slugs = attribuerSlugs(amiibo);
  const ordre = (a) => `${a.serieAmiibo}\u0000${a.type}\u0000${a.nom}`;
  const liste = amiibo
    .sort((a, b) => ordre(a).localeCompare(ordre(b)))
    .map((a, i) => ({
      n: i + 1,
      slug: slugs.get(a.identifiant),
      ...a,
      jeux: rattacherJeux(a.jeux, catalogue),
    }));
  writeFileSync(join(planche, "amiibo.json"), JSON.stringify(liste, null, 1));

  // Jeux compatibles en texte : à relire pour repérer les lignes fausses (--sans-jeu).
  const md = liste.map(
    (a) =>
      `## ${a.n}. ${a.nom} (${a.serieAmiibo})\n` +
      a.jeux
        .map(
          (j) =>
            `- ${j.gameId ? "✓" : "·"} ${j.titre} (${j.console})${j.usage ? ` : ${j.usage}` : ""}`,
        )
        .join("\n"),
  );
  writeFileSync(join(planche, "jeux.md"), md.join("\n\n"));

  // Images (cache local), une à la fois, une demande par seconde pour les sites de Nintendo.
  const L = 200,
    IMG = 170,
    LEG = 52,
    COLS = 6,
    PAR_PLANCHE = 60;
  const echappe = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const vide = () =>
    sharp({
      create: { width: IMG, height: IMG, channels: 3, background: "#cc3333" },
    })
      .png()
      .toBuffer();
  const vignette = async (a) => {
    const fichier = join(planche, "images", `${a.slug}.png`);
    if (!existsSync(fichier)) {
      if (!a.image) return vide();
      if (!a.image.includes("githubusercontent")) await attendre(1000);
      const r = await fetch(a.image).catch(() => null);
      if (!r?.ok) return vide();
      writeFileSync(fichier, Buffer.from(await r.arrayBuffer()));
    }
    return sharp(fichier)
      .resize(IMG, IMG, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
  };
  const dates = (a) =>
    ["JAP", "US", "PAL"]
      .map((r) => {
        const s = a.sorties.find((x) => x.region === r);
        return `${r[0]} ${s ? (s.precision === "annee" ? s.date.slice(0, 4) : s.date.slice(2)) : "—"}`;
      })
      .join("  ");
  const series = [
    ...new Set(liste.map((a) => a.serieAmiibo || "(sans série)")),
  ];
  for (const serie of series) {
    const membres = liste.filter(
      (a) => (a.serieAmiibo || "(sans série)") === serie,
    );
    for (let p = 0; p < membres.length; p += PAR_PLANCHE) {
      const lot = membres.slice(p, p + PAR_PLANCHE);
      const couches = [];
      for (const [k, a] of lot.entries()) {
        const x = (k % COLS) * L,
          y = Math.floor(k / COLS) * (IMG + LEG);
        couches.push({
          input: await vignette(a),
          left: x + (L - IMG) / 2,
          top: y,
        });
        const lies = a.jeux.filter((j) => j.gameId).length;
        const l1 = `${a.n}. ${a.nom}`.slice(0, 30);
        const l2 = `${a.type}${a.editeur !== "Nintendo" ? ` · ${a.editeur}` : ""}${a.boite ? " · boîte" : ""} · jeux ${lies}/${a.jeux.length}`;
        couches.push({
          input: Buffer.from(
            `<svg width="${L}" height="${LEG}"><text x="3" y="14" font-size="12" font-family="sans-serif" font-weight="bold" fill="${a.origine === "amiiboapi" ? "#000" : "#b00"}">${echappe(l1)}</text>` +
              `<text x="3" y="30" font-size="10" font-family="sans-serif" fill="#444">${echappe(l2.slice(0, 38))}</text>` +
              `<text x="3" y="45" font-size="10" font-family="sans-serif" fill="#444">${echappe(dates(a))}</text></svg>`,
          ),
          left: x,
          top: y + IMG,
        });
      }
      const nom = `${
        serie
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "sans-serie"
      }${membres.length > PAR_PLANCHE ? `-${p / PAR_PLANCHE + 1}` : ""}`;
      const fichier = join(planche, `amiibo-${nom}.jpg`);
      await sharp({
        create: {
          width: COLS * L,
          height: Math.ceil(lot.length / COLS) * (IMG + LEG),
          channels: 3,
          background: "#ffffff",
        },
      })
        .composite(couches)
        .jpeg({ quality: 78 })
        .toFile(fichier);
      console.log(`Planche ${fichier} : n° ${lot[0].n} à ${lot.at(-1).n}`);
    }
  }
  const sansImage = liste.filter((a) => !a.image).length;
  const sansJap = liste.filter(
    (a) => !a.sorties.some((s) => s.region === "JAP"),
  ).length;
  console.log(
    `${liste.length} amiibo (${liste.filter((a) => a.origine !== "amiiboapi").length} hors AmiiboAPI, en rouge) ; ` +
      `${sansImage} sans image ; ${sansJap} sans date JAP ; ${liste.filter((a) => a.boite).length} avec boîte ; ` +
      `jeux rattachés ${liste.reduce((t, a) => t + a.jeux.filter((j) => j.gameId).length, 0)} / ${liste.reduce((t, a) => t + a.jeux.length, 0)}`,
  );
  process.exit(0);
}

// --- 2. Écriture ------------------------------------------------------------------------------------------------
const liste = JSON.parse(
  readFileSync(join(dossierEcriture, "amiibo.json"), "utf8"),
);
const version = Date.now().toString(36);
const envoyer = async (id, nom, source) => {
  const r = await fetch(source);
  if (!r.ok) throw new Error(`${source} : HTTP ${r.status}`);
  const brut = Buffer.from(await r.arrayBuffer());
  for (const taille of [300, 600]) {
    const webp = await sharp(brut)
      .resize(taille, taille, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const chemin = `${id}/${nom}-${version}-${taille}.webp`;
    const { error } = await supabase.storage
      .from("amiibo")
      .upload(chemin, webp, { contentType: "image/webp", upsert: true });
    if (error) throw new Error(`${chemin} : ${error.message}`);
  }
  return `${id}/${nom}-${version}`;
};

let ecrits = 0,
  exclusAjoutes = 0;
const ignores = [];
for (const a of liste) {
  if (sauf.has(a.n)) {
    const { error } = await supabase
      .from("amiibo_exclus")
      .upsert({ identifiant: a.identifiant, raison: `planche n° ${a.n}` });
    if (error) throw new Error(`exclus ${a.n} : ${error.message}`);
    exclusAjoutes++;
    continue;
  }
  const { data: existant, error: eLu } = await supabase
    .from("amiibo")
    .select("id, verrous, image_path, boite_path")
    .eq("identifiant", a.identifiant)
    .maybeSingle();
  if (eLu) throw new Error(`${a.n} : ${eLu.message}`);
  const verrous = new Set(existant?.verrous ?? []);
  const champs = {
    slug: a.slug,
    nom: a.nom,
    nom_jap: a.nomJap,
    type: a.type,
    serie_amiibo: a.serieAmiibo || null,
    serie_jeux: a.serieJeux,
    personnage: a.personnage,
    editeur: a.editeur,
  };
  for (const v of verrous) delete champs[v];
  const { data: ligne, error: eEc } = existant
    ? await supabase
        .from("amiibo")
        .update(champs)
        .eq("id", existant.id)
        .select("id")
        .single()
    : await supabase
        .from("amiibo")
        .insert({ identifiant: a.identifiant, ...champs })
        .select("id")
        .single();
  if (eEc) throw new Error(`${a.n} ${a.nom} : ${eEc.message}`);
  const id = ligne.id;

  // Images : seulement si elles manquent (relancer ne recopie rien) et ne sont pas verrouillées.
  const images = {};
  try {
    if (a.image && !existant?.image_path && !verrous.has("image_path"))
      images.image_path = await envoyer(id, "figurine", a.image);
    if (a.boite && !existant?.boite_path && !verrous.has("boite_path"))
      images.boite_path = await envoyer(id, "boite", a.boite);
  } catch (e) {
    ignores.push(`${a.n}. ${a.nom} : image non copiée (${e.message})`);
  }
  if (Object.keys(images).length) {
    const { error } = await supabase.from("amiibo").update(images).eq("id", id);
    if (error) throw new Error(`${a.n} images : ${error.message}`);
  }

  if (!verrous.has("sorties")) {
    const { error: e1 } = await supabase
      .from("amiibo_sorties")
      .delete()
      .eq("amiibo_id", id);
    if (e1) throw new Error(`${a.n} sorties : ${e1.message}`);
    if (a.sorties.length) {
      const { error: e2 } = await supabase
        .from("amiibo_sorties")
        .insert(
          a.sorties.map((s) => ({
            amiibo_id: id,
            region: s.region,
            date_sortie: s.date,
            precision_date: s.precision,
          })),
        );
      if (e2) throw new Error(`${a.n} sorties : ${e2.message}`);
    }
  }
  if (!verrous.has("jeux")) {
    const retires = new Set(
      sansJeu.filter((x) => x.n === a.n).map((x) => x.titre),
    );
    const jeux = a.jeux.filter((j) => !retires.has(j.titre));
    const { error: e1 } = await supabase
      .from("amiibo_jeux")
      .delete()
      .eq("amiibo_id", id);
    if (e1) throw new Error(`${a.n} jeux : ${e1.message}`);
    const uniques = [
      ...new Map(jeux.map((j) => [`${j.titre}\u0000${j.console}`, j])).values(),
    ];
    if (uniques.length) {
      const { error: e2 } = await supabase
        .from("amiibo_jeux")
        .insert(
          uniques.map((j) => ({
            amiibo_id: id,
            game_id: j.gameId,
            titre_jeu: j.titre,
            console: j.console,
            usage: j.usage,
          })),
        );
      if (e2) throw new Error(`${a.n} jeux : ${e2.message}`);
    }
  }
  ecrits++;
  if (ecrits % 50 === 0) console.log(`… ${ecrits} amiibo écrits`);
}
console.log(
  `${ecrits} amiibo écrit(s) ; ${exclusAjoutes} écarté(s) (amiibo_exclus) ; ${ignores.length} remarque(s)`,
);
for (const x of ignores) console.log(`  ${x}`);
