// Famicom Mini (GBA, Japon) complétées le 23/11/2026, à la demande du propriétaire.
// - 19 versions JAP sans jaquette : la boîte existe chez libretro-thumbnails, mais sous un nom numéroté
//   (« Famicom Mini 08 - Mappy (Japan) (En) ») que le rapprochement par titre de l'import ne trouve pas.
// - Codes produit AGB-xxxJ tirés de la série No-Intro (libretro-database) pour les 20 versions qui n'en ont pas.
// - 10 versions JAP dont la jaquette est la boîte américaine « Classic NES Series » (l'import l'a prise chez libretro,
//   qui range la boîte américaine sous le nom japonais) : boîte officielle du site Famicom Mini de Nintendo Japon
//   (165 × 210 px seulement, mais la bonne boîte ; Pac-Man : la photo de travers de ScreenScraper aussi remplacée).
// - 11 versions JAP titrées « Classic NES Series: … » (titre américain) renommées « Famicom Mini: … » (titre
//   japonais réel ; choix du propriétaire).
// Champs écrits verrouillés (titre, code_produit) : l'import ne les remplace plus. Une jaquette ajoutée à la main
// (photo, adresse) n'est jamais touchée.
//   npm run session -- scripts/famicom-mini.mjs --planche /chemin/planche.jpg   (rien n'est écrit)
//   npm run session -- scripts/famicom-mini.mjs --ecrire [--sauf n,n]
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

/** Boîte libretro (nom de fichier) ou officielle (« nintendo:fmk/donkeykong », page du site Famicom Mini). */
const BOITES = (nom) =>
  nom.startsWith("nintendo:")
    ? `https://www.nintendo.co.jp/n08/${nom.slice(9)}/package.jpg`
    : `https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Game_Boy_Advance/master/Named_Boxarts/${encodeURIComponent(`${nom}.png`)}`;

/** [jeu du site, boîte libretro (null : garder la jaquette), code produit (null : garder), titre JAP (null : garder)]. */
const VERSIONS = [
  [
    "famicom-mini-mappy",
    "Famicom Mini 08 - Mappy (Japan) (En)",
    "AGB-FMPJ",
    null,
  ],
  [
    "famicom-mini-star-soldier",
    "Famicom Mini 10 - Star Soldier (Japan) (En)",
    "AGB-FSOJ",
    null,
  ],
  [
    "famicom-mini-mario-bros",
    "Famicom Mini 11 - Mario Bros. (Japan)",
    "AGB-FMBJ",
    null,
  ],
  [
    "famicom-mini-clu-clu-land",
    "Famicom Mini 12 - Clu Clu Land (Japan)",
    "AGB-FCLJ",
    null,
  ],
  [
    "famicom-mini-balloon-fight",
    "Famicom Mini 13 - Balloon Fight (Japan)",
    "AGB-FBFJ",
    null,
  ],
  [
    "famicom-mini-wrecking-crew",
    "Famicom Mini 14 - Wrecking Crew (Japan)",
    "AGB-FWCJ",
    null,
  ],
  [
    "famicom-mini-dig-dug",
    "Famicom Mini 16 - Dig Dug (Japan)",
    "AGB-FDDJ",
    null,
  ],
  [
    "famicom-mini-takahashi-meijin-no-bouken-jima",
    "Famicom Mini 17 - Takahashi Meijin no Bouken-jima (Japan)",
    "AGB-FTBJ",
    null,
  ],
  [
    "famicom-mini-makaimura",
    "Famicom Mini 18 - Makaimura (Japan)",
    "AGB-FMKJ",
    null,
  ],
  [
    "famicom-mini-twinbee",
    "Famicom Mini 19 - Twin Bee (Japan)",
    "AGB-FTWJ",
    null,
  ],
  [
    "famicom-mini-ganbare-goemon-karakuri-douchuu",
    "Famicom Mini 20 - Ganbare Goemon! - Karakuri Douchuu (Japan)",
    "AGB-FGGJ",
    null,
  ],
  [
    "famicom-mini-super-mario-bros-2",
    "Famicom Mini 21 - Super Mario Bros. 2 (Japan)",
    "AGB-FM2J",
    null,
  ],
  [
    "famicom-mini-nazo-no-murasame-jou",
    "Famicom Mini 22 - Nazo no Murasame Jou (Japan)",
    "AGB-FNMJ",
    null,
  ],
  [
    "famicom-mini-hikari-shinwa-palthena-no-kagami",
    "Famicom Mini 24 - Hikari Shinwa - Palthena no Kagami (Japan)",
    "AGB-FPTJ",
    null,
  ],
  [
    "famicom-mini-famicom-mukashi-banashi-shin-onigashima-zenkouhen",
    "Famicom Mini 26 - Famicom Mukashibanashi - Shin Onigashima - Zen, Kouhen (Japan)",
    "AGB-FFMJ",
    null,
  ],
  [
    "famicom-mini-famicom-tantei-club-kieta-koukeisha-zenkouhen",
    "Famicom Mini 27 - Famicom Tantei Club - Kieta Koukeisha - Zen, Kouhen (Japan)",
    "AGB-FTKJ",
    null,
  ],
  [
    "famicom-mini-famicom-tantei-club-part-ii-ushiro-ni-tatsu-shoujo-zenkouhen",
    "Famicom Mini 28 - Famicom Tantei Club Part II - Ushiro ni Tatsu Shoujo - Zen, Kouhen (Japan)",
    "AGB-FTUJ",
    null,
  ],
  [
    "famicom-mini-sd-gundam-world-gachapon-senshi-scramble-wars",
    "Famicom Mini 30 - SD Gundam World - Gachapon Senshi Scramble Wars (Japan)",
    "AGB-FSDJ",
    null,
  ],
  [
    "classic-nes-series-pac-man",
    "nintendo:fmk/pacman",
    "AGB-FPMJ",
    "Famicom Mini: Pac-Man",
  ],
  // Boîte officielle (libretro n'a que l'américaine) ; Super Mario Bros. et Bomberman : la boîte Famicom Mini est déjà là.
  [
    "classic-nes-series-super-mario-bros",
    null,
    null,
    "Famicom Mini: Super Mario Bros.",
  ],
  [
    "classic-nes-series-donkey-kong",
    "nintendo:fmk/donkeykong",
    null,
    "Famicom Mini: Donkey Kong",
  ],
  [
    "classic-nes-series-ice-climber",
    "nintendo:fmk/iceclimer",
    null,
    "Famicom Mini: Ice Climber",
  ],
  [
    "classic-nes-series-excitebike",
    "nintendo:fmk/excitebike",
    null,
    "Famicom Mini: Excitebike",
  ],
  [
    "classic-nes-series-the-legend-of-zelda",
    "nintendo:fmk/zelda1",
    null,
    "Famicom Mini: Zelda no Densetsu 1: The Hyrule Fantasy",
  ],
  [
    "classic-nes-series-xevious",
    "nintendo:fmk/xevious",
    null,
    "Famicom Mini: Xevious",
  ],
  ["classic-nes-series-bomberman", null, null, "Famicom Mini: Bomberman"],
  [
    "classic-nes-series-dr-mario",
    "nintendo:fmk2/dr_mario",
    null,
    "Famicom Mini: Dr. Mario",
  ],
  [
    "classic-nes-series-metroid",
    "nintendo:fmk3/metroid",
    null,
    "Famicom Mini: Metroid",
  ],
  [
    "classic-nes-series-zelda-ii-the-adventure-of-link",
    "nintendo:fmk3/link",
    null,
    "Famicom Mini: Link no Bouken",
  ],
  [
    "classic-nes-series-castlevania",
    "nintendo:fmk3/akumajyo",
    null,
    "Famicom Mini: Akumajō Dracula",
  ],
];
const TAILLES = [300, 600, 768];
const GARDEES = new Set(["photo", "url"]);

const arg = (nom) => {
  const i = process.argv.indexOf(nom);
  return i > 0 ? process.argv[i + 1] : null;
};
const planche = arg("--planche");
const ecrire = process.argv.includes("--ecrire");
const sauf = new Set(
  (arg("--sauf") ?? "").split(",").filter(Boolean).map(Number),
);
if (!planche && !ecrire) throw new Error("--planche /chemin.jpg ou --ecrire");

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
  throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Lecture d'abord : chaque version doit exister, être sortie au Japon et ne pas avoir de jaquette ajoutée à la main.
const lues = [];
const ignorees = [];
for (const [slug, boite, code, titre] of VERSIONS) {
  const { data: v, error } = await supabase
    .from("releases")
    .select(
      "game_id, sortie, titre, code_produit, jaquette_path, jaquette_source, verrous, games!inner(slug, consoles!inner(slug))",
    )
    .eq("region", "JAP")
    .eq("games.slug", slug)
    .eq("games.consoles.slug", "gba")
    .maybeSingle();
  if (error) throw new Error(`${slug} : ${error.message}`);
  if (!v?.sortie) ignorees.push(`${slug} (pas de version JAP)`);
  else if (boite && GARDEES.has(v.jaquette_source))
    ignorees.push(`${slug} (jaquette ajoutée à la main)`);
  else lues.push({ slug, boite, code, titre, v });
}

const images = new Map();
for (const l of lues.filter((l) => l.boite)) {
  await pause(1000);
  const r = await fetch(BOITES(l.boite));
  if (!r.ok) {
    ignorees.push(`${l.slug} (boîte libretro : HTTP ${r.status})`);
    l.boite = null;
    continue;
  }
  images.set(l.slug, Buffer.from(await r.arrayBuffer()));
}

if (planche) {
  const avecImage = lues.filter((l) => images.has(l.slug));
  const L = 200,
    H = 300,
    col = 5;
  const tuiles = await Promise.all(
    avecImage.map(async (l, n) => {
      const img = await sharp(images.get(l.slug))
        .resize(L, H - 30, { fit: "contain", background: "#fff" })
        .toBuffer();
      const texte = Buffer.from(
        `<svg width="${L}" height="30"><text x="4" y="20" font-size="13" font-family="sans-serif">${n + 1}. ${l.slug.replace("famicom-mini-", "").replace("classic-nes-series-", "").slice(0, 24)}</text></svg>`,
      );
      return [
        { input: img, left: (n % col) * L, top: Math.floor(n / col) * H },
        {
          input: texte,
          left: (n % col) * L,
          top: Math.floor(n / col) * H + H - 30,
        },
      ];
    }),
  );
  await sharp({
    create: {
      width: col * L,
      height: Math.ceil(avecImage.length / col) * H,
      channels: 3,
      background: "#fff",
    },
  })
    .composite(tuiles.flat())
    .jpeg({ quality: 80 })
    .toFile(planche);
  console.log(`Planche : ${planche} (${avecImage.length} boîtes)`);
  for (const l of lues)
    console.log(
      `  ${l.slug} : code ${l.v.code_produit ?? "—"} → ${l.code ?? "inchangé"} ; titre ${l.v.titre} → ${l.titre ?? "inchangé"}`,
    );
} else {
  let jaquettes = 0,
    codes = 0,
    titres = 0;
  const avecImage = lues.filter((l) => images.has(l.slug));
  for (const l of lues) {
    const n = avecImage.indexOf(l) + 1;
    const maj = {};
    const verrous = new Set(l.v.verrous);
    if (images.has(l.slug) && !sauf.has(n)) {
      const base = `${l.v.game_id}/jap-${Date.now().toString(36)}`;
      for (const taille of TAILLES) {
        const webp = await sharp(images.get(l.slug), {
          limitInputPixels: 40_000_000,
        })
          .rotate()
          .resize({ width: taille, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const { error: e } = await supabase.storage
          .from("jaquettes")
          .upload(`${base}-${taille}.webp`, webp, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
          });
        if (e) throw new Error(`${l.slug} : ${e.message}`);
      }
      maj.jaquette_path = base;
      maj.jaquette_source = l.boite.startsWith("nintendo:")
        ? "nintendo"
        : "libretro";
    } else if (sauf.has(n))
      ignorees.push(`${l.slug} (n° ${n} refusé sur la planche)`);
    if (l.code && l.v.code_produit !== l.code) {
      maj.code_produit = l.code;
      verrous.add("code_produit");
    }
    if (l.titre && l.v.titre !== l.titre) {
      maj.titre = l.titre;
      verrous.add("titre");
    }
    if (!Object.keys(maj).length) continue;
    maj.verrous = [...verrous];
    const { error: e } = await supabase
      .from("releases")
      .update(maj)
      .eq("game_id", l.v.game_id)
      .eq("region", "JAP");
    if (e) throw new Error(`${l.slug} : ${e.message}`);
    if (maj.jaquette_path && l.v.jaquette_path)
      await supabase.storage
        .from("jaquettes")
        .remove(TAILLES.map((t) => `${l.v.jaquette_path}-${t}.webp`));
    if (maj.jaquette_path) jaquettes++;
    if (maj.code_produit) codes++;
    if (maj.titre) titres++;
    console.log(
      `${l.slug} : ${Object.keys(maj)
        .filter((k) => k !== "verrous")
        .join(", ")}`,
    );
  }
  console.log(
    `${jaquettes} jaquette(s), ${codes} code(s) produit, ${titres} titre(s) ; ${ignorees.length} ignorée(s)`,
  );
}
for (const i of ignorees) console.log(`  ignorée : ${i}`);
