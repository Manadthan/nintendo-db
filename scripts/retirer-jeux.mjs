// Jeux retirés du catalogue le 20/11/2026 (décision du propriétaire après le contrôle par les bases officielles :
// aucune boîte Nintendo). Même logique que l'administration : jaquettes du jeu supprimées du stockage, puis le jeu
// (ses sorties suivent), comme src/lib/jaquettes/supprimer.ts ; puis une exclusion pour que l'import ne le remette pas.
// Star Fox Guard (Wii U) est gardé : boîte et disque propres, vendu aussi avec Star Fox Zero.
// Lancé à la main depuis la session Claude :  SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/retirer-jeux.mjs
import { createClient } from "@supabase/supabase-js";

/** [console, jeu du site, titre gardé dans l'exclusion, raison]. */
const JEUX = [
  ["wii-u", "wii-karaoke-u", "Wii Karaoke U", "téléchargement seulement (disque d'essai au Japon)"],
  ["switch", "kirby-fighters-2", "Kirby Fighters 2", "téléchargement seulement"],
  ["switch", "the-stretchers", "The Stretchers", "téléchargement seulement"],
  ["switch", "bakumatsu-renka-shinsengumi", "Bakumatsu Renka SHINSENGUMI", "édité par D3 Publisher"],
];

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY requis");
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

for (const [consoleSlug, slug, titre, raison] of JEUX) {
  const { data: jeu, error } = await supabase
    .from("games")
    .select("id, console_id, consoles!inner(slug)")
    .eq("slug", slug)
    .eq("consoles.slug", consoleSlug)
    .maybeSingle();
  if (error) throw new Error(`${slug} : ${error.message}`);
  if (jeu) {
    const { data: fichiers, error: e0 } = await supabase.storage.from("jaquettes").list(jeu.id, { limit: 1000 });
    if (e0) throw new Error(`${slug} : ${e0.message}`);
    if (fichiers?.length) {
      const { error: e1 } = await supabase.storage.from("jaquettes").remove(fichiers.map((f) => `${jeu.id}/${f.name}`));
      if (e1) throw new Error(`${slug} : ${e1.message}`);
    }
    const { error: e2 } = await supabase.from("games").delete().eq("id", jeu.id);
    if (e2) throw new Error(`${slug} : ${e2.message}`);
    console.log(`${consoleSlug} ${slug} : supprimé (${fichiers?.length ?? 0} fichier(s))`);
  }
  const { data: c, error: e3 } = await supabase.from("consoles").select("id").eq("slug", consoleSlug).single();
  if (e3) throw new Error(`${consoleSlug} : ${e3.message}`);
  const { error: e4 } = await supabase
    .from("exclusions")
    .upsert({ console_id: c.id, slug, titre, raison }, { onConflict: "console_id,slug" });
  if (e4) throw new Error(`${slug} : ${e4.message}`);
  console.log(`${consoleSlug} ${slug} : exclu de l'import`);
}
