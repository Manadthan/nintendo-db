// Jaquettes Switch et Switch 2 sans leur boîtier (choix du propriétaire, 23/11/2026) : les photos officielles de
// Nintendo (Switch, Switch 2) et les boîtes de gamecartdb (Switch 2) montrent le boîtier en plastique, gris clair ou
// rouge, autour de la jaquette ; les scans de GameTDB, non. On recadre l'image déjà stockée (768 px, rien n'est
// retéléchargé) avec les gabarits de src/lib/jaquettes/boitier.ts. Exception validée : la photo PAL de Zelda Tears of
// the Kingdom, ajoutée à la main, a aussi son boîtier et son propre gabarit ; aucune autre photo n'est touchée.
// Depuis la session Claude (skill script-prod) :
//   npm run session -- scripts/jaquettes-sans-boitier.mjs --planche /chemin/planche.jpg   (rien n'est écrit)
//   npm run session -- scripts/jaquettes-sans-boitier.mjs                                (écriture)
//   npm run session -- scripts/jaquettes-sans-boitier.mjs --sauf 3,17                    (sans les n° 3 et 17)
// Garde-fou : une jaquette sans boîtier visible (déjà recadrée, plate, ou en largeur comme Nintendo Labo) est sautée ;
// relancer le script ne recoupe donc rien. Même conversion que l'application (WebP 300 / 600 / 768 px, jamais
// agrandie, chemin versionné, ADR-04) ; la source de la jaquette ne change pas.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { aUnBoitier, gabaritPour, zoneSansBoitier } from "../src/lib/jaquettes/boitier.ts";

const TAILLES = [300, 600, 768];
/** Photo ajoutée à la main par le propriétaire (768 × 1254), bords mesurés le 23/11/2026. */
const EXCEPTIONS = {
  "switch the-legend-of-zelda-tears-of-the-kingdom PAL": { gauche: 0.015, droite: 0.036, haut: 0.028, bas: 0.025 },
};
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const i = process.argv.indexOf("--planche");
const planche = i > 0 ? process.argv[i + 1] : null;
const j = process.argv.indexOf("--sauf");
const sauf = new Set(j > 0 ? process.argv[j + 1].split(",").map(Number) : []);
const publique = (chemin) => `${SUPABASE_URL}/storage/v1/object/public/jaquettes/${chemin}-768.webp`;

/** Jaquettes candidates, dans l'ordre de la planche. */
const candidates = [];
const sautees = [];
for (const console_ of ["switch", "switch-2"]) {
  const { data: jeux, error } = await supabase
    .from("games")
    .select("id, slug, consoles!inner(slug), releases(region, jaquette_path, jaquette_source)")
    .eq("consoles.slug", console_)
    .order("slug");
  if (error) throw new Error(`${console_} : ${error.message}`);
  for (const jeu of jeux)
    for (const sortie of jeu.releases) {
      if (!sortie.jaquette_path) continue;
      const nom = `${console_} ${jeu.slug} ${sortie.region}`;
      const bords = EXCEPTIONS[nom] ?? gabaritPour(console_, sortie.jaquette_source);
      if (!bords) continue;
      const reponse = await fetch(publique(sortie.jaquette_path));
      if (!reponse.ok) throw new Error(`${nom} : HTTP ${reponse.status}`);
      const image = Buffer.from(await reponse.arrayBuffer());
      const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      if (!aUnBoitier(data, info.width, info.height)) {
        sautees.push(`${nom} (${sortie.jaquette_source} : pas de boîtier visible)`);
        continue;
      }
      candidates.push({ nom, jeu, sortie, image, zone: zoneSansBoitier(info.width, info.height, bords) });
    }
}
console.log(`${candidates.length} jaquette(s) avec boîtier ; ${sautees.length} sans`);
for (const c of candidates) console.log(`  avec boîtier : ${c.nom}`);

if (planche) {
  const L = 150;
  const H = 260;
  const COLONNES = 8;
  const tuiles = [];
  for (const [n, c] of candidates.entries()) {
    const x = (n % COLONNES) * L;
    const y = Math.floor(n / COLONNES) * H;
    const decoupee = await sharp(c.image)
      .extract(c.zone)
      .resize(L - 10, H - 30, { fit: "contain", background: "#00c000" })
      .toBuffer();
    const legende = `${n + 1} ${c.sortie.region} ${c.jeu.slug.slice(0, 15)}`.replace(/&/g, "&amp;");
    tuiles.push(
      { input: decoupee, left: x + 5, top: y + 5 },
      {
        input: Buffer.from(
          `<svg width="${L}" height="20"><rect width="100%" height="100%" fill="#000"/><text x="3" y="14" font-size="11" fill="#fff">${legende}</text></svg>`,
        ),
        left: x,
        top: y + H - 22,
      },
    );
  }
  await sharp({
    create: { width: COLONNES * L, height: Math.ceil(candidates.length / COLONNES) * H, channels: 3, background: "#00c000" },
  })
    .composite(tuiles)
    .jpeg({ quality: 85 })
    .toFile(planche);
  console.log(`Planche (fond vert : tout reste de boîtier s'y voit) : ${planche}`);
  for (const s of sautees) console.log(`  sautée : ${s}`);
  process.exit(0);
}

let recadrees = 0;
const ignorees = [...sautees];
for (const [n, c] of candidates.entries()) {
  if (sauf.has(n + 1)) {
    ignorees.push(`${c.nom} (n° ${n + 1} refusé sur la planche)`);
    continue;
  }
  const decoupee = await sharp(c.image).extract(c.zone).toBuffer();
  const base = `${c.jeu.id}/${c.sortie.region.toLowerCase()}-${Date.now().toString(36)}`;
  for (const taille of TAILLES) {
    const webp = await sharp(decoupee)
      .resize({ width: taille, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const { error } = await supabase.storage
      .from("jaquettes")
      .upload(`${base}-${taille}.webp`, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (error) throw new Error(`${c.nom} : ${error.message}`);
  }
  const { error } = await supabase
    .from("releases")
    .update({ jaquette_path: base })
    .eq("game_id", c.jeu.id)
    .eq("region", c.sortie.region);
  if (error) throw new Error(`${c.nom} : ${error.message}`);
  if (c.sortie.jaquette_path !== base)
    await supabase.storage.from("jaquettes").remove(TAILLES.map((t) => `${c.sortie.jaquette_path}-${t}.webp`));
  recadrees++;
  console.log(`${c.nom} : boîtier retiré`);
  await new Promise((r) => setTimeout(r, 5)); // chemins versionnés distincts (horodatage en base 36)
}
console.log(`${recadrees} jaquette(s) recadrée(s) ; ${ignorees.length} ignorée(s)`);
for (const s of ignorees) console.log(`  ${s}`);
