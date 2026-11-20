// Boîtes PAL françaises (choix du propriétaire, 20/11/2026 ; SPEC v1.28) : le relais essaie désormais la boîte
// française de GameTDB avant l'anglaise (souvent un scan allemand, logo USK), mais l'import ne remplace jamais une
// jaquette en place. Ce script, lancé une fois depuis la session Claude comme le relais, remplace les jaquettes PAL
// Wii U et Switch venues de GameTDB par la boîte française quand elle existe :
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/jaquettes-pal-francaises.mjs
// Le scan du relais est remplacé aussi (bucket gametdb), pour qu'un import suivant reste cohérent. Une jaquette ajoutée
// à la main (photo, adresse) n'est jamais touchée. Même conversion que l'application (WebP 300 / 600 / 768, ADR-04).
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const TAILLES = [300, 600, 768];
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function telecharger(adresse) {
  await pause(1000);
  const r = await fetch(adresse);
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
}

// Wii U : le code produit (« WUP-P-AMKP ») donne les 4 premiers caractères de l'identifiant GameTDB (« AMKP01 »).
const { data: scansWiiU, error: e0 } = await supabase.storage.from("gametdb").list("scans", { limit: 2000 });
if (e0) throw new Error(`Scans Wii U illisibles : ${e0.message}`);
const idsWiiU = scansWiiU.map((f) => f.name.replace(/\.jpg$/, ""));

const CONSOLES = {
  "wii-u": {
    id: (code) => idsWiiU.find((id) => id.startsWith(code.slice(6))),
    scan: (id) => `scans/${id}.jpg`,
    adresses: (id) => [`https://art.gametdb.com/wiiu/coverHQ/FR/${id}.jpg`],
  },
  switch: {
    id: (code) => code.slice(6),
    scan: (id) => `switch/scans/PAL/${id}.jpg`,
    adresses: (id) => ["coverHQ", "coverM"].map((t) => `https://art.gametdb.com/switch/${t}/FR/${id}.jpg`),
  },
};

let remplacees = 0;
const gardees = [];
for (const [consoleSlug, c] of Object.entries(CONSOLES)) {
  const { data: sorties, error } = await supabase
    .from("releases")
    .select("game_id, code_produit, jaquette_path, games!inner(slug, consoles!inner(slug))")
    .eq("region", "PAL")
    .eq("sortie", true)
    .eq("jaquette_source", "gametdb")
    .eq("games.consoles.slug", consoleSlug);
  if (error) throw new Error(`${consoleSlug} illisible : ${error.message}`);

  for (const s of sorties) {
    const nom = `${consoleSlug} ${s.games.slug}`;
    const id = s.code_produit ? c.id(s.code_produit) : null;
    if (!id) {
      gardees.push(`${nom} (identifiant GameTDB inconnu)`);
      continue;
    }
    let image = null;
    for (const adresse of c.adresses(id)) if ((image = await telecharger(adresse))) break;
    if (!image) {
      gardees.push(`${nom} (pas de boîte française)`);
      continue;
    }
    const { error: e1 } = await supabase.storage
      .from("gametdb")
      .upload(c.scan(id), image, { contentType: "image/jpeg", upsert: true });
    if (e1) throw new Error(`${nom} : scan du relais : ${e1.message}`);

    const base = `${s.game_id}/pal-${Date.now().toString(36)}`;
    for (const taille of TAILLES) {
      const webp = await sharp(image, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: taille, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const { error: e2 } = await supabase.storage
        .from("jaquettes")
        .upload(`${base}-${taille}.webp`, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (e2) throw new Error(`${nom} : ${e2.message}`);
    }
    const { error: e3 } = await supabase
      .from("releases")
      .update({ jaquette_path: base })
      .eq("game_id", s.game_id)
      .eq("region", "PAL");
    if (e3) throw new Error(`${nom} : ${e3.message}`);
    if (s.jaquette_path && s.jaquette_path !== base)
      await supabase.storage.from("jaquettes").remove(TAILLES.map((t) => `${s.jaquette_path}-${t}.webp`));
    remplacees++;
    console.log(`${nom} : boîte française`);
  }
}
console.log(`${remplacees} jaquette(s) PAL remplacée(s) par la boîte française ; ${gardees.length} gardée(s)`);
for (const g of gardees) console.log(`  ${g}`);
