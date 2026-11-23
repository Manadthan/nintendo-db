// Jaquettes rétro manquantes complétées le 23/11/2026, à la demande du propriétaire : la boîte existe chez
// libretro-thumbnails, mais sous un nom que le rapprochement par titre de l'import ne trouve pas (« & » écrit « _ »,
// titre japonais, compilation « Four Swords », « Microgame$ »…). Chaque nom est choisi à la main puis regardé sur
// planche. « ≈ » : boîte d'une édition proche (même jeu sous un autre nom ou compilation), à valider sur la planche.
// Une jaquette ajoutée à la main ou choisie (photo, url, nintendo, gamecartdb, screenscraper) n'est jamais touchée ;
// seules les versions encore sans jaquette sont écrites.
// Refusées sur la planche du 23/11 (boîte d'une autre région chez libretro, ou image qui n'est pas une boîte) et
// retirées de la liste : Magical Quest GBA JAP, Mickey Mouse: Magic Wands! JAP, Shadowgate Classic JAP, Power Lode
// Runner JAP, et Another Code: R, Big Brain Academy, FlingSmash (Wii) JAP.
//   npm run session -- scripts/jaquettes-libretro-noms.mjs --planche /chemin/planche.jpg   (rien n'est écrit)
//   npm run session -- scripts/jaquettes-libretro-noms.mjs --ecrire [--sauf n,n]
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const DEPOTS = {
  nes: "Nintendo_-_Nintendo_Entertainment_System",
  snes: "Nintendo_-_Super_Nintendo_Entertainment_System",
  gb: "Nintendo_-_Game_Boy",
  gbc: "Nintendo_-_Game_Boy_Color",
  gba: "Nintendo_-_Game_Boy_Advance",
  n64: "Nintendo_-_Nintendo_64",
  ds: "Nintendo_-_Nintendo_DS",
  gamecube: "Nintendo_-_GameCube",
  wii: "Nintendo_-_Wii",
};

/** [console, jeu, région, dépôt libretro (null : celui de la console), boîte, « ≈ »]. */
const BOITES = [
  [
    "gba",
    "advance-wars",
    "JAP",
    null,
    "Game Boy Wars Advance 1+2 (Japan)",
    "≈",
  ],
  [
    "gba",
    "advance-wars-2-black-hole-rising",
    "JAP",
    null,
    "Game Boy Wars Advance 1+2 (Japan)",
    "≈",
  ],
  ["gba", "calcio-bit", "JAP", null, "Calciobit (Japan)"],
  ["gba", "densetsu-no-starfy", "JAP", null, "Densetsu no Stafy (Japan)"],
  ["gba", "densetsu-no-starfy-2", "JAP", null, "Densetsu no Stafy 2 (Japan)"],
  ["gba", "densetsu-no-starfy-3", "JAP", null, "Densetsu no Stafy 3 (Japan)"],
  [
    "gba",
    "disneys-magical-quest-starring-mickey-minnie",
    "US",
    null,
    "Magical Quest Starring Mickey _ Minnie (USA)",
  ],
  [
    "gba",
    "disneys-magical-quest-starring-mickey-minnie",
    "PAL",
    null,
    "Magical Quest Starring Mickey _ Minnie (Europe) (En,Fr,De,Es,It)",
  ],
  [
    "gba",
    "domo-kun-no-fushigi-terebi",
    "JAP",
    null,
    "Domo-kun no Fushigi Television (Japan)",
  ],
  [
    "gba",
    "dr-mario-puzzle-league",
    "JAP",
    null,
    "Dr. Mario _ Panel de Pon (Japan)",
  ],
  [
    "gba",
    "dr-mario-puzzle-league",
    "US",
    null,
    "2 Games in One! - Dr. Mario + Puzzle League (USA)",
  ],
  [
    "gba",
    "dr-mario-puzzle-league",
    "PAL",
    null,
    "2 Games in 1 - Dr. Mario + Puzzle League (Europe) (En,Fr,De,Es,It)",
  ],
  [
    "gba",
    "the-legend-of-zelda-a-link-to-the-past",
    "JAP",
    null,
    "Zelda no Densetsu - Kamigami no Triforce _ 4tsu no Tsurugi (Japan)",
  ],
  [
    "gba",
    "the-legend-of-zelda-a-link-to-the-past",
    "US",
    null,
    "Legend of Zelda, The - A Link to the Past _ Four Swords (USA)",
  ],
  [
    "gba",
    "the-legend-of-zelda-a-link-to-the-past",
    "PAL",
    null,
    "Legend of Zelda, The - A Link to the Past _ Four Swords (Europe) (En,Fr,De,Es,It)",
  ],
  [
    "gba",
    "warioware-inc-mega-microgames",
    "JAP",
    null,
    "Made in Wario (Japan)",
  ],
  [
    "gba",
    "warioware-inc-mega-microgames",
    "US",
    null,
    "WarioWare, Inc. - Mega Microgame$! (USA)",
  ],
  [
    "gba",
    "warioware-inc-mega-microgames",
    "PAL",
    null,
    "WarioWare, Inc. - Minigame Mania (Europe) (En,Fr,De,Es,It)",
  ],
  [
    "gb",
    "arcade-classic-no-3-galaga-galaxian",
    "JAP",
    null,
    "Galaga _ Galaxian (Japan) (SGB Enhanced)",
  ],
  [
    "gb",
    "space-invaders-1994",
    "US",
    null,
    "Space Invaders (USA) (SGB Enhanced)",
  ],
  [
    "gb",
    "space-invaders-1994",
    "PAL",
    null,
    "Space Invaders (Europe) (SGB Enhanced)",
  ],
  // Au Japon, Wario Land II n'est sorti qu'en version Game Boy Color (cartouche compatible Game Boy).
  [
    "gb",
    "wario-land-ii",
    "JAP",
    "gbc",
    "Wario Land 2 (Japan) (SGB Enhanced) (GB Compatible)",
    "≈",
  ],
  [
    "gbc",
    "hamtaro-tomodachi-daisakusen-dechu",
    "JAP",
    null,
    "Tottoko Hamutarou - Tomodachi Daisakusen Dechu (Japan)",
  ],
  [
    "gbc",
    "toreedo-batoru-kaado-hiiroo",
    "JAP",
    null,
    "Trade _ Battle Card Hero (Japan) (SGB Enhanced) (GB Compatible)",
  ],
  [
    "n64",
    "itoi-shigesato-no-bass-tsuri-no-1-kettehan",
    "JAP",
    null,
    "Itoi Shigesato no Bass Tsuri No. 1 Kettei Ban! (Japan)",
  ],
  [
    "n64",
    "sin-and-punishment",
    "JAP",
    null,
    "Tsumi to Batsu - Hoshi no Keishousha (Japan)",
  ],
  [
    "nes",
    "a-boy-and-his-blob-trouble-on-blobolonia",
    "US",
    null,
    "David Crane's A Boy and His Blob - Trouble on Blobolonia (USA)",
  ],
  [
    "nes",
    "a-boy-and-his-blob-trouble-on-blobolonia",
    "PAL",
    null,
    "David Crane's A Boy and His Blob - Trouble on Blobolonia (Europe)",
  ],
  [
    "nes",
    "donkey-kong-jr-math",
    "JAP",
    null,
    "Donkey Kong Jr. no Sansuu Asobi (Japan)",
  ],
  [
    "nes",
    "fire-emblem-shadow-dragon-and-the-blade-of-light",
    "JAP",
    null,
    "Fire Emblem - Ankoku Ryuu to Hikari no Tsurugi (Japan)",
  ],
  ["nes", "mah-jong", "JAP", null, "Mahjong (Japan)"],
  [
    "nes",
    "mario-bros-classic-series",
    "PAL",
    null,
    "Mario Bros. (Europe) (PAL-MC-0, Classic Series)",
  ],
  [
    "nes",
    "super-spike-vball",
    "JAP",
    null,
    "U.S. Championship V'Ball (Japan)",
    "≈",
  ],
  [
    "snes",
    "fire-emblem-genealogy-of-the-holy-war",
    "JAP",
    null,
    "Fire Emblem - Seisen no Keifu (Japan)",
  ],
  [
    "snes",
    "fire-emblem-mystery-of-the-emblem",
    "JAP",
    null,
    "Fire Emblem - Monshou no Nazo (Japan)",
  ],
  [
    "snes",
    "heisei-shin-onigashima-part-1",
    "JAP",
    null,
    "Heisei Shin Onigashima - Zenpen (Japan)",
  ],
  [
    "snes",
    "heisei-shin-onigashima-part-2",
    "JAP",
    null,
    "Heisei Shin Onigashima - Kouhen (Japan)",
  ],
  [
    "snes",
    "kirby-no-kirakira-kizzu",
    "JAP",
    null,
    "Kirby no Kirakira Kids (Japan)",
  ],
  ["snes", "mario-wario", "JAP", null, "Mario to Wario (Japan) (En)"],
  [
    "snes",
    "marvelous-mohitotsu-no-takarajima",
    "JAP",
    null,
    "Marvelous - Mouhitotsu no Takara-jima (Japan)",
  ],
  ["snes", "zoo-tto-mahjong", "JAP", null, "Zootto Mahjong! (Japan) (NP)"],
  ["ds", "kuruma-de-ds", "JAP", null, "Kuruma de DS (Japan)"],
  [
    "gamecube",
    "final-fantasy-crystal-chronicles",
    "JAP",
    null,
    "Final Fantasy Crystal Chronicles (Japan)",
  ],
];
const TAILLES = [300, 600, 768];
const GARDEES = new Set([
  "photo",
  "url",
  "nintendo",
  "gamecartdb",
  "screenscraper",
]);
const adresse = (depot, nom) =>
  `https://raw.githubusercontent.com/libretro-thumbnails/${depot}/master/Named_Boxarts/${encodeURIComponent(`${nom}.png`)}`;

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
/** Téléchargement réessayé 3 fois (connexions coupées sur les grosses images). */
async function telecharger(url) {
  for (let essai = 1; ; essai++) {
    try {
      return await fetch(url);
    } catch (e) {
      if (essai === 3) throw e;
      await pause(3000 * essai);
    }
  }
}

const candidates = [];
const ignorees = [];
for (const [consoleSlug, slug, region, depot, boite, approche] of BOITES) {
  const nom = `${consoleSlug} ${slug} ${region}`;
  const { data: v, error } = await supabase
    .from("releases")
    .select(
      "game_id, sortie, jaquette_path, jaquette_source, games!inner(slug, consoles!inner(slug))",
    )
    .eq("region", region)
    .eq("games.slug", slug)
    .eq("games.consoles.slug", consoleSlug)
    .maybeSingle();
  if (error) throw new Error(`${nom} : ${error.message}`);
  if (!v?.sortie) {
    ignorees.push(`${nom} (version absente)`);
    continue;
  }
  if (v.jaquette_path || GARDEES.has(v.jaquette_source)) {
    ignorees.push(`${nom} (a déjà une jaquette)`);
    continue;
  }
  await pause(1000);
  const r = await telecharger(adresse(DEPOTS[depot ?? consoleSlug], boite));
  if (!r.ok) {
    ignorees.push(`${nom} (libretro : HTTP ${r.status})`);
    continue;
  }
  candidates.push({
    nom,
    region,
    v,
    approche,
    image: Buffer.from(await r.arrayBuffer()),
  });
}

if (planche) {
  const L = 200,
    H = 300,
    col = 6;
  const tuiles = await Promise.all(
    candidates.map(async (c, n) => {
      const img = await sharp(c.image)
        .resize(L, H - 30, { fit: "contain", background: "#fff" })
        .toBuffer();
      const etiquette = `${n + 1}${c.approche ? " ≈" : ""} ${c.nom.split(" ")[1].slice(0, 18)} ${c.region}`;
      const texte = Buffer.from(
        `<svg width="${L}" height="30"><text x="4" y="20" font-size="12" font-family="sans-serif">${etiquette.replace(/&/g, "&amp;")}</text></svg>`,
      );
      const x = (n % col) * L,
        y = Math.floor(n / col) * H;
      return [
        { input: img, left: x, top: y },
        { input: texte, left: x, top: y + H - 30 },
      ];
    }),
  );
  await sharp({
    create: {
      width: col * L,
      height: Math.ceil(candidates.length / col) * H,
      channels: 3,
      background: "#fff",
    },
  })
    .composite(tuiles.flat())
    .jpeg({ quality: 80 })
    .toFile(planche);
  console.log(`Planche : ${planche} (${candidates.length} boîtes)`);
  candidates.forEach((c, n) =>
    console.log(`  ${n + 1}${c.approche ? " ≈" : ""} ${c.nom}`),
  );
} else {
  let copiees = 0;
  for (const [n, c] of candidates.entries()) {
    if (sauf.has(n + 1)) {
      ignorees.push(`${c.nom} (n° ${n + 1} refusé sur la planche)`);
      continue;
    }
    const base = `${c.v.game_id}/${c.region.toLowerCase()}-${Date.now().toString(36)}`;
    for (const taille of TAILLES) {
      const webp = await sharp(c.image, { limitInputPixels: 40_000_000 })
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
      if (e) throw new Error(`${c.nom} : ${e.message}`);
    }
    const { error: e } = await supabase
      .from("releases")
      .update({ jaquette_path: base, jaquette_source: "libretro" })
      .eq("game_id", c.v.game_id)
      .eq("region", c.region);
    if (e) throw new Error(`${c.nom} : ${e.message}`);
    copiees++;
    console.log(`${c.nom} : jaquette libretro`);
  }
  console.log(
    `${copiees} jaquette(s) copiée(s) ; ${ignorees.length} ignorée(s)`,
  );
}
for (const i of ignorees) console.log(`  ignorée : ${i}`);
