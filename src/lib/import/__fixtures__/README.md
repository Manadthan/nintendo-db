# Fixtures de l'import

Copies figées des sources de l'import (DESIGN ADR-03) : les tests ne contactent jamais les sites en direct.

## `wii-u-wikipedia.html`

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Wii_U_games&action=render |
| Révision | 1380261790 (14/10/2026 19:04 UTC), téléchargée le 16/11/2026 |
| Licence | CC BY-SA 4.0 — Wikipédia, contributeurs de « List of Wii U games » |
| Contenu | Premier tableau `wikitable` seul (792 jeux), sans annotations techniques ni renvois aux références |

Fabriquée par :

```
node scripts/fixture-wikipedia.mjs <page.html> > src/lib/import/__fixtures__/wii-u-wikipedia.html
```

Résultat attendu de la lecture : **50 jeux** en boîte (†) dont Nintendo est éditeur dans au moins une région.

## `igdb/*.json`

| | |
|---|---|
| Source | API IGDB v4 (`POST https://api.igdb.com/v4/games`), plateforme Wii U (41) |
| Capture | Workflow « Capturer les fixtures IGDB » (`scripts/capture-igdb.mjs`), le 16/11/2026 |
| Conditions | IGDB (Twitch Developer Service Agreement) : stockage autorisé, mention d'IGDB visible sur le site |
| Contenu | Une recherche par fichier : `requete` envoyée et `reponse` brute d'IGDB |

10 titres choisis pour leurs pièges : DLC et packs renvoyés par la recherche (Mario Kart 8, Hyrule Warriors),
suites et compilations (NES Remix, Star Fox Zero), titres régionaux (Kirby, Art Academy, Fatal Frame / Project Zero),
titre seulement proche (« Wii Karaoke U by Joysound »).

Pour recapturer : onglet Actions → « Capturer les fixtures IGDB » → Run workflow, sur une branche (jamais `main`) ;
les fichiers sont enregistrés par un commit dans cette branche.
