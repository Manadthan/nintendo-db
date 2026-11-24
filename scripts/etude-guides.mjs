// Étude des guides japonais (étape 29, intention v1.6 décision 10) : combien de nos jeux rétro ont un guide (攻略本)
// trouvable, avec quels champs, et avec quelle couverture ? LECTURE SEULE : rien n'est écrit dans la base.
// La session Claude ne joint aucune de ces sources : tâche GitHub « Étude guides ».
// v2 (24/11/2026, après le 1er passage) : le titre JAP du catalogue rétro est en lettres latines (« Mega Man 3 » et non
// « ロックマン3 ») ; le vrai titre japonais vient donc de Wikidata (page Wikipédia du jeu → élément → article japonais
// et libellé japonais). NDL a répondu 429 à 1 requête par seconde : une toutes les 3 s, réessais espacés.
// Sources, sans clé :
//  - NDL Search (Bibliothèque nationale de la Diète, dépôt légal) : API OpenSearch, titre, éditeur, date, ISBN, pages ;
//  - openBD et vignette NDL : couverture par ISBN ;
//  - Internet Archive, collection « strategyguides » (scans).
// Un livre est un guide du jeu si : c'est un guide (NDC 798 ou mot « 攻略 », « ガイド »…), son titre contient un titre
// japonais du jeu non suivi d'un chiffre (« スーパーマリオブラザーズ » ne prend pas « …3 »), il ne cite pas une autre
// console (« 3DS », « スーパーファミコン » pour un jeu Famicom…) et, s'il n'en cite aucune, il paraît dans les 4 ans.
import { appendFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const manquants = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter(
  (n) => !env[n],
);
if (manquants.length)
  throw new Error(`Variables manquantes : ${manquants.join(", ")}`);
const PAR_CONSOLE = Number(env.ETUDE_PAR_CONSOLE || 20);
const CONSOLES = (env.ETUDE_CONSOLES || "nes,snes,n64,gb,gbc")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Forme comparable d'un titre japonais : NFKC, sans espaces ni ponctuation, minuscules. */
const compact = (t) =>
  (t ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s・:：!！?？、。.,'’"“”\-－~〜()（）「」『』【】&＆/]+/g, "");
const JAPONAIS = /[぀-ヿ一-鿿]/;
const MOTS_GUIDE =
  /攻略|ガイド|必勝|完全|大百科|大全|公式|マニュアル|ブック|ヒント|裏技|ウルテク|秘技|テクニック/;
/** Consoles citées dans un titre de livre ; l'ordre compte (« スーパーファミコン » retiré avant « ファミコン »). */
const MARQUES = [
  ["snes", /スーパーファミコン|スーファミ|super\s*famicom|\bsfc\b/gi],
  ["gbc", /ゲームボーイカラー|\bgbc\b/gi],
  ["gba", /ゲームボーイアドバンス|アドバンス|\bgba\b/gi],
  ["gb", /ゲームボーイ|game\s*boy|\bgb\b/gi],
  ["nes", /ファミリーコンピュータ|ファミコン|famicom|\bfc\b/gi],
  ["n64", /ニンテンドウ64|ニンテンドー64|nintendo\s*64|\bn64\b|\b64\b/gi],
  ["3ds", /\b3ds\b/gi],
  ["ds", /\bds\b/gi],
  ["wii", /wii/gi],
  ["switch", /switch|スイッチ/gi],
  ["gamecube", /ゲームキューブ|gamecube/gi],
  [
    "autre",
    /プレイステーション|playstation|\bps\d\b|セガ|メガドライブ|サターン|pcエンジン/gi,
  ],
];
function consolesCitees(titreLivre, titresJeu) {
  let t = (titreLivre ?? "").normalize("NFKC");
  for (const j of titresJeu) t = t.split(j.normalize("NFKC")).join(" "); // « スーパーマリオ64 » ne cite pas la N64
  const citees = new Set();
  for (const [c, re] of MARQUES) {
    re.lastIndex = 0;
    if (re.test(t)) {
      citees.add(c);
      t = t.replace(re, " ");
    }
  }
  return citees;
}

let appels = 0;
const refus = {}; // nombre de 429 par hôte
async function lire(url, type = "text", intervalle = 1000) {
  for (let essai = 1; essai <= 3; essai++) {
    await pause(intervalle);
    appels++;
    try {
      const r = await fetch(url, {
        headers: { "user-agent": "nintendo-db etude-guides (lecture seule)" },
      });
      if (r.status === 429) {
        const hote = new URL(url).host;
        refus[hote] = (refus[hote] ?? 0) + 1;
        await pause(20000 * essai);
        continue;
      }
      if (!r.ok) return { erreur: `HTTP ${r.status}`, statut: r.status };
      if (type === "statut")
        return {
          statut: r.status,
          type: r.headers.get("content-type"),
          octets: (await r.arrayBuffer()).byteLength,
        };
      return { corps: type === "json" ? await r.json() : await r.text() };
    } catch (e) {
      if (essai === 3) return { erreur: e.message };
    }
  }
  return { erreur: "HTTP 429" };
}

/** Titres japonais d'un jeu : article japonais et libellé japonais de son élément Wikidata. */
async function titresJaponais(jeu, titreAnglais) {
  const page =
    jeu.wikipedia_url ??
    (titreAnglais
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(titreAnglais.replace(/ /g, "_"))}`
      : null);
  if (!page) return { titres: [], wikidata: null };
  const html = await lire(page);
  const q = html.corps?.match(/"wgWikibaseItemId":"(Q\d+)"/)?.[1];
  if (!q) return { titres: [], wikidata: null };
  const ent = await lire(
    `https://www.wikidata.org/wiki/Special:EntityData/${q}.json`,
    "json",
  );
  const e =
    ent.corps?.entities?.[q] ?? Object.values(ent.corps?.entities ?? {})[0];
  const brut = [
    e?.sitelinks?.jawiki?.title?.replace(/\s*[(（][^)）]*[)）]\s*$/, ""), // « ゼルダの伝説 (ゲーム) » → « ゼルダの伝説 »
    e?.labels?.ja?.value,
    ...(e?.claims?.P1476 ?? [])
      .map((c) => c.mainsnak?.datavalue?.value)
      .filter((v) => v?.language === "ja")
      .map((v) => v.text),
  ];
  return {
    titres: [...new Set(brut.filter((t) => t && JAPONAIS.test(t)))],
    wikidata: q,
  };
}

/** Livres NDL d'une réponse OpenSearch (RSS). */
function livresNdl(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("item")
    .toArray()
    .map((item) => {
      const i = $(item);
      const champ = (sel) => i.find(sel).first().text().trim() || null;
      const parType = (sel, re) =>
        i
          .find(sel)
          .toArray()
          .map((e) => $(e))
          .filter((e) => re.test(e.attr("xsi:type") ?? ""))
          .map((e) => e.text().trim());
      return {
        titre: champ("dc\\:title") ?? champ("title"),
        editeur: champ("dc\\:publisher"),
        date: champ("dcterms\\:issued") ?? champ("dc\\:date"),
        isbn: parType("dc\\:identifier", /ISBN/)[0]?.replace(/-/g, "") ?? null,
        pages: champ("dc\\:extent"),
        ndc: parType("dc\\:subject", /NDC/),
        lien: champ("link"),
      };
    });
}

// 1. Échantillon : jeux rétro sortis au Japon.
let lignes = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select(
      "slug, metacritic_note, wikipedia_url, consoles!inner(slug), releases(region, sortie, titre, titre_romanise, date_sortie)",
    )
    .in("consoles.slug", CONSOLES)
    .order("slug")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  lignes = lignes.concat(data);
  if (data.length < 1000) break;
}
const jap = (j) => j.releases.find((r) => r.region === "JAP" && r.sortie);
const parConsole = {};
for (const j of lignes)
  if (jap(j)) (parConsole[j.consoles.slug] ??= []).push(j);
const echantillon = [];
for (const console_ of CONSOLES) {
  const jeux = parConsole[console_] ?? [];
  const note = [...jeux].sort(
    (a, b) => (b.metacritic_note ?? -1) - (a.metacritic_note ?? -1),
  )[0];
  const inverse = (s) => s.split("").reverse().join("");
  const autres = jeux
    .filter((j) => j !== note)
    .sort((a, b) => inverse(a.slug).localeCompare(inverse(b.slug)));
  for (const j of [note, ...autres].filter(Boolean).slice(0, PAR_CONSOLE))
    echantillon.push({ console: console_, jeu: j });
}
const sansJap = lignes.filter((j) => !jap(j)).length;
const titreJapLatin = lignes.filter(
  (j) => jap(j) && !JAPONAIS.test(jap(j).titre ?? ""),
).length;
console.log(
  `${lignes.length} jeux rétro, ${sansJap} sans sortie japonaise, ${titreJapLatin} au titre JAP en lettres latines`,
);

// 2. Recherche par jeu.
const details = [];
const brutes = []; // 2 réponses NDL et 1 Internet Archive, pour écrire les fixtures des tests plus tard
for (const { console: slugConsole, jeu } of echantillon) {
  const r = jap(jeu);
  const titreUs =
    jeu.releases.find((x) => x.region === "US")?.titre ??
    r.titre_romanise ??
    r.titre;
  const annee = Number(r.date_sortie?.slice(0, 4)) || null;
  const wd = await titresJaponais(jeu, titreUs);
  const titres = [
    ...new Set([
      ...(JAPONAIS.test(r.titre ?? "") ? [r.titre] : []),
      ...wd.titres,
    ]),
  ];
  const ecartes = {
    pasGuide: 0,
    autreTitre: 0,
    suite: 0,
    autreConsole: 0,
    horsDates: 0,
  };
  const ligne = {
    console: slugConsole,
    slug: jeu.slug,
    titreCatalogue: r.titre,
    titres,
    wikidata: wd.wikidata,
    annee,
    guides: [],
    ecartes,
  };
  details.push(ligne);
  const vus = new Set();
  for (const titre of titres.slice(0, 2)) {
    const ndl = await lire(
      `https://ndlsearch.ndl.go.jp/api/opensearch?mediatype=books&cnt=50&title=${encodeURIComponent(titre)}`,
      "text",
      3000,
    );
    if (ndl.erreur) {
      ligne.erreurNdl = ndl.erreur;
      continue;
    }
    if (brutes.length < 2)
      brutes.push({ source: "ndl", recherche: titre, reponse: ndl.corps });
    for (const l of livresNdl(ndl.corps)) {
      const cle = l.isbn ?? l.lien ?? l.titre;
      if (vus.has(cle)) continue;
      vus.add(cle);
      if (!(
        l.ndc.some((n) => n.startsWith("798")) || MOTS_GUIDE.test(l.titre ?? "")
      )) {
        ecartes.pasGuide++;
        continue;
      }
      const t = compact(l.titre);
      const trouves = titres
        .map((x) => compact(x))
        .filter((x) => x.length >= 2 && t.includes(x));
      if (!trouves.length) {
        ecartes.autreTitre++;
        continue;
      }
      if (
        trouves.every((x) =>
          /^[0-9ⅰ-ⅻⅠ-Ⅻ]/.test(t.slice(t.indexOf(x) + x.length)),
        )
      ) {
        ecartes.suite++;
        continue;
      }
      const citees = consolesCitees(l.titre, titres);
      const bonne =
        citees.has(slugConsole) || (slugConsole === "gbc" && citees.has("gb"));
      if (citees.size && !bonne) {
        ecartes.autreConsole++;
        continue;
      }
      const anneeLivre = Number(l.date?.match(/\d{4}/)?.[0]);
      if (
        !citees.size &&
        annee &&
        anneeLivre &&
        (anneeLivre < annee - 1 || anneeLivre > annee + 4)
      ) {
        ecartes.horsDates++;
        continue;
      }
      ligne.guides.push({ ...l, console: bonne ? "citée" : "par la date" });
    }
  }
  const requete = [titreUs, titres[0]]
    .filter(Boolean)
    .map((x) => `title:("${x.replace(/"/g, "")}")`)
    .join(" OR ");
  const ia = await lire(
    `https://archive.org/advancedsearch.php?q=${encodeURIComponent(`collection:(strategyguides) AND (${requete})`)}&fl[]=identifier&fl[]=title&fl[]=language&rows=20&output=json`,
    "json",
  );
  if (ia.erreur) ligne.erreurIa = ia.erreur;
  else {
    const docs = ia.corps.response?.docs ?? [];
    const japonais = (d) =>
      [d.language].flat().some((x) => /jap|jpn/i.test(x ?? "")) ||
      JAPONAIS.test(d.title ?? "");
    ligne.archive = docs
      .filter(japonais)
      .map((d) => ({ id: d.identifier, titre: d.title }));
    if (brutes.length < 3)
      brutes.push({ source: "archive", reponse: ia.corps });
  }
}

// 3. Couvertures : openBD (lot d'ISBN) puis vignette NDL, sur 60 ISBN au plus.
const isbns = [
  ...new Set(
    details.flatMap((d) => d.guides.map((g) => g.isbn)).filter(Boolean),
  ),
].slice(0, 60);
const couvertures = {};
if (isbns.length) {
  const o = await lire(
    `https://api.openbd.jp/v1/get?isbn=${isbns.join(",")}`,
    "json",
  );
  (o.corps ?? []).forEach(
    (x, n) => (couvertures[isbns[n]] = { openbd: x?.summary?.cover || null }),
  );
  for (const isbn of isbns) {
    const v = await lire(
      `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`,
      "statut",
      3000,
    );
    (couvertures[isbn] ??= {}).ndl = v.erreur
      ? null
      : `${v.type}, ${v.octets} o`;
  }
}

// 4. Rapport.
const resume = {};
for (const d of details) {
  const r = (resume[d.console] ??= {
    jeux: 0,
    titreJa: 0,
    avecGuide: 0,
    guides: 0,
    isbn: 0,
    pages: 0,
    archive: 0,
    erreurs: 0,
  });
  r.jeux++;
  if (d.titres.length) r.titreJa++;
  if (d.guides.length) r.avecGuide++;
  r.guides += d.guides.length;
  r.isbn += d.guides.filter((g) => g.isbn).length;
  r.pages += d.guides.filter((g) => g.pages).length;
  if (d.archive?.length) r.archive++;
  if (d.erreurNdl || d.erreurIa) r.erreurs++;
}
const couv = Object.values(couvertures);
writeFileSync(
  "etude-guides.json",
  JSON.stringify(
    { appels, refus, consoles: CONSOLES, resume, couvertures, details, brutes },
    null,
    1,
  ),
);
const colonnes = [
  "jeux",
  "titreJa",
  "avecGuide",
  "guides",
  "isbn",
  "pages",
  "archive",
  "erreurs",
];
const texte = [
  `## Étude des guides japonais v2 (${new Date().toISOString().slice(0, 10)})`,
  `${echantillon.length} jeux (${CONSOLES.join(", ")}), ${appels} appels, refus 429 : ${JSON.stringify(refus)}. Catalogue rétro : ${lignes.length} jeux, ${sansJap} sans sortie japonaise, ${titreJapLatin} au titre JAP en lettres latines.`,
  `Couvertures sur ${isbns.length} ISBN : openBD ${couv.filter((c) => c.openbd).length}, vignette NDL ${couv.filter((c) => c.ndl).length}.`,
  "",
  `| Console | ${colonnes.join(" | ")} |`,
  `|---|${colonnes.map(() => "---").join("|")}|`,
  ...Object.entries(resume).map(
    ([k, c]) => `| ${k} | ${colonnes.map((x) => c[x]).join(" | ")} |`,
  ),
  "",
  "| Jeu | Titres japonais | Guides | Exemples (éditeur, date, pages, console) | Écartés : pas guide / autre titre / suite / autre console / hors dates | Archive |",
  "|---|---|---|---|---|---|",
  ...details.map((d) => {
    const ex = d.guides
      .slice(0, 2)
      .map(
        (g) =>
          `${g.titre} (${g.editeur ?? "?"}, ${g.date ?? "?"}, ${g.pages ?? "?"}, ${g.console})`,
      )
      .join(" ; ");
    const e = d.ecartes;
    return `| ${d.console}/${d.slug} | ${d.titres.join(", ") || "—"} | ${d.erreurNdl ?? d.guides.length} | ${(ex || "—").replace(/\|/g, "/")} | ${e.pasGuide} / ${e.autreTitre} / ${e.suite} / ${e.autreConsole} / ${e.horsDates} | ${d.erreurIa ?? d.archive?.length ?? 0} |`;
  }),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY)
  appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
