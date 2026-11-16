// Capture de réponses IGDB réelles pour les fixtures de l'import (#33). Lancé par le workflow
// « Capturer les fixtures IGDB », avec les secrets IGDB_CLIENT_ID et IGDB_CLIENT_SECRET.
// N'écrit que les réponses d'IGDB (une ligne « FIXTURE <nom> <json> » par titre), jamais les identifiants.

const { IGDB_CLIENT_ID: clientId, IGDB_CLIENT_SECRET: secret } = process.env;
if (!clientId || !secret) throw new Error("Secrets IGDB_CLIENT_ID / IGDB_CLIENT_SECRET manquants");

// Titres de la liste Wikipédia (#32), dont des cas ambigus (suites, titres régionaux, homonymes).
const TITRES = {
  "mario-kart-8": "Mario Kart 8",
  splatoon: "Splatoon",
  "kirby-and-the-rainbow-paintbrush": "Kirby and the Rainbow Curse",
  "wii-karaoke-u": "Wii Karaoke U",
  "nes-remix": "NES Remix",
  "star-fox-zero": "Star Fox Zero",
  "project-zero-maiden-of-black-water": "Fatal Frame: Maiden of Black Water",
  "art-academy-atelier": "Art Academy: Home Studio",
  "hyrule-warriors": "Hyrule Warriors",
  "bayonetta-2": "Bayonetta 2",
};

const jeton = await fetch(
  `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`,
  { method: "POST" },
);
if (!jeton.ok) throw new Error(`Jeton Twitch refusé : HTTP ${jeton.status}`);
const { access_token: token } = await jeton.json();

const CHAMPS = [
  "name",
  "platforms",
  "first_release_date",
  "cover.image_id",
  "alternative_names.name",
  "alternative_names.comment",
  "game_localizations.name",
  "game_localizations.region.identifier",
  "game_localizations.cover.image_id",
].join(",");

for (const [nom, titre] of Object.entries(TITRES)) {
  const corps = `search "${titre.replace(/"/g, '\\"')}"; fields ${CHAMPS}; where platforms = (41); limit 10;`;
  const reponse = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: { "Client-ID": clientId, Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: corps,
  });
  if (!reponse.ok) throw new Error(`IGDB « ${titre} » : HTTP ${reponse.status} ${await reponse.text()}`);
  console.log(`FIXTURE ${nom} ${JSON.stringify({ requete: corps, reponse: await reponse.json() })}`);
  await new Promise((r) => setTimeout(r, 300)); // 4 requêtes/s au plus (R7)
}
