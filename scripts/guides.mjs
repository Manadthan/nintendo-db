// Guides japonais (étape 29, SPEC US-28, DESIGN ADR-19 point 6, 24/11/2026) : cherche les guides des jeux d'une console
// chez NDL Search, leurs couvertures chez Google Books, montre une planche numérotée, puis écrit les guides gardés.
// Depuis la session Claude (skill script-prod ; NDL et Google Books joints, clé Google ajoutée par le réseau) :
//   npm run session -- scripts/guides.mjs --console 3ds --planche /dossier    (recherche + planche, rien n'est écrit)
//   npm run session -- scripts/guides.mjs --ecrire /dossier --console 3ds      (écrit les guides de la planche)
//   npm run session -- scripts/guides.mjs --ecrire /dossier --console 3ds --sauf 3,17 (sans les n° 3 et 17, notés écartés)
//   … --limite 10                                                             (10 premiers jeux seulement, pour un essai)
// L'écriture relit le fichier guides-{console}.json déposé avec la planche : les numéros sont ceux qu'on a regardés.
// NDL refuse (429) les appels rapprochés : un appel toutes les 6 s (§1 septdecies) ; compter près d'une heure pour 120 jeux.
// Relancer la même commande après une coupure reprend la recherche (réponses gardées dans /dossier/cache).
// NDL refuse aussi parfois presque tout depuis la session (26/11/2026 : 2 h pour 31 jeux Switch 2) : la tâche GitHub
// « Guides NDL » lance la planche avec --deposer (guides-{console}.json et la planche dans le bucket privé gametdb,
// guides/), puis la session les reprend avant l'écriture :
//   npm run session -- scripts/guides.mjs --recuperer /dossier --console wii   (+ couvertures Google Books, planche refaite)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  JAPONAIS,
  adresseCouverture,
  dateNdl,
  idGoogleBooks,
  isbn13,
  jugerLivre,
  pagesNdl,
  fichierPlanche,
} from "../src/lib/guides/guides.ts";
import { lireNdl } from "../src/lib/guides/ndl.ts";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const option = (nom) => {
  const i = process.argv.indexOf(nom);
  return i > 0 ? process.argv[i + 1] : null;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "user-agent": "nintendo-db guides" };
// Clé Google Books : ajoutée par le réseau dans la session, passée par GOOGLE_BOOKS_CLE dans la tâche GitHub.
const entetes = (url) =>
  new URL(url).host === "www.googleapis.com" && process.env.GOOGLE_BOOKS_CLE
    ? { ...UA, "x-goog-api-key": process.env.GOOGLE_BOOKS_CLE }
    : UA;

/**
 * Réponses déjà lues (texte et JSON), gardées sur disque dans {dossier}/cache : si la session redémarre au milieu
 * d'une recherche (NDL impose 6 s entre deux appels, une console prend près d'une heure), la relance reprend sans
 * rappeler NDL ni Wikidata pour les jeux déjà vus (24/11/2026 : deux recherches 3DS perdues ainsi).
 */
let dossierCache = null;
const cheminCache = (url) =>
  join(dossierCache, createHash("sha1").update(url).digest("hex"));

/** Appel HTTP : 20 s au plus, 3 essais ; un 429 attend 60 s par essai. */
async function lire(url, type = "text", intervalle = 1000) {
  if (dossierCache && type !== "octets" && existsSync(cheminCache(url))) {
    const garde = readFileSync(cheminCache(url), "utf8");
    return type === "json" ? JSON.parse(garde) : garde;
  }
  const corps = await appeler(url, type, intervalle);
  if (dossierCache && type !== "octets" && corps !== null)
    writeFileSync(
      cheminCache(url),
      type === "json" ? JSON.stringify(corps) : corps,
    );
  return corps;
}

async function appeler(url, type, intervalle) {
  for (let essai = 1; essai <= 3; essai++) {
    await pause(intervalle);
    try {
      const r = await fetch(url, {
        headers: entetes(url),
        signal: AbortSignal.timeout(20000),
      });
      if (r.status === 429) {
        console.log(`429 ${new URL(url).host}, attente ${60 * essai} s`);
        await pause(60000 * essai);
        continue;
      }
      if (!r.ok) return null;
      return type === "json"
        ? await r.json()
        : type === "octets"
          ? Buffer.from(await r.arrayBuffer())
          : await r.text();
    } catch {
      if (essai === 3) return null;
    }
  }
  return null;
}

/** Tout lire d'une table (pages de 1 000 lignes). */
async function tout(table, colonnes, filtre = (q) => q) {
  let lignes = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await filtre(
      supabase.from(table).select(colonnes),
    ).range(de, de + 999);
    if (error) throw new Error(`${table} : ${error.message}`);
    lignes = lignes.concat(data);
    if (data.length < 1000) return lignes;
  }
}

/** Titres japonais de Wikidata (article japonais, libellé, P1476), sans les « 更新データ » et autres bruits. */
async function titresWikidata(jeu, titreUs) {
  const page =
    jeu.wikipedia_url ??
    (titreUs
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(titreUs.replace(/ /g, "_"))}`
      : null);
  if (!page) return [];
  const q = (await lire(page))?.match(/"wgWikibaseItemId":"(Q\d+)"/)?.[1];
  if (!q) return [];
  const e = (
    await lire(
      `https://www.wikidata.org/wiki/Special:EntityData/${q}.json`,
      "json",
    )
  )?.entities?.[q];
  return [
    e?.sitelinks?.jawiki?.title?.replace(/\s*[(（][^)）]*[)）]\s*$/, ""),
    e?.labels?.ja?.value,
    ...(e?.claims?.P1476 ?? [])
      .map((c) => c.mainsnak?.datavalue?.value)
      .filter((v) => v?.language === "ja")
      .map((v) => v.text),
  ].filter(
    (t) =>
      t &&
      JAPONAIS.test(t) &&
      t.length <= 40 &&
      !/更新データ|専用ソフト|シリーズ$/.test(t),
  );
}

// ——— 1. Recherche et planche ———
async function chercher(slugConsole, dossier, limite) {
  dossierCache = join(dossier, "cache");
  mkdirSync(dossierCache, { recursive: true });
  const consoles = await tout("consoles", "id, slug");
  const consoleId = consoles.find((c) => c.slug === slugConsole)?.id;
  if (!consoleId) throw new Error(`console inconnue : ${slugConsole}`);
  const jeux = await tout(
    "games",
    "id, slug, console_id, wikipedia_url, releases(region, sortie, titre, date_sortie)",
  );
  const titreJap = (j) =>
    j.releases.find((r) => r.region === "JAP" && r.sortie);
  const autresTitres = (jeu) =>
    jeux
      .filter((j) => j.id !== jeu.id)
      .map((j) => titreJap(j)?.titre)
      .filter((t) => t && JAPONAIS.test(t));
  const exclus = new Set(
    (await tout("guides_exclus", "isbn")).map((x) => x.isbn),
  );
  const cibles = jeux
    .filter((j) => j.console_id === consoleId && titreJap(j))
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, limite);
  console.log(
    `${cibles.length} jeux ${slugConsole} sortis au Japon ; ${exclus.size} guides déjà écartés`,
  );

  const parIsbn = new Map(); // isbn → guide trouvé (avec ses jeux)
  for (const [n, jeu] of cibles.entries()) {
    const jap = titreJap(jeu);
    const us =
      jeu.releases.find((r) => r.region === "US")?.titre ??
      jeu.releases.find((r) => r.region === "PAL")?.titre;
    const japonais = [
      ...new Set([
        ...(JAPONAIS.test(jap.titre) ? [jap.titre] : []),
        ...(await titresWikidata(jeu, us)),
      ]),
    ];
    const titres = [...japonais, ...(us ? [us] : [])];
    const recherches = [
      ...japonais.slice(0, 2),
      ...(us && us.length >= 5 ? [us] : []),
    ];
    const cherche = {
      console: slugConsole,
      titres,
      annee: Number(jap.date_sortie?.slice(0, 4)) || null,
    };
    for (const titre of recherches) {
      const xml = await lire(
        `https://ndlsearch.ndl.go.jp/api/opensearch?mediatype=books&cnt=50&title=${encodeURIComponent(titre)}`,
        "text",
        6000,
      );
      for (const l of lireNdl(xml ?? "")) {
        const isbn = isbn13(l.isbn);
        const date = dateNdl(l.parution);
        const verdict = jugerLivre(
          {
            titre: l.titre,
            isbn: l.isbn,
            annee: date ? Number(date.date.slice(0, 4)) : null,
            ndc: l.ndc,
          },
          cherche,
          autresTitres(jeu),
        );
        if (!verdict.garde || exclus.has(isbn)) continue;
        const g = parIsbn.get(isbn) ?? {
          isbn,
          titre: l.titre,
          editeur: l.editeur,
          date: date?.date ?? null,
          precision: date?.precision ?? null,
          pages: pagesNdl(l.pages),
          ndl_url: l.lien,
          jeux: [],
          google_books_id: null,
        };
        if (!g.jeux.some((x) => x.id === jeu.id))
          g.jeux.push({ id: jeu.id, slug: jeu.slug, par: verdict.par });
        parIsbn.set(isbn, g);
      }
    }
    if ((n + 1) % 10 === 0)
      console.log(`${n + 1}/${cibles.length} jeux, ${parIsbn.size} guides`);
  }

  const guides = [...parIsbn.values()].sort(
    (a, b) =>
      a.jeux[0].slug.localeCompare(b.jeux[0].slug) ||
      (a.date ?? "").localeCompare(b.date ?? ""),
  );
  if (!process.argv.includes("--sans-couvertures")) await couvertures(guides);
  mkdirSync(dossier, { recursive: true });
  const fichier = join(dossier, `guides-${slugConsole}.json`);
  writeFileSync(
    fichier,
    JSON.stringify(
      { console: slugConsole, cree_le: new Date().toISOString(), guides },
      null,
      1,
    ),
  );
  await planche(guides, join(dossier, `planche-${slugConsole}.jpg`));
  if (process.argv.includes("--deposer")) await deposer(dossier, slugConsole);
  console.log(
    `${guides.length} guides (${guides.filter((g) => g.google_books_id).length} avec couverture) → ${fichier}`,
  );
}

/**
 * Couvertures : un livre Google Books avec vignette, et une vraie image (pas la PNG « image not available »).
 * Pas dans la tâche GitHub (--sans-couvertures) : Google Books y refuse la clé (429, 26/11/2026, 5 h perdues) ;
 * la session les cherche en récupérant la planche.
 */
async function couvertures(guides) {
  for (const g of guides) {
    const id = idGoogleBooks(
      await lire(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${g.isbn}&country=JP`,
        "json",
      ),
    );
    const image = id ? await lire(adresseCouverture(id), "octets") : null;
    const meta = image
      ? await sharp(image)
          .metadata()
          .catch(() => null)
      : null;
    if (meta && meta.format !== "png" && meta.width >= 80)
      g.google_books_id = id;
  }
}

const echappe = (t) =>
  String(t ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );

/** Planche numérotée : couverture (ou vignette grise), n°, titre, éditeur et année, jeu rattaché. */
async function planche(guides, chemin) {
  const L = 200,
    H = 286,
    LEG = 74,
    COLS = 5;
  const couches = [];
  for (const [i, g] of guides.entries()) {
    const x = (i % COLS) * L,
      y = Math.floor(i / COLS) * (H + LEG);
    const octets = g.google_books_id
      ? await lire(adresseCouverture(g.google_books_id), "octets", 200)
      : null;
    const image = octets
      ? await sharp(octets)
          .resize(L - 8, H - 8, { fit: "contain", background: "#ffffff" })
          .toBuffer()
      : await sharp({
          create: {
            width: L - 8,
            height: H - 8,
            channels: 3,
            background: "#d9dde4",
          },
        })
          .png()
          .toBuffer();
    const texte = (t, n) => echappe(t.length > n ? `${t.slice(0, n)}…` : t);
    const legende =
      `<svg width="${L}" height="${LEG}"><rect width="100%" height="100%" fill="#ffffff"/>` +
      `<text x="4" y="16" font-size="15" font-weight="bold" font-family="WenQuanYi Zen Hei" fill="#b00">${i + 1}</text>` +
      `<text x="30" y="16" font-size="12" font-family="WenQuanYi Zen Hei">${texte(g.titre, 14)}</text>` +
      `<text x="4" y="36" font-size="11" font-family="WenQuanYi Zen Hei" fill="#444">${texte(`${g.editeur ?? "?"} · ${(g.date ?? "?").slice(0, 4)}`, 24)}</text>` +
      `<text x="4" y="56" font-size="11" font-family="WenQuanYi Zen Hei" fill="#2541b2">${texte(g.jeux.map((j) => j.slug + (j.par === "date" ? " (date)" : "")).join(", "), 30)}</text></svg>`;
    couches.push(
      { input: image, left: x + 4, top: y + 4 },
      { input: Buffer.from(legende), left: x, top: y + H },
    );
  }
  await sharp({
    create: {
      width: COLS * L,
      height: Math.max(1, Math.ceil(guides.length / COLS)) * (H + LEG),
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(couches)
    .jpeg({ quality: 80 })
    .toFile(chemin);
}

// Fichiers de la planche dans le bucket privé gametdb (tâche GitHub « Guides NDL ») et retour dans la session.
const fichiersPlanche = (c) => [
  [`guides-${c}.json`, "application/json"],
  [`planche-${c}.jpg`, "image/jpeg"],
];

async function deposer(dossier, slugConsole) {
  for (const [nom, type] of fichiersPlanche(slugConsole)) {
    const { error } = await supabase.storage
      .from("gametdb")
      .upload(`guides/${nom}`, readFileSync(join(dossier, nom)), {
        contentType: type,
        upsert: true,
      });
    if (error) throw new Error(`dépôt ${nom} : ${error.message}`);
  }
  console.log(`planche ${slugConsole} déposée dans gametdb/guides/`);
}

async function recuperer(dossier, slugConsole) {
  if (!slugConsole) throw new Error("--recuperer exige --console");
  mkdirSync(dossier, { recursive: true });
  for (const [nom] of fichiersPlanche(slugConsole)) {
    const { data, error } = await supabase.storage
      .from("gametdb")
      .download(`guides/${nom}`);
    if (error) throw new Error(`lecture ${nom} : ${error.message}`);
    writeFileSync(join(dossier, nom), Buffer.from(await data.arrayBuffer()));
  }
  // Couvertures cherchées ici, puis planche refaite avec elles (la tâche GitHub ne les cherche pas).
  const fichier = join(dossier, `guides-${slugConsole}.json`);
  const lu = JSON.parse(readFileSync(fichier, "utf8"));
  await couvertures(lu.guides);
  writeFileSync(fichier, JSON.stringify(lu, null, 1));
  await planche(lu.guides, join(dossier, `planche-${slugConsole}.jpg`));
  console.log(
    `planche ${slugConsole} récupérée dans ${dossier} : ${lu.guides.length} guides, ${lu.guides.filter((g) => g.google_books_id).length} avec couverture`,
  );
}

// ——— 2. Écriture des guides de la planche ———
async function ecrire(dossier, consoleDemandee, sauf) {
  const fichier = join(dossier, fichierPlanche(consoleDemandee, undefined));
  const { console: slugConsole, guides } = JSON.parse(
    readFileSync(fichier, "utf8"),
  );
  fichierPlanche(consoleDemandee, slugConsole);
  const existants = new Map(
    (await tout("guides", "id, isbn, verrous")).map((g) => [g.isbn, g]),
  );
  let ecrits = 0,
    ecartes = 0;
  for (const [i, g] of guides.entries()) {
    if (sauf.has(i + 1)) {
      const { error } = await supabase
        .from("guides_exclus")
        .upsert({ isbn: g.isbn, raison: `planche ${slugConsole} n° ${i + 1}` });
      if (error) throw new Error(`exclus ${g.isbn} : ${error.message}`);
      ecartes++;
      continue;
    }
    const verrous = new Set(existants.get(g.isbn)?.verrous ?? []);
    const champs = {
      titre: g.titre,
      editeur: g.editeur,
      date_parution: g.date,
      precision_date: g.precision,
      pages: g.pages,
      google_books_id: g.google_books_id,
      ndl_url: g.ndl_url,
    };
    if (verrous.has("date_parution")) {
      delete champs.date_parution;
      delete champs.precision_date;
    }
    for (const v of verrous) delete champs[v];
    const { data, error } = await supabase
      .from("guides")
      .upsert({ isbn: g.isbn, ...champs }, { onConflict: "isbn" })
      .select("id")
      .single();
    if (error) throw new Error(`guide ${g.isbn} : ${error.message}`);
    const liens = g.jeux.map((j) => ({ guide_id: data.id, game_id: j.id }));
    const { error: e2 } = await supabase.from("guides_jeux").upsert(liens, {
      onConflict: "guide_id,game_id",
      ignoreDuplicates: true,
    });
    if (e2) throw new Error(`liens ${g.isbn} : ${e2.message}`);
    ecrits++;
  }
  console.log(
    `${slugConsole} : ${ecrits} guides écrits, ${ecartes} écartés (guides_exclus)`,
  );
}

const dossierPlanche = option("--planche");
const dossierEcriture = option("--ecrire");
const dossierRecupere = option("--recuperer");
if (dossierRecupere)
  await recuperer(dossierRecupere, option("--console") ?? "");
else if (dossierPlanche)
  await chercher(
    option("--console") ?? "",
    dossierPlanche,
    Number(option("--limite")) || undefined,
  );
else if (dossierEcriture)
  await ecrire(
    dossierEcriture,
    option("--console") ?? "",
    new Set((option("--sauf") ?? "").split(",").filter(Boolean).map(Number)),
  );
else
  console.log(
    "--planche /dossier --console 3ds, ou --ecrire /dossier --console 3ds [--sauf n,n]",
  );
