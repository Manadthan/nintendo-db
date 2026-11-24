// Étude des guides japonais (étape 29, intention v1.6 décision 10, 24/11/2026) : combien de nos jeux rétro ont un
// guide (攻略本) trouvable, avec quels champs, et avec quelle couverture ?
// LECTURE SEULE : rien n'est écrit dans la base. La session Claude ne joint aucune de ces sources : tâche GitHub.
// Sources interrogées, sans clé :
//  - NDL Search (Bibliothèque nationale de la Diète : dépôt légal, donc presque tous les livres japonais) :
//    API OpenSearch, recherche par titre japonais ; titre, éditeur, date, ISBN, pages, classement NDC (798 = jeux) ;
//  - openBD (couverture par ISBN, surtout les livres récents) et vignette NDL par ISBN ;
//  - Internet Archive, collection « strategyguides » (scans), recherche par titre US ou romanisé.
// Rapprochement guide → jeu : le titre japonais du jeu est contenu dans le titre du livre ; quand plusieurs de nos jeux
// conviennent (« スーパーマリオブラザーズ » et « スーパーマリオブラザーズ3 »), le livre va au titre le plus long.
// Lancé par la tâche GitHub « Étude guides » : SUPABASE_URL, SUPABASE_SECRET_KEY ; ETUDE_PAR_CONSOLE, ETUDE_CONSOLES.
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
const MOTS_GUIDE =
  /攻略|ガイド|必勝|完全|大百科|大全|公式|マニュアル|ブック|ヒント|裏技|ウルテク|秘技|テクニック/;

let appels = 0;
async function lire(url, type = "text") {
  await pause(1000); // une requête par seconde : sources publiques et gratuites
  appels++;
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "nintendo-db etude-guides (lecture seule)" },
    });
    if (!r.ok) return { erreur: `HTTP ${r.status}`, statut: r.status };
    if (type === "statut")
      return {
        statut: r.status,
        type: r.headers.get("content-type"),
        octets: (await r.arrayBuffer()).byteLength,
      };
    return { corps: type === "json" ? await r.json() : await r.text() };
  } catch (e) {
    return { erreur: e.message };
  }
}

// 1. Catalogue rétro : tous les titres japonais (pour le rapprochement), puis l'échantillon.
let lignes = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("games")
    .select(
      "slug, metacritic_note, consoles!inner(slug), releases(region, titre, titre_romanise)",
    )
    .in("consoles.slug", CONSOLES)
    .order("slug")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  lignes = lignes.concat(data);
  if (data.length < 1000) break;
}
const jap = (j) => j.releases.find((r) => r.region === "JAP");
const titresJap = lignes
  .filter((j) => jap(j)?.titre)
  .map((j) => ({
    cle: `${j.consoles.slug}/${j.slug}`,
    compact: compact(jap(j).titre),
  }))
  .filter((t) => t.compact.length >= 2);
const parConsole = {};
for (const j of lignes)
  if (jap(j)?.titre) (parConsole[j.consoles.slug] ??= []).push(j);
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
const sansJap = lignes.filter((j) => !jap(j)?.titre).length;
console.log(
  `${lignes.length} jeux rétro (${sansJap} sans sortie japonaise) ; échantillon : ${echantillon.length}`,
);

/** Le jeu auquel appartient un livre : le titre japonais le plus long contenu dans son titre. */
function proprietaire(titreLivre) {
  const t = compact(titreLivre);
  let meilleur = null;
  for (const x of titresJap)
    if (
      t.includes(x.compact) &&
      (!meilleur || x.compact.length > meilleur.compact.length)
    )
      meilleur = x;
  return meilleur?.cle ?? null;
}

/** Livres NDL d'une réponse OpenSearch (RSS). */
function livresNdl(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("item")
    .toArray()
    .map((item) => {
      const i = $(item);
      const champ = (sel) => i.find(sel).first().text().trim() || null;
      const ident = (type) =>
        i
          .find("dc\\:identifier")
          .toArray()
          .map((e) => $(e))
          .find((e) => (e.attr("xsi:type") ?? "").includes(type))
          ?.text()
          .trim() ?? null;
      const ndc = i
        .find("dc\\:subject")
        .toArray()
        .map((e) => $(e))
        .filter((e) => /NDC/.test(e.attr("xsi:type") ?? ""))
        .map((e) => e.text().trim());
      return {
        titre: champ("dc\\:title") ?? champ("title"),
        editeur: champ("dc\\:publisher"),
        date: champ("dcterms\\:issued") ?? champ("dc\\:date"),
        isbn: ident("ISBN")?.replace(/-/g, "") ?? null,
        pages: champ("dc\\:extent"),
        ndc,
        lien: champ("link"),
      };
    });
}

// 2. Recherche par jeu.
const details = [];
const brutes = []; // 2 réponses NDL et 1 Internet Archive, pour écrire les fixtures des tests plus tard
for (const { console: slugConsole, jeu } of echantillon) {
  const titreJap = jap(jeu).titre;
  const titreUs =
    jeu.releases.find((r) => r.region === "US")?.titre ??
    jap(jeu).titre_romanise ??
    null;
  const cle = `${slugConsole}/${jeu.slug}`;
  const ligne = {
    console: slugConsole,
    slug: jeu.slug,
    titreJap,
    titreUs,
    guides: [],
    autresJeux: 0,
    nonGuides: 0,
  };
  details.push(ligne);

  const ndl = await lire(
    `https://ndlsearch.ndl.go.jp/api/opensearch?mediatype=books&cnt=50&title=${encodeURIComponent(titreJap)}`,
  );
  if (ndl.erreur) ligne.erreurNdl = ndl.erreur;
  else {
    if (brutes.length < 2)
      brutes.push({ source: "ndl", recherche: titreJap, reponse: ndl.corps });
    for (const l of livresNdl(ndl.corps)) {
      const estGuide =
        l.ndc.some((n) => n.startsWith("798")) ||
        MOTS_GUIDE.test(l.titre ?? "");
      if (!estGuide) {
        ligne.nonGuides++;
        continue;
      }
      if (proprietaire(l.titre) !== cle) {
        ligne.autresJeux++;
        continue;
      }
      ligne.guides.push(l);
    }
  }

  const ia = titreUs
    ? await lire(
        `https://archive.org/advancedsearch.php?q=${encodeURIComponent(`collection:(strategyguides) AND title:("${titreUs.replace(/"/g, "")}") AND language:(Japanese OR jpn)`)}&fl[]=identifier&fl[]=title&rows=20&output=json`,
        "json",
      )
    : { erreur: "sans titre US" };
  if (ia.erreur) ligne.erreurIa = ia.erreur;
  else {
    ligne.archive = (ia.corps.response?.docs ?? []).map((d) => ({
      id: d.identifier,
      titre: d.title,
    }));
    if (brutes.length < 3)
      brutes.push({ source: "archive", recherche: titreUs, reponse: ia.corps });
  }
}

// 3. Couvertures : openBD (lot d'ISBN) puis vignette NDL, sur 40 ISBN au plus.
const isbns = [
  ...new Set(
    details.flatMap((d) => d.guides.map((g) => g.isbn)).filter(Boolean),
  ),
].slice(0, 40);
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
    avecGuide: 0,
    guides: 0,
    isbn: 0,
    pages: 0,
    editeur: 0,
    archive: 0,
    erreurs: 0,
  });
  r.jeux++;
  if (d.guides.length) r.avecGuide++;
  r.guides += d.guides.length;
  r.isbn += d.guides.filter((g) => g.isbn).length;
  r.pages += d.guides.filter((g) => g.pages).length;
  r.editeur += d.guides.filter((g) => g.editeur).length;
  if (d.archive?.length) r.archive++;
  if (d.erreurNdl || d.erreurIa) r.erreurs++;
}
const avecCouv = Object.values(couvertures);
writeFileSync(
  "etude-guides.json",
  JSON.stringify(
    { appels, consoles: CONSOLES, resume, couvertures, details, brutes },
    null,
    1,
  ),
);
const colonnes = [
  "jeux",
  "avecGuide",
  "guides",
  "isbn",
  "pages",
  "editeur",
  "archive",
  "erreurs",
];
const texte = [
  `## Étude des guides japonais (${new Date().toISOString().slice(0, 10)})`,
  `${echantillon.length} jeux (${CONSOLES.join(", ")}), ${appels} appels ; ${sansJap} jeux rétro du catalogue sans sortie japonaise (hors étude).`,
  `Couvertures sur ${isbns.length} ISBN : openBD ${avecCouv.filter((c) => c.openbd).length}, vignette NDL ${avecCouv.filter((c) => c.ndl).length}.`,
  "",
  `| Console | ${colonnes.join(" | ")} |`,
  `|---|${colonnes.map(() => "---").join("|")}|`,
  ...Object.entries(resume).map(
    ([k, c]) => `| ${k} | ${colonnes.map((x) => c[x]).join(" | ")} |`,
  ),
  "",
  "| Jeu | Titre JAP | Guides NDL | Exemple (éditeur, date, pages) | Écartés (autre jeu / pas un guide) | Archive |",
  "|---|---|---|---|---|---|",
  ...details.map((d) => {
    const g = d.guides[0];
    const exemple = g
      ? `${g.titre} (${g.editeur ?? "?"}, ${g.date ?? "?"}, ${g.pages ?? "?"}${g.isbn ? `, ${g.isbn}` : ""})`
      : "—";
    return `| ${d.console}/${d.slug} | ${d.titreJap} | ${d.erreurNdl ?? d.guides.length} | ${exemple.replace(/\|/g, "/")} | ${d.autresJeux} / ${d.nonGuides} | ${d.erreurIa ?? d.archive?.length ?? 0} |`;
  }),
].join("\n");
console.log(texte);
if (env.GITHUB_STEP_SUMMARY)
  appendFileSync(env.GITHUB_STEP_SUMMARY, `${texte}\n`);
