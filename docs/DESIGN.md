# Conception — Nintendo DB

> Étape 2 du playbook : **comment** construire ce que décrit `docs/SPEC.md` v1.2.
>
> Version 1.40 — 24/11/2026 — statut : **à valider**
>
> | Version | Date | Changements |
> |---|---|---|
> | 1.40 | 24/11/2026 | **ADR-19 — Guides japonais** (SPEC v1.47, US-27 et US-28) : tables `guides`, `guides_jeux` (plusieurs à plusieurs) et `guides_exclus` ; couverture servie par Google Books ; guides du catalogue chargés seulement quand « Guides » est cochée ; page `/guides/[isbn]` ; remplissage depuis la session après une planche ; plan en 5 PR (§8, étape 29) |
> | 1.39 | 24/11/2026 | **Guides : 3DS et Switch d'abord** (intention v1.7, §1 septdecies) : couvertures du rétro introuvables (1 sur 150 ISBN) ; 3DS + Switch : 16 jeux sur 40 avec un guide, couvertures **Google Books** pour 26 ISBN sur 39 (300 px, clé, pays Japon) ; conditions de Google Books ; essais en direct depuis la session (hôtes ajoutés) |
> | 1.38 | 24/11/2026 | **Étude des guides japonais** (étape 29, §1 septdecies) : NDL Search retenu pour la liste (49 jeux rétro sur 100 avec un guide, 95 % avec ISBN) ; couvertures introuvables (0 / 60) : étude v3 des couvertures |
> | 1.37 | 24/11/2026 | **Guides japonais** (étape 29, intention v1.6) : ajoutés au backlog, étude des sources d'abord (§11) |
> | 1.36 | 23/11/2026 | **Étape 28 terminée** : captures RAWG en ligne, 804 jeux (§11, BILAN §15) |
> | 1.35 | 22/11/2026 | **Étude RAWG** (étape 28, §1 sexdecies) : 39 jeux sur 48 retrouvés au titre identique, 44 avec les suffixes « (année) » et « (console) » ignorés ; Virtual Boy et Switch 2 absents de RAWG ; 6 captures au plus ; version réduite 640 vérifiée (ADR-18 points 2 et 3 précisés) |
> | 1.34 | 22/11/2026 | **Étape 26 terminée** : dates rétro comparées à ScreenScraper sur les 585 jeux, 58 années différentes vérifiées sur Wikipédia, 4 corrigées et verrouillées ; éditeurs laissés tels quels (§11) |
> | 1.33 | 22/11/2026 | **Captures RAWG** (étape 28, SPEC v1.43) : ADR-18 (adresses des captures RAWG en base, images servies par RAWG, rapprochement par titre et console, import une fois par tâche GitHub), plan en 5 PR (§11) |
> | 1.32 | 22/11/2026 | **ScreenScraper, dates et éditeurs** : tâche « Étude ScreenScraper dates » en lecture seule, échantillon rétro comparé par région (§11) |
> | 1.31 | 22/11/2026 | **ScreenScraper, bilan des jaquettes** : 2e passage +49 (1 refusée), 191 en tout ; 79 versions encore sans jaquette, introuvables chez ScreenScraper ou sans boîte de leur région (§11) |
> | 1.30 | 22/11/2026 | **Étape 25 terminée** (#210, #211, #212) : prix eBay en ligne ; reste l'accès aux ventes terminées (§11) |
> | 1.29 | 22/11/2026 | **ScreenScraper, 2e passage** : 142 jaquettes écrites le 22/11 (128 versions encore sans jaquette) ; recherche par code produit puis par chaque titre et sa forme courte ; rapprochements « ≈ » jugés sur la planche ; boîtes refusées jamais redéposées (§11) |
> | 1.28 | 22/11/2026 | **Prix eBay** (étape 25, SPEC v1.42) : étude du 22/11 (§1 quindecies), ADR-17 (prix demandés à eBay à l'ouverture de la fiche, gardés 6 h, rien en base), plan en 3 PR |
> | 1.27 | 22/11/2026 | **Étude eBay** (étape 25) : tâche GitHub en lecture seule, annonces en cours et ventes terminées (§11) ; ligne ajoutée après coup |
> | 1.26 | 22/11/2026 | **Jaquettes ScreenScraper** : étude du 22/11 (164 versions sur 270 avec la boîte de la bonne région, 99 jeux introuvables par le titre, quota 20 000 requêtes par jour) ; relais vers le bucket privé, planche, puis écriture ; source `screenscraper` (migration 0027) gardée par l'import (§11) |
> | 1.25 | 22/11/2026 | ADR-11 : catalogue des statistiques et des profils **en cache 5 min**, vidé par chaque modification de l'administration ; possessions toujours lues à l'ouverture (audit de performance, correction D) |
> | 1.24 | 22/11/2026 | **ScreenScraper** (étape 26) : jaquettes manquantes d'abord (270 versions sur 2 837 le 22/11, dont 177 japonaises), dates et éditeurs ensuite ; tâche GitHub « Étude ScreenScraper » en lecture seule (§11) |
> | 1.23 | 21/11/2026 | **Collectionneurs invités** (SPEC v1.39, intention v1.5) : ADR-16 (rôle propriétaire en base, écriture du catalogue verrouillée, invitations par lien à jeton haché, profils, badges calculés), modèle de données, plan de l'étape 27 en 6 PR |
> | 1.22 | 21/11/2026 | **Frise** (SPEC v1.38) : étape 24 ; backlog des étapes 25 à 27 (§11) |
> | 1.21 | 21/11/2026 | **Séries** (SPEC v1.37) : étude Wikidata (§1 quattuordecies), ADR-15 (titre, puis Wikidata, puis main ; plusieurs séries ; noms de référence), colonne `series text[]` (migration 0023), étape 23 |
> | 1.20 | 20/11/2026 | **Ordinateur** (SPEC v1.36) : conteneur `max-w-7xl` centré, grille du catalogue par paliers Tailwind (`sm` 3, `md` 4, `lg` 5, `xl` 6 colonnes), fiche en grille 2 colonnes dès `lg` (jaquette collante) ; tests Playwright à 1440 × 900 (`ordinateur.spec.ts`) |
> | 1.19 | 20/11/2026 | **Éditeur officiel par région** (§1 terdecies, mesures) : ADR-14 (l'éditeur officiel de la région l'emporte ; cartes 3DSWare en boîte) |
> | 1.18 | 20/11/2026 | **Contrôle par les bases officielles** (§1 terdecies) : jeux absents expliqués ; ADR-13 (éditeur repris de Nintendo Europe et Japon quand GameTDB est vide ; DS : identifiants en Y et régions vides) ; étape 22 |
> | 1.17 | 20/11/2026 | Source de jaquette `nintendo` (migration 0021) : packshots PEGI de nintendo.com/eu trouvés par code produit (API de recherche de Nintendo Europe), copiés une fois par `scripts/jaquettes-nintendo-eu.mjs`, gardés par l'import comme gamecartdb (`estGardee`) |
> | 1.16 | 20/11/2026 | **Boîte PAL française d'abord** (Wii U, Switch, SPEC v1.28) : ordre FR, EN, DE au relais ; `scripts/jaquettes-pal-francaises.mjs` remplace une fois les jaquettes PAL GameTDB en place |
> | 1.15 | 19/11/2026 | **NES** (étape 21) : étude (§1 duodecies), plan §8 |
> | 1.14 | 19/11/2026 | **Super Nintendo** (étape 20) : étude (§1 undecies), plan §8 |
> | 1.13 | 19/11/2026 | **Virtual Boy** (étape 19) : étude (§1 decies), plan §8 |
> | 1.12 | 19/11/2026 | **Game Boy** (étape 18) : étude (§1 nonies), plan §8 |
> | 1.11 | 19/11/2026 | **Game Boy Color** (étape 17) : étude (§1 octies), ADR-12, plan §8 |
> | 1.10 | 19/11/2026 | **Statistiques** (étape 16) : ADR-11, plan §8 |
> | 1.9 | 19/11/2026 | **N64 + GBA complétées** (étape 15) : mesures No-Intro (§1 septies), ADR-10, plan §8 |
> | 1.8 | 19/11/2026 | **N64 + GBA** (étape 14) : étude (§1 septies), ADR-09 libretro-thumbnails, plan §8 |
> | 1.7 | 19/11/2026 | **Note Metacritic** (étape 13) : étude (§1 sexies), ADR-08, colonnes `metacritic_*`, plan §8 |
> | 1.6 | 19/11/2026 | **Ma collection** (étape 12) : ADR-07, table `possessions`, plan §8 |
> | 1.5 | 18/11/2026 | **GameCube** (étape 11) : étude (§1 quinquies), plan §8 |
> | 1.4 | 18/11/2026 | **Switch + Switch 2** (étape 10) : étude (§1 quater), import des nouveautés (ADR-03 point 6), exclusions mémorisées, plan §8 |
> | 1.3 | 18/11/2026 | **DS + 3DS** (étape 9) : étude (§1 ter), proportions des jaquettes par console, plan §8 |
> | 1.2 | 17/11/2026 | **Wii** (étape 8) : étude GameTDB (§1 bis), import GameTDB seul, relais étendu (face avant découpée), catalogue toutes consoles (ADR-06), plan §8 |
> | 1.1 | 17/11/2026 | **Référencement** (étape 7) : `src/lib/referencement/`, `sitemap.ts`, `robots.ts`, `metadataBase` = adresse de production |
> | 1.0 | 17/11/2026 | **Genres** lus dans GameTDB (48 jeux sur 48), traduits en français, gardés dans `games.genre` (US-06) |
> | 0.9 | 17/11/2026 | Routes de correction sous `/admin` (protégées par le proxy) : `/admin/jeux`, `/admin/jaquettes` (#42 à #45) |
> | 0.8 | 17/11/2026 | **IGDB retiré** (#58) : GameTDB donne aussi les titres japonais ; plus de rapprochement ni de secrets Twitch |
> | 0.7 | 17/11/2026 | **Relais GameTDB** (#53) : GameTDB refuse les serveurs de Vercel ; une tâche GitHub dépose base et scans dans un bucket privé |
> | 0.6 | 17/11/2026 | Jaquettes en 3 tailles (300/600/**768**) ; **GameTDB** : scans de boîtes par région (prioritaires sur IGDB) et codes produit (étude du 17/11) ; R6 et R8 traités |
> | 0.5 | 16/11/2026 | R6 : jaquettes IGDB qui ne sont pas des scans de boîte (#40) |
> | 0.4 | 16/11/2026 | §5 aligné sur la migration 0001 (#17) : plus de `titre_normalise` (recherche dans le navigateur, ADR-05) ; valeurs fixes en types énumérés Postgres |
> | 0.3 | 16/11/2026 | ADR-02 : plus de région globale (marché dans le catalogue, région sur la fiche) ; ADR-05 : recherche dans le navigateur en v1 ; routes |
> | 0.2 | 16/11/2026 | v1 Wii U ; sources Wikipédia + IGDB (Wikidata, MobyGames écartés) ; jaquettes copiées chez nous |
> | 0.1 | 16/11/2026 | Premier brouillon (Wikidata + Wikipédia, liens d'images externes) |

## 1. Étude des sources (16/11/2026)

| Source | Ce qu'elle apporte | Conditions | Verdict |
|---|---|---|---|
| **Wikipédia** « List of Wii U games » | 792 jeux, dont **67 édités par Nintendo**, **50 en boîte** (marqués †) ; dates **Japon / Amérique du Nord / Australasie / Europe** ; titres NA et PAL quand ils diffèrent | CC BY-SA 4.0 : attribution | **Retenue** : liste de référence et dates |
| **IGDB** (Twitch) | **Jaquettes par région** (`game_localizations`), haute définition ; titres régionaux ; dates par région | Gratuit, y compris commercial ; **stockage encouragé** ; mention visible d'IGDB ; compte développeur Twitch | Retenue (v0.2), **retirée en v0.8** (#58) : GameTDB couvre titres japonais et jaquettes |
| Wikidata | Liste et titre japonais corrects ; dates PAL 15–23 % ; aucun code produit ; pas de jaquettes ; pas de distinction boîte / dématérialisé | CC0 | Écartée (redondante avec les deux autres) |
| MobyGames | Données riches | Page « Just a moment… » anti-robots : conditions illisibles par un programme ; API devenue payante (à confirmer) | Écartée |
| **GameTDB** (étude du 17/11/2026) | **Scans de vraies boîtes** par région (bandeau Wii U, PEGI/ESRB/CERO), 768 × 1080 = proportions d'une boîte ; base XML téléchargeable (identifiants de disque → **codes produit**, dates, éditeur) | Pas de licence formelle ; base « pour que chacun l'utilise dans tout projet lié aux jeux » ; images propriété des éditeurs (comme IGDB) | **Retenue** : boîtes par région, scans (132 sur 135 disques), titres japonais (locale JA), codes produit |
| Redump / No-Intro | Codes produit des disques | Redump injoignable depuis l'environnement | À revoir pour les codes produit (piste) |

## 1 bis. Étude GameTDB pour la Wii (17/11/2026)

Base `wiitdb.zip` du 17/11 : disques du commerce (identifiant en **R** ou **S** ; écartés : disques système, démos,
`CUSTOM`), régions NTSC-J / NTSC-U / PAL.

| Mesure | Résultat |
|---|---|
| Jeux avec au moins une boîte Nintendo (code `01` ou éditeur « Nintendo », comme en Wii U) | **88** (64 dans les 3 régions, 12 Japon seul, 12 autres combinaisons) ; 234 disques |
| Dates (au jour près), genres, titres japonais (locale JA) | **100 %** des disques |
| Développeur | 232 disques sur 234 |
| Scans de boîtes `coverfullHQ` (boîte dépliée 1024 × 680, PNG ≈ 1 Mo) | **215 sorties sur 226** (95 %) ; les 11 manquantes sont japonaises |
| `coverHQ` (face seule, comme la Wii U) | **N'existe pas** pour la Wii |
| Wikipédia « List of Wii games » | Une page de 4 Mo, structure différente : le lecteur Wii U ne la lit pas |
| Autres sources d'images | libretro-thumbnails : même résolution (≈ 486–512 px), noms à deviner ; The Cover Project : inaccessible d'ici ; IGDB : pas des scans |

Jeux édités par Nintendo dans une seule région : 14 (Just Dance 2, GoldenEye 007, Epic Mickey au Japon ; Trauma
Center en Europe…), gardés selon la règle Wii U (décision du propriétaire). Le Wii Startup Disc (genre « software »)
n'est pas un jeu : écarté à l'import (#90), soit **87 jeux**.

## 1 ter. Étude GameTDB pour la DS et la 3DS (17/11/2026)

Bases `dstdb.zip` et `3dstdb.zip` du 17/11 ; jeu retenu si au moins une carte a l'éditeur « Nintendo » (champ
`publisher` : l'identifiant de 4 caractères ne porte pas de code d'éditeur).

| Mesure | DS | 3DS |
|---|---|---|
| Types gardés | `DS`, `DSi` (pas `DSiWare`) | `3DS`, `New3DS` (pas `3DSWare`, `VC-*`) |
| Écartés | identifiants en **Y** (démos, téléchargements ; règle levée en v1.18, ADR-13), genre `software`/`demo`/`sampler`, titres « (Demo) », « Download », « Kiosk », « Taikenban » | identifiants autres que **A, B, C, E** (U = Super Nintendo, J = eShop, V = codes, H = logiciel), mêmes genres et titres |
| Jeux Nintendo / cartes | **116** / 358 | **118** / 295 |
| Dates au jour près | 324 / 358 | 276 / 295 |
| Titres japonais (locale JA) | 99 / 106 cartes JAP | 81 / 85 |
| Scans `coverHQ` 768 × 680 (face seule) | 236 / 358 (les JAP surtout manquent) | 277 / 295 |
| + repli `coverM` 400 × 352 | **352 / 358** | **293 / 295** |

Pièges : une carte PAL allemande donne son titre allemand en locale EN (« Professor Layton und… ») → préférer la
carte dont la 4ᵉ lettre est P (puis U, X, Y, Z) ; langue du scan d'après cette lettre (D → DE, F → FR…). Boîtes
DS/3DS presque carrées (768 × 680), Wii/Wii U en hauteur (27 × 38) : **proportions par console**.

## 1 quater. Étude Switch et Switch 2 (18/11/2026)

**Switch — GameTDB** (`switchtdb.zip`, 25 Mo) : types `Switch` (4 879 cartouches) et `eShop`. Identifiant de
5 caractères (`AAAAA`), les 4 premiers communs aux variantes d'un jeu.

| Mesure | Résultat |
|---|---|
| Cartouches éditées par Nintendo (hors démos, outils) | **140**, **113 jeux** (4 premiers caractères) |
| Région | **97 « ALL »** (une cartouche mondiale), sinon `JPN`, `USA`, `EUR`, `USA,EUR`… ; 7 seulement CHN/KOR |
| Variantes d'un même jeu | 19 jeux : cartouches par région (Splatoon 2 : JPN, USA, EUR), packs (« [Starter Pack] »), éditions spéciales, extensions (« + Octo Expansion ») |
| Dates au jour près | 97 / 140 |
| Titres japonais (locale JA) | 66 / 140 ; développeur 98 / 140 |
| Scans `coverHQ` 1166 × 1888 | US ≈ 85 %, EN ≈ 55 %, FR rare, **JA ≈ 10 %** |
| Scan japonais `coverM` 352 × 570 | **97 / 110** cartouches vendues au Japon |

**Switch 2** : GameTDB n'a **pas de base** (`switch2tdb.zip` absent). Wikipédia « List of Nintendo Switch 2 games » :
**34 jeux** dont l'éditeur contient Nintendo ; colonnes Titre, Développeur, Éditeur, **une seule date** ; ne
distingue ni boîte et téléchargement (Welcome Tour, Drag x Drive : téléchargement seul) ni jeux annoncés (« 2027 »).
IGDB : couvertures = illustrations sans garantie de boîte (règles de contribution IGDB) → écarté ; gamecartdb :
images hébergées chez lui, sans source citée → non réutilisables.

## 1 quinquies. Étude GameCube (18/11/2026)

GameTDB range la GameCube dans la base Wii, mais `wiitdb.zip?LANG=EN` ne la contient pas : il faut
`wiitdb.zip?LANG=EN&GAMECUBE=1` (2,4 Mo). Type `GameCube`, 1 708 disques.

| Mesure | Résultat |
|---|---|
| Disques des jeux Nintendo (code `01` ou éditeur Nintendo) | 286, dont **96 démos ou disques spéciaux** en D, E, P, U (« Gekkan Nintendo Tentou Demo », « Interactive Multi-Game Demo », disques bonus, Game Boy Player Start-Up Disc) |
| Disques du commerce (identifiant en G, sans démo) | **151 disques, 56 jeux** (45 dans les 3 régions) ; + Zelda Collector's Edition et Pac-Man Vs. (identifiants en P) |
| Dates au jour près, titres japonais, développeur | 247 / 286, 117 / 117, 222 / 286 |
| Scans `coverfullHQ` (boîte dépliée 1024 × 680, comme la Wii) | **120 / 151** ; les 31 manquants sont japonais (sauf 1) |
| Repli : `cover` (face seule, 160 × 224) | présent pour les disques japonais sans scan |
| Découpe de la face avant (`decouperFaceAvant`, #87) | correcte sur 10 boîtes de 3 régions, montrées au propriétaire avant la spec (BILAN, leçon 9) |

Pièges : Pokémon Channel est classé « software » (le Wii Startup Disc aussi, #90) ; la règle « logiciel » ne
s'applique pas à la GameCube, dont les vrais logiciels (Game Boy Player Start-Up Disc, U) sont déjà écartés par leur
identifiant.

## 1 sexies. Étude de la note Metacritic (19/11/2026)

Metacritic n'a **pas d'accès ouvert** et ses conditions interdisent la collecte automatique de ses pages : la note vient
d'une source qui la cite.

| Source | Mesure (jeux des fixtures) | Verdict |
|---|---|---|
| Wikidata (P444, « note par Metacritic ») | 1 à 15 jeux par console (< 10 %) | Écartée |
| **Wikipédia anglais**, encadré « Video game reviews » (`MC = 85/100`) | Wii U 26/48, GameCube 41/58, Wii 54/87, DS 62/114 (29 articles non trouvés par le titre), Switch 78/112 : **≈ 60 %** | **Retenue**, CC BY-SA |
| OpenCritic, IGDB | Clé d'accès ou note différente de Metacritic | Écartées |

Pièges : un article couvre parfois plusieurs consoles (Metroid Prime et sa version Switch, Smash Bros. 3DS / Wii U)
→ la note doit porter le nom de la console du jeu, sinon elle est **ambiguë** et laissée vide ; Wikipédia limite le débit
(erreurs 429 dès quelques dizaines d'appels rapprochés) → lots de 20 titres par appel, réessais espacés.

## 1 septies. Étude Nintendo 64 et Game Boy Advance (19/11/2026)

GameTDB ne couvre ni la N64 ni la GBA (seulement Wii, Wii U, GameCube, DS, 3DS, Switch, PS3).

| Mesure | N64 | GBA |
|---|---|---|
| Liste Wikipédia : colonnes | Title, Developer(s), Publisher(s), First released, Release date (Japan, North America, PAL) | Title(s), Developer(s), Publisher(s), Release date(s) (JP, NA, EU/PAL, AU, KOR), Region(s) released ; dates précédées d'une clé de tri cachée |
| Jeux édités par Nintendo (une région au moins) | **58** | **≈ 120** |
| Boîtes **libretro-thumbnails** (dépôt GitHub, noms No-Intro « Titre (USA) ») | 1 115 fichiers ; boîte trouvée par le titre pour **52 / 58** jeux (US 50, Europe 41, Japon 18) | 5 961 fichiers ; **85 / 120** (US 61, Europe 35, Japon 39) |
| Taille, forme | 512 px ; 512 × 357 (US, Europe), 366 × 512 (Japon) | 512 px ; 512 × 512 (US, Europe), 512 × 326 (Japon) |
| Codes produit | aucune source simple (No-Intro à étudier plus tard) | idem |
| **No-Intro** (v1.9, `libretro-database`, `metadat/no-intro/*.dat`) : nom + numéro de série par cartouche | 2 263 entrées ; série trouvée pour **51 / 58** jeux ; codes JAP 36 / 43, US 49 / 51, PAL 44 / 46 | 3 509 entrées ; **82 / 120** ; codes JAP 77 / 119, US 55 / 69, PAL 55 / 69 |
| Boîtes japonaises, titre **+ série** (v1.9) | **37 / 43** (18 par le titre seul) | **76 / 119** (39 par le titre seul) |

libretro-thumbnails : pas de licence formelle (comme GameTDB), images propriété des éditeurs ; planche d'exemples montrée
au propriétaire avant la spec (BILAN, leçon 9). Les boîtes japonaises portent souvent le titre japonais romanisé (« Zelda
no Densetsu ») : introuvables par le titre anglais, elles restent en vignette neutre. **v1.9** : le numéro de série
No-Intro (`NZSE` US, `NZSJ` Japon, `NZSP` Europe : 3 caractères communs + lettre de région) relie ces noms ; planche de
boîtes japonaises ainsi retrouvées montrée au propriétaire (Majora's Mask : boîte intérieure du pack, gardée). Jeux sans
série : surtout des titres japonais seuls, romanisés autrement (« Dōbutsu no Mori » / « Doubutsu no Mori »).

Référence visuelle : **gamecartdb.com copie ses jaquettes chez lui** (WebP haute définition ≈ 300 Ko, servies par
Vercel avec un cache d'un an). C'est le modèle retenu (ADR-04).

## 1 octies. Étude Game Boy Color (19/11/2026)

Même recette que la N64 et la GBA (ADR-09, ADR-10) : GameTDB ne couvre pas le Game Boy Color.

| Mesure | Game Boy Color |
|---|---|
| Liste Wikipédia | Une seule ligne d'en-tête : Title, Dual Mode, Cartridge feature, Developer, Publisher, First released (dates étiquetées « (JP) », « (NA) », « (EU) » dans une cellule, comme la GBA), puis JP, NA, EU/PAL en Oui / Non |
| Jeux édités par Nintendo (une région au moins) | **45** sur 915 (dont les cartouches noires « Dual Mode ») ; sorties JAP 29, US 37, PAL 33, toutes datées |
| Boîtes libretro-thumbnails | 1 524 fichiers ; au moins une boîte pour **39 / 45** jeux : US 35 / 37, PAL 30 / 33, **JAP 10 / 29** (titres japonais romanisés : « Mario Tennis GB ») |
| Taille, forme | 512 × 512 (US, Europe), 512 × 646 (Japon, en hauteur) |
| Séries No-Intro | 2 446 entrées, mais la série manque pour la plupart des jeux Game Boy Color : codes US 8 / 37, PAL 3 / 33, JAP 2 / 29 |

Planche d'exemples montrée au propriétaire avant la spec (leçon 9). Éditeurs écrits en liste sans séparateur
(« NintendoKemco ») : le lecteur sépare désormais aussi les éléments de liste.

## 1 nonies. Étude Game Boy (19/11/2026)

Même recette que la Game Boy Color (ADR-09, ADR-10, ADR-12).

| Mesure | Game Boy |
|---|---|
| Liste Wikipédia | Comme la N64 : en-tête sur 2 lignes, « Release date » puis Japan, North America, **PAL region** (nouveau libellé, ajouté au lecteur) |
| Jeux édités par Nintendo (une région au moins) | **91** sur 1 043 : partout 34, US + PAL 21, **PAL seul 25**, JAP seul 7, US seul 4 |
| Boîtes libretro-thumbnails | 1 647 fichiers ; au moins une boîte pour **84 / 91** : US 73 / 78, PAL 74 / 83, JAP 31 / 72 |
| Taille, forme | 512 × 512 (US, Europe), 441 × 512 (Japon) |
| Séries No-Intro | 2 144 entrées ; série presque absente (codes US 1 / 78, PAL 3 / 83) : les cartouches d'avant 1996 ne la portent pas |

Planche d'exemples montrée au propriétaire avant la spec (leçon 9).

## 1 decies. Étude Virtual Boy (19/11/2026)

| Mesure | Virtual Boy |
|---|---|
| Liste Wikipédia | Comme la N64 : « Release date » puis Japan, North America (pas de colonne européenne) ; « —N/a » pour une sortie absente ; éditeurs écrits « T&E Soft (JP), Nintendo (NA) » |
| Jeux édités par Nintendo | **11** sur 22 ; JAP 11, US 11, PAL 0 |
| Boîtes libretro-thumbnails | 42 fichiers ; US 10 / 11 ; JAP 8 / 11 en comptant les boîtes « (Japan, USA) », qui sont américaines |
| Taille, forme | ≈ 512 × 506 (presque carrées) |
| Séries No-Intro | 64 entrées ; JAP 9 / 11, US 5 / 11 (les autres jeux ont une cartouche commune « Japan, USA ») |

Écarts de lecture corrigés : « —N/a » = non sorti (sinon sortie sans date) ; étiquettes de région entre parenthèses
dans la cellule Publisher ; « & » écrit « _ » dans les noms de fichiers libretro (« T_E Virtual Golf »). Planche
montrée au propriétaire avant la spec (leçon 9).

## 1 undecies. Étude Super Nintendo (19/11/2026)

| Mesure | Super Nintendo |
|---|---|
| Liste Wikipédia | Comme la N64 (Japan, North America, PAL region) ; « Cancelled » pour une sortie annulée ; titres japonais cités après le titre principal dans la même cellule |
| Jeux édités par Nintendo | **98** sur 1 749 : JAP 84, US 66, PAL 61 ; Nintendo en Europe seulement : 19 |
| Boîtes libretro-thumbnails | 3 782 fichiers ; US 65 / 66, PAL 48 / 61 ; JAP 35 / 84 par le titre principal, **58 / 84** avec les titres japonais de la cellule |
| Taille, forme | 512 × ≈ 360 (US, Europe, en largeur), 283 × 512 (Japon, en hauteur) |
| Séries No-Intro | 3 746 entrées ; aucune série pour ces jeux (cartouches d'avant 1996) : codes à la main |

Planche montrée au propriétaire avant la spec (leçon 9). « ō » romanisé « ou » chez libretro (« Chou Makaimura ») :
confondus dans la clé de titre.

## 1 duodecies. Étude NES (19/11/2026)

| Mesure | NES |
|---|---|
| Liste Wikipédia | « Release date » puis JP, NA, PAL ; titres japonais cités dans la cellule (« Family Trainer ») |
| Jeux édités par Nintendo | **104** sur 1 370 : JAP 76, US 90, PAL 84 ; Nintendo en Europe seulement : 24 |
| Boîtes libretro-thumbnails | 13 896 fichiers (dont des noms TOSEC, ignorés) ; US 86 / 90, PAL 78 / 84, JAP 55 / 76 **avant** la règle « World » |
| Taille, forme | ≈ 355 × 512 (en hauteur) ; quelques boîtes européennes 512 × 712 |
| Séries No-Intro | 13 296 entrées, 2 séries : codes à la main |

Les boîtes « (World) » (92 fichiers) sont la boîte américaine noire (Super Mario Bros., Duck Hunt) : réservées aux
États-Unis et à l'Europe. Planche montrée au propriétaire avant la spec (leçon 9).

## 1 terdecies. Contrôle par les bases officielles de Nintendo (20/11/2026)

Demande du propriétaire : trop d'erreurs sur les jeux manquants. Catalogue des 6 consoles récentes (504 jeux) comparé
à deux bases officielles, par code produit (sinon titre anglais). Rapport : 301 écarts (artifact « Contrôle du catalogue »).

| Source | Contenu | Couverture |
|---|---|---|
| Nintendo Europe (`searching.nintendo-europe.com`, API Solr publique) | 23 928 jeux : éditeur, codes produit, dates, support (`*_gamecard`, `*_disc`, `*_cartridge`) | toutes consoles ; codes absents des jeux Switch récents et de la DS |
| Nintendo Japon (`search.nintendo.jp`) | 19 428 jeux : éditeur japonais, date, format (`*_CARD`, `*_DOWNLOADABLE` = boîte ; `*_DL` = téléchargement) | Switch, Switch 2, 3DS, Wii U (ni Wii ni DS) |
| Nintendo US | boutique : date, éditeur, code produit, page par page | recherche par un service tiers non autorisé : pas encore utilisé |

| Écart | Nombre | Cause principale |
|---|---|---|
| Jeux absents | 78 | **éditeur vide dans GameTDB** (686 cartouches Switch, dont ~20 jeux Nintendo : Fire Emblem: Three Houses, Pikmin 4…) ; **DS : identifiants en Y écartés** comme démos (~15 jeux : Kirby Super Star Ultra, Layton, Rhythm Paradise, Dragon Quest IX…) ; **DS : région vide** (Pokémon Noir et Blanc, 1 et 2) |
| Régions | 82 | cartes d'une région éditées par un autre (Level-5, Marvelous) ; à revoir au cas par cas |
| Dates | 123 | dates de réédition (GameTDB), années seules (« 1er janvier ») |
| Éditeur | 18 | éditeur d'une seule région étendu aux autres (Hyrule Warriors au Japon : Koei Tecmo) |

**Jeux encore absents après l'ADR-13** (mesure du 20/11/2026, bases du jour) :

| Console | Cause | Règle | Effet |
|---|---|---|---|
| Switch | GameTDB donne l'éditeur d'une autre région (« Square Enix », « Tecmo Koei », « Ubisoft ») | l'éditeur officiel de la région de la carte l'emporte | **+4 jeux** : Dragon Quest Builders 1 et 2, Hyrule Warriors: Definitive Edition, Mario + Rabbids Sparks of Hope (Japon) |
| 3DS | même règle | idem | **+0** : la cause est ailleurs ; 7 cartes de jeux déjà présents changent d'éditeur |
| 3DS | cartes classées **« 3DSWare »** (vendues aussi en téléchargement) alors qu'elles existent en boîte : la seule carte « 3DS » est coréenne ou d'un autre éditeur | carte 3DSWare gardée si la base officielle de sa région la dit en boîte et éditée par Nintendo (Europe : `physical_version_b` ; Japon : `sform` `CTR` ou `CTR_DOWNLOADABLE`, pas `CTRWARE`) | **≈ 11 jeux** : Fire Emblem Fates, Ever Oasis, Story of Seasons, Yo-kai Watch Blasters (×2), Puzzle & Dragons Z, Culdcept, Calciobit, Band Brothers P, Mario & Sonic à Londres (Japon), Hana to Ikimono ; régions ajoutées à 39 jeux déjà présents |
| Wii, DS | pas de code produit chez Nintendo Europe, pas de base japonaise | — | 11 jeux à ajouter à la main |

## 1 quattuordecies. Étude des séries (21/11/2026)

Demande du propriétaire : un filtre par série. La colonne `games.franchise` existe depuis le schéma initial mais n'est
remplie que pour 3 jeux sur 1 126 (données de départ) : aucun import ne la lit.

| Source | Mesure (échantillon de 150 jeux tirés au hasard, graine fixe) | Limites |
|---|---|---|
| **Wikidata**, propriété P179 « fait partie de la série », élément trouvé par la page Wikipédia du jeu (lien gardé, sinon titre anglais) | élément « jeu vidéo » : **120 / 150** (74 par le lien, 46 par le titre) ; **série : 79 / 150 (53 %)** ; plusieurs séries : 13 | noms anglais ou propres à Wikidata (« Megaman », « Yoshi platform series ») ; série large + sous-série (Dr. Mario → Mario) ; certains éléments sans libellé |
| **Titre du jeu** | rattrape des jeux que Wikidata ne classe pas (Mario Slam Basketball, Hamtaro) | ne voit pas les séries absentes du titre (Captain Toad → Mario) |
| **À la main** (US-11) | exact | à réserver aux corrections |

Beaucoup de jeux n'ont vraiment pas de série (Steel Diver, Ring Fit Adventure, Balloon Fight) : ils restent « Sans
série ». **Accès** : l'API de Wikipédia et celle de Wikidata répondent 429 (« too many requests ») à l'adresse partagée
de la session, même pour une seule requête ; les pages publiques (`en.wikipedia.org/wiki/…`, identifiant
`wgWikibaseItemId`) et `www.wikidata.org/wiki/Special:EntityData/{Q}.json` répondent : deux requêtes par jeu, une par
seconde, ≈ 40 min pour tout le catalogue.

**Remplissage du 21/11/2026** (`scripts/series-wikidata.mjs`, tout le catalogue) : élément Wikidata trouvé pour
912 jeux sur 1 126 ; **754 jeux avec au moins une série** (67 %) : titre seul 230, Wikidata seul 136, les deux 388 ;
160 séries, dont 81 hors de la liste de référence gardées sous leur nom Wikidata (Inazuma Eleven, Bomberman, Bravely
Default…) ; 1 page inaccessible (DK: Jungle Climber, rattrapé par le titre). Par console : de 39 / 104 (NES) à
25 / 25 (Switch 2).

## 1 quindecies. Étude eBay (22/11/2026)

Tâche GitHub « Étude eBay » (`scripts/etude-ebay.mjs`, lecture seule ; eBay est injoignable depuis la session), clés
de production du propriétaire. Échantillon : 28 jeux (2 par console : le mieux noté et un autre), 94 couples version ×
marché, 94 appels en 1 min 30.

| Accès | Résultat |
|---|---|
| **Browse** (annonces en cours, ouvert par défaut, 5 000 appels par jour) | ouvert |
| **Marketplace Insights** (ventes terminées, sur demande) | refusé (`invalid_scope`) : demande à faire par le propriétaire |

| Version (marché) | Avec un prix | Annonces pertinentes / lues |
|---|---|---|
| US (eBay US) | 23 / 23 | 771 / 1 113 (69 %) |
| JAP (eBay US, « japanese ») | 24 / 25 | 369 / 1 163 (32 %) |
| PAL (eBay France) | 22 / 23 | 653 / 813 (80 %) |
| PAL (eBay Royaume-Uni) | 23 / 23 | 717 / 1 022 (70 %) |

Médianes crédibles (Super Mario Odyssey US 36 $, Super Mario Galaxy PAL 17 €, Eternal Darkness US 149 $). Limites :
prix **demandés**, pas vendus ; JAP mince sur eBay US (Arkanoid : 3 annonces) ; jeux rares sur 2 à 7 annonces
(Alice in Wonderland PAL France : 2 annonces, médiane 237 €) ; extrêmes à 6 000 $ ou 2 500 £ (scellés, notés) que la
médiane absorbe ; « complet » ou « seul » précisé dans moins d'une annonce sur deux. **Contrat d'eBay** : les données de
Browse ne se gardent pas plus de **6 heures** (lu sur le forum des développeurs ; texte officiel injoignable depuis la
session) : pas de stockage en base.

## 1 sexdecies. Étude RAWG (22/11/2026)

Tâche GitHub « Étude RAWG » (`scripts/etude-rawg.mjs`, lecture seule ; la clé passe dans l'adresse, la session ne
peut pas l'y mettre), clé gratuite du propriétaire. Échantillon : 56 jeux (4 par console : le mieux noté et 3 autres),
104 appels en 1 min 20.

| Résultat | Jeux |
|---|---|
| Plateforme absente de RAWG : **Virtual Boy**, **Switch 2** | 8 |
| **Titre identique** et bonne console | 39 / 48 (81 %) |
| Même jeu, titre RAWG avec un suffixe « (1989) », « (2000) », « (N64) » ou un « The » en tête (Adventures of Lolo, Kirby's Dream Land 2, Alice in Wonderland, 1080° Snowboarding, Bugs Bunny Crazy Castle 3) | 5 |
| Deux versions réunies en un jeu RAWG (Pokémon Black 2 / White 2) | 2 |
| **Autre jeu** (Pikmin 1+2 → Pikmin 2, Famicom Mini SMB 2 → Super Mario Bros., Magical World 2 → Sonic Lost World, 2 jeux SNES japonais → Blackthorne, Shin Megami Tensei If…) | 5 |

Captures : RAWG en donne **6 au plus** ; 31 des 39 jeux identiques en ont 6, les autres 1 à 4 (Picross NP Vol. 1 : 1),
aucun n'en a 0. **Version réduite** `media.rawg.io/media/resize/640/-/…` : HTTP 200, JPEG de 31 Ko contre 103 Ko pour
l'originale. Un jeu sorti sur 2 consoles est un seul jeu RAWG (Pikmin 2 Wii et GameCube : mêmes captures, celles de
l'une ou l'autre console). Conclusions : la règle « titre identique » n'a laissé passer **aucun** autre jeu ; ignorer
« (année) », « (console) » et « The » en tête rattrape 5 jeux sans risque visible ; les versions réunies et les jeux
japonais sans titre anglais restent sans captures.

## 1 septdecies. Étude des guides japonais (24/11/2026)

Tâche GitHub « Étude guides » (`scripts/etude-guides.mjs`, lecture seule ; la session ne joint aucune de ces sources).
Échantillon : 100 jeux rétro sortis au Japon (20 par console : NES, SNES, N64, GB, GBC).

- **1er passage** (#238) : inutilisable. Le titre JAP du catalogue rétro est en **lettres latines** (304 jeux sur
  304 : « Mega Man 3 » et non « ロックマン3 ») ; NDL ne trouve rien par ce titre. Faux rapprochements (guide de
  Breath of the Wild pour Zelda NES) ; 18 refus 429 de NDL à une requête par seconde.
- **2e passage** (#239) : titre japonais lu dans **Wikidata** (article japonais, libellé japonais, P1476) : **85 jeux
  sur 100**. Recherche **NDL Search** (API OpenSearch) une requête toutes les 3 s : 1 refus sur 440 appels. Un livre
  est gardé s'il est un guide (NDC 798 ou « 攻略 », « ガイド »…), contient le titre non suivi d'un chiffre, ne cite pas
  une autre console et, sans console citée, paraît dans les 4 ans.

| Console | Jeux avec ≥ 1 guide | Guides |
|---|---|---|
| N64 | 16 / 20 | 111 |
| GBC | 11 / 20 | 56 |
| GB | 10 / 20 | 27 |
| NES | 7 / 20 | 27 |
| SNES | 5 / 20 (dont 8 Picross NP sans titre japonais) | 31 |

Champs : ISBN 240 guides sur 252, éditeur et pages pour tous, date au mois. Collections reconnues : guides officiels
Shogakukan, 必勝攻略法 Futabasha, Tokuma, T2 Shuppan. **Faux positifs restants** : suite au sous-titre (Kirby's Dream
Land → guides de Kirby Super Deluxe, parus dans les 4 ans), titre générique de série (Derby Stallion '98 → toute la
série) : une **planche** regardée par le propriétaire avant toute écriture, comme pour les jaquettes. Un même guide
peut couvrir **deux jeux** (Pokémon Or et Argent) : lien guide ↔ jeu plusieurs à plusieurs. Internet Archive : scans
japonais pour 11 jeux seulement. **Couvertures : 0 sur 60 ISBN** (openBD ne couvre que les livres récents ; vignette
NDL demandée avec l'ISBN à 10 chiffres au lieu de 13) → étude v3 des couvertures.

**Couvertures, v3 à v3.2 (24/11/2026 au soir).**

- **v3** (#241, tâche GitHub) : arrêtée par la limite de 60 min sans rapport (rien n'était écrit avant la fin ;
  réessais de 20 à 60 s sur les refus 429). **v3.1** (#243) : 20 s par appel, avancement dans le journal, budget de
  temps par phase, rapport toujours écrit. Rétro (100 jeux, 150 ISBN à 13 chiffres) : **1 couverture sur 150**
  (Open Library) ; openBD et vignette NDL : 0 (livres d'avant 2000) ; Google Books sans clé : refus 429 dès le 10e
  appel. Le rétro n'a donc presque aucune couverture disponible gratuitement.
- **Méthode changée** : les tâches GitHub (10 à 45 min par essai) ont été remplacées par des **essais en direct depuis
  la session**, après l'ajout de NDL, openBD, Open Library, Google Books (et Rakuten) aux hôtes de l'environnement
  Claude. NDL refuse (429) après une dizaine d'appels rapprochés : **un appel toutes les 6 s**, 60 s d'attente par
  refus, coupé seulement après 5 refus d'affilée (1 refus en 397 appels ensuite). Rakuten Books (couverture, prix et
  lien d'achat) : site développeur inaccessible hors du Japon (503 depuis la France et la session), écarté pour
  l'instant.
- **Google Books** (clé du propriétaire, en-tête `X-Goog-Api-Key` ajouté par le réseau de la session) : le paramètre
  `country=JP` est exigé (sans lui : 403 « unknownLocation ») ; la couverture en **300 px** s'obtient avec
  `zoom=1&fife=w800-h1200` (au-delà, image PNG « image not available », reconnue et refusée). **v3.2** sur la **3DS et
  la Switch** (20 + 20 jeux, 28 min) :

| Console | Jeux avec ≥ 1 livre | Livres | ISBN |
|---|---|---|---|
| 3DS | 8 / 20 | 14 | 14 |
| Switch | 8 / 20 | 28 | 25 |
| **Total** | **16 / 40** | **42** | **39**, dont **26 avec couverture Google Books** (67 %) ; openBD, NDL, Open Library : 0 |

  Titres japonais : 37 jeux sur 40 en ont un (catalogue 3DS + Switch : 47 titres JAP en lettres latines sur 251,
  contre 304 sur 304 pour le rétro). **Planche relue par le propriétaire** : **artbooks et magazines** comptés comme
  guides (« アートブック », « Art of », « 設定資料集 », « Walker » : 9 livres sur 26) → **guides seulement**
  (intention v1.7) ; *Xenoblade Chronicles X* rattaché à *Xenoblade 3D* (« ゼノブレイドクロス » commence par
  « ゼノブレイド ») ; *PIKMIN4 パーフェクトガイド* manqué (titre du livre en lettres latines). Reste environ
  **15 vrais guides avec couverture pour 40 jeux**. Pas de prix japonais chez Google Books.
- **Conditions de Google Books** (developers.google.com/books/terms et /branding, lues le 24/11) : usage gratuit
  autorisé sans accord préalable (« You may not charge users any fee for the use of your application ») ; mention
  **« powered by Google »** à côté des résultats ; **chaque livre affiché doit avoir un lien visible vers sa page
  Google Books** (« Every book result displayed in your application must have a prominent link to … the Google Books
  page for that book ») ; contenu non modifié ; cache limité par les en-têtes de la réponse (conditions générales des
  API Google). → La couverture **reste chez Google** (adresse `books.google.com`, pas de copie dans notre stockage),
  avec le lien vers la page Google Books du guide et la mention ; contenu retiré à la demande.

**Conclusion** : **3DS et Switch d'abord** (intention v1.7) ; liste des guides **NDL Search** (ménagé), couverture
**Google Books** (lien, sans copie) ; filtre des artbooks et magazines à ajouter, recherche aussi par le titre en
lettres latines ; une planche relue par le propriétaire avant toute écriture. Lien d'achat ou prix : à choisir dans
la SPEC (Rakuten inaccessible ; eBay, ADR-17, ou recherche Amazon Japon / Suruga-ya par ISBN).

## 2. Stack

Identique à `mon-site-sdlc` (décision 7 de l'intention) :

| Besoin | Choix |
|---|---|
| Pages et serveur | **Next.js** (App Router, TypeScript strict), server actions |
| Styles | **Tailwind CSS**, mobile d'abord puis paliers `sm`/`md`/`lg`/`xl` pour l'ordinateur, thèmes clair/sombre |
| Base, connexion, images | **Supabase** : Postgres (RLS), Auth (inscriptions désactivées), Storage (bucket public) |
| Import | **cheerio** (tableau Wikipédia, base GameTDB), **sharp** (WebP), relais GameTDB par GitHub Actions |
| Tests | **Vitest**, **Playwright** (375 × 812, WebKit + Chromium ; 1440 × 900 pour l'ordinateur), **pgTAP** |
| Hébergement, CI | **Vercel** (région Paris `cdg1`), **GitHub Actions** |

## 3. Architecture

```
Visiteur (iPhone) ──HTTPS──▶ Vercel / Next.js ── pages publiques préparées à l'avance (ISR)
                                   │                └─ jaquettes WebP ◀── Supabase Storage (public)
Propriétaire (connecté) ──────────▶├──▶ Supabase (Postgres + Auth + Storage)
                                   │
                                   └──▶ en.wikipedia.org (import) ; GameTDB via le relais GitHub → bucket privé « gametdb »
```

## 4. Décisions (ADR)

**ADR-01 — Public en lecture, un seul administrateur.** Lecture ouverte à tous (rôle `anon`), écriture réservée
au compte du propriétaire, créé à la main ; inscriptions désactivées. La RLS vérifie l'écriture côté base, en
plus des contrôles des server actions.

**ADR-02 — Pages publiques statiques, choix faits dans le navigateur.** Le catalogue et les fiches contiennent
les données des **3 régions** et sont préparés à l'avance (ISR). Le **marché** du catalogue (US-03), la
recherche et le tri sont des états du navigateur, reflétés dans l'adresse (`?marche=jap&q=zelda`) et le marché
retenu dans `localStorage`. Sur la fiche, la **région** (US-04) est un état local, ouvert sur le marché choisi.
*Pourquoi* : pages rapides et cachables, bascules instantanées sans rechargement. Remplace la région globale de la
v0.2 (sélecteur sur toutes les pages), écartée au retour sur les maquettes. Après une modification,
`revalidatePath` régénère les pages concernées.

**ADR-03 — Import Wikipédia + GameTDB, aperçu puis enregistrement.**
1. **Wikipédia** (référence) : tableau de la liste des jeux de la console, lu avec cheerio. Retenus : éditeur
   contenant « Nintendo » dans au moins une région **et** marqué † (en boîte). Récupérés : titres (NA, PAL),
   développeur, éditeur, dates **JAP** (colonne Japan), **US** (North America), **PAL** (Europe ; Australasie
   ignorée), « Unreleased » = non sorti.
2. *(v0.2 à v0.7 : IGDB, retiré en v0.8, #58.)*
2 bis. **GameTDB** : la base `wiiutdb.zip` donne les identifiants de disque (ex. `ALZP01`). Rapprochement par
   titre US ou PAL ; les 3 premiers caractères sont communs aux 3 régions (`ALZE01`, `ALZJ01`, `ALZP01`), ce qui
   donne la sortie JAP même quand son titre diffère. Code produit = `WUP-P-` + 4 premiers caractères
   (`WUP-P-ALZP`). **Relais** (#53) : GameTDB refuse les connexions des serveurs de Vercel (délai dépassé), pas
   celles de GitHub. La tâche GitHub « Relais GameTDB » (`scripts/relais-gametdb.mjs`, à la main et chaque lundi)
   dépose la base `wiiutdb.xml` et les scans `scans/{id}.jpg` dans le bucket **privé** `gametdb` de Supabase
   (clé secrète en secret GitHub) ; l'import les lit avec la session du propriétaire.
   GameTDB **tranche le physique** (Wikipédia mélange boîte et téléchargement) : type `WiiU` = disque en boîte,
   `eShop` = téléchargement, titre « (Download Code) » = boîte à code, écartée. Jeu retenu si au moins une boîte
   a l'éditeur Nintendo (code `01`) ; sortie d'une région = une boîte existe dans cette région (champ `region`,
   pas la 4ᵉ lettre : un disque PAL peut finir en D, F…). Titre japonais : locale JA du disque japonais ; sa
   forme romanisée (ou anglaise) : son titre EN. Compilations en boîte absentes de la liste Wikipédia
   (NES Remix Pack / Famicom Remix 1 + 2, New Super Mario Bros. U + New Super Luigi U) : fiches propres.
   **Genres** (US-06) : champ `genre` de GameTDB (« action,3d platformer »), réunis sur les disques du jeu,
   traduits par une table (`src/lib/import/genres.ts` ; un genre inconnu garde son nom anglais) et écrits dans
   `games.genre` séparés par « , » (pas de migration). Verrouillable comme les autres champs.
3. **Aperçu** (n'écrit rien) : jeux retenus, ajoutés / modifiés / ignorés avec la raison. Puis enregistrement **par lots de 10** piloté par le
   navigateur, jaquettes comprises (même principe que l'ADR-03 de `mon-site-sdlc`, évite les délais Vercel).
4. **Verrous** : tout champ modifié à la main est verrouillé ; l'import ne le remplace jamais et signale l'écart.
   Un jeu ajouté à la main porte le verrou `manuel` : absent des sources, il n'est jamais supprimé par l'import.
6. **Nouveautés** (v1.4) : l'aperçu lit aussi les jeux en base de la console et compare, champ par champ, ce que
   l'import écrirait (après les verrous, `fusionner`) avec ce qui est en base : **nouveau**, **modifié** (liste des
   champs) ou **inchangé**. Seuls les nouveaux et modifiés partent en lots ; une jaquette n'est copiée que si la
   région n'en a pas encore (ou « Recopier les jaquettes »). *Pourquoi* : un import de routine (après le relais du
   lundi) devient quelques secondes au lieu de tout réécrire ; pas d'import automatique, qui demanderait une clé
   serveur écrivant sans le propriétaire.
7. **Exclusions** (v1.4) : table `exclusions(console_id, slug, raison, created_at)` ; un jeu décoché « en boîte »
   dans l'aperçu (Switch 2) y est noté et n'est plus proposé ; la page d'import liste les exclusions, chacune
   réactivable. Un jeu **à venir** (date future ou incomplète sans jour passé) est ignoré avec la raison « à venir ».
5. *(Identifiants IGDB : supprimés avec IGDB, v0.8.)*

**ADR-04 — Jaquettes copiées chez nous, en WebP haute définition.** Source par ordre de priorité : **scan GameTDB**
de la région (`coverHQ`, 768 × 1080 ; PAL : langue FR, sinon EN, DE depuis v1.16) ; sans scan, vignette neutre, remplaçable à la
main (US-12). Les anciennes jaquettes IGDB (v0.2 à v0.7) restent jusqu'à leur remplacement. Une jaquette `photo` ou `url` n'est jamais
remplacée par l'import. Image convertie avec sharp en **trois tailles WebP** : 300, 600 et **768 px** de large
(768 = largeur d'un scan GameTDB, pour la grande jaquette de la fiche sur écran ×3 ; jamais d'agrandissement),
servies avec `srcset` : le catalogue charge les petites, la fiche la HD. Chemin : `{game_id}/{region}-{version}-{taille}.webp` (version nouvelle à chaque copie, cache d'un an, #60) dans un
bucket public ; écriture réservée au propriétaire. Toute image est **ré-encodée** (jamais servie telle quelle).
Mention « Jaquette : GameTDB » (ou « Photo », « Image ajoutée ») sous la jaquette. *Pourquoi* : rendu net et rapide comme gamecartdb,
pas d'image cassée si la source change. Remplace l'ADR-04 de la v0.1.

**ADR-05 — Recherche dans le navigateur en v1.** Le catalogue Wii U (≈ 50 jeux) est déjà chargé : la recherche
filtre la liste au fil de la frappe, sur un titre normalisé (minuscules, sans accents ni ponctuation) calculé
pour les 3 régions + éditeur + développeur. *Pourquoi* : instantané, aucun aller-retour serveur, simple à tester.
Quand plusieurs consoles seront en ligne : recherche globale dans Postgres (`unaccent` + `pg_trgm`).

**ADR-06 — Adresses stables.** `/consoles/{console}` et `/jeux/{console}/{jeu}` avec un *slug* tiré du titre
PAL (sinon US, sinon romanisé), figé à la création. En v1, `/` affiche le catalogue Wii U (US-01 en S). **Dès la Wii
(v1.2)** : `/` est le catalogue de **toutes les consoles**, filtrable par `?console=wii` (panneau Filtres) ; la
console se lit sur chaque vignette ; les fiches gardent `/jeux/{console}/{jeu}`.

**ADR-07 — Collection privée, chargée dans le navigateur (étape 12).** Une ligne par version possédée :
`possessions(user_id, game_id, region)`. *Par compte* (`user_id` = `auth.uid()`) dès maintenant, même avec un seul
compte : ouvrir plus tard d'autres comptes ne changera pas le schéma. **RLS** : chacun ne lit, n'ajoute et ne retire
que ses propres lignes ; aucune lecture pour `anon`. Les pages publiques restent **statiques** (ADR-02) : un composant
client lit la session ; connecté, il charge les possessions (une requête, quelques Ko) et ajoute cases, coches,
filtre et compteurs ; sans session, rien ne change et aucun appel n'est fait. Cocher = écriture directe depuis le
navigateur, protégée par la RLS (pas de server action : la page reste statique, et la base vérifie le propriétaire de
chaque ligne). Clé `(game_id, region)` plutôt que l'identifiant de la sortie : le catalogue l'a déjà, la ligne survit à
un réimport, et elle disparaît avec le jeu (`on delete cascade`). *Pourquoi* : premier pas utile tout de suite,
sans rien exposer aux visiteurs ni ralentir les pages publiques.

**ADR-08 — Note Metacritic citée par Wikipédia (étape 13).** Deux colonnes du jeu : `metacritic_note smallint
(0–100)` et `metacritic_url`. Mise à jour par une action d'administration, console par console, **par lots de 20**
pilotés par le navigateur (comme l'import, ADR-03) : article trouvé par l'adresse Wikipédia du jeu (Wii U, Switch 2)
ou par son titre US (redirections suivies) ; note lue dans l'encadré « Video game reviews » ; **retenue seulement si
elle est sans ambiguïté celle de la console du jeu** (article d'une seule console, ou note étiquetée avec cette
console). Champs **verrouillables** comme les autres (ADR-03 point 4) : une saisie à la main n'est jamais écrasée. Les
pages publiques lisent les colonnes ; aucun appel à Wikipédia ni à Metacritic depuis le navigateur. *Pourquoi* : une
source libre, citée, sans clé ; mieux vaut une note manquante (saisissable) qu'une note d'une autre console.

**ADR-09 — N64 et GBA : Wikipédia + libretro-thumbnails (étape 14).** Lecteur de liste Wikipédia commun, paramétré par
console (noms des colonnes, « en boîte » : marque † pour la Wii U, toutes les cartouches pour N64 et GBA ; clés de tri
cachées retirées). Jaquettes : l'**index** des boîtes (noms de fichiers du dépôt) est déposé par le relais dans le
bucket `gametdb` (`n64/libretro.xml`, `gba/libretro.xml`) ; l'import y cherche, pour chaque région sortie, le titre
normalisé (« The » déplacé, ponctuation ignorée) et la région No-Intro (`USA` → US, `Europe` → PAL, `Japan` → JAP,
`World` → les trois ; ni « Beta », « Proto », « Demo », « Virtual Console »), puis copie l'image depuis
`raw.githubusercontent.com` en WebP (ADR-04) avec la source `libretro`. Forme réelle : la fiche affiche la jaquette à ses
proportions ; le catalogue la centre entière dans un cadre carré propre à ces consoles.

**ADR-10 — N64 et GBA : numéro de série No-Intro (étape 15).** L'import lit le fichier No-Intro de la console dans
`libretro-database` (un seul fichier texte par console, < 1 Mo, lu directement sur `raw.githubusercontent.com` : pas de
relais). Rapprochement : titre normalisé (même clé que les boîtes, ADR-09 ; « ou » / « ō » confondus) → numéros de série
du jeu → **base** (3 premiers caractères). Code de chaque région sortie = préfixe (`NUS-`, `AGB-`) + série de la région
(`J` Japon ; `E` US ; Europe : `P`, sinon une série d'un pays européen, sinon la série « USA, Europe »). Boîte
japonaise : si le titre ne la trouve pas, le nom No-Intro japonais de la même base, s'il est dans l'index libretro. Les
codes passent par un champ `codes` distinct des `disques` GameTDB (aucun scan du relais à copier) ; verrous respectés
(US-11) ; jeux concernés « modifiés » dans l'import des nouveautés.

**ADR-11 — Statistiques calculées à la demande (étape 16, US-18).** Page serveur `/admin/statistiques`, protégée
comme l'administration (`exigerProprietaire`). Elle lit en une fois les jeux (console, note Metacritic), leurs sorties
(région, sortie, code produit, source de jaquette) et les possessions du compte, puis calcule tout dans des **fonctions
pures** (`src/lib/statistiques/`), testées sur des jeux d'exemple. Rien n'est stocké (ni table ni vue) : pas de
migration, chiffres toujours justes ; quelques milliers de lignes, lues en une requête. « Jaquette manquante » = sortie
sans jaquette ou de source `igdb` (même règle que « à remplacer », US-12). Les compteurs du panneau Filtres sont
retirés (le filtre « Ma collection » reste).
*Mise à jour v1.25 (audit de performance D, choix du propriétaire du 22/11/2026)* : la partie **catalogue** (jeux,
sorties, consoles), identique pour tous et lue en visiteur, est gardée **5 minutes en cache** (`unstable_cache`,
étiquette `catalogue`), pour Statistiques, Mon profil et les profils publics. Chaque action de l'administration qui
modifie un jeu (import, correction, jaquette, note) vide ce cache aussitôt (`updateTag`). Les **possessions** restent
lues à chaque ouverture. Seule exception : un script lancé depuis la session Claude (`npm run session`) ne vide pas
le cache, et les chiffres suivent au plus 5 minutes plus tard. Les 2 pages de 1 000 jeux sont lues en même temps.

**ADR-16 — Collectionneurs invités : rôles, invitations, profils, badges (étape 27).**
1. **Le rôle du propriétaire passe dans la base.** Aujourd'hui, « connecté » veut dire « propriétaire » : toutes les
   règles d'écriture du catalogue sont `to authenticated using (true)` (0002, 0003, 0010) et `exigerProprietaire()`
   vérifie seulement qu'une session existe. Un invité connecté pourrait donc modifier le catalogue. **Avant toute
   invitation**, une migration crée `profils` (avec `role` : `proprietaire` ou `collectionneur`) et une fonction
   `est_proprietaire()` (`security definer`, `stable`), et remplace chaque règle d'écriture (consoles, games,
   releases, import_runs, exclusions, buckets `jaquettes` et `gametdb`) par `using (est_proprietaire())`.
   `exigerProprietaire()` et le contrôle de `/admin` (`proxy.ts`) vérifient aussi le rôle. Le compte existant reçoit
   le rôle `proprietaire` par la migration. Tests pgTAP : un collectionneur ne peut écrire ni le catalogue ni les
   jaquettes, ni lire le bucket `gametdb`.
2. **Invitations par lien** (choix du propriétaire : aucun service d'e-mail). Table `invitations` (nom, `jeton_hache`,
   expire le, utilisée le, compte créé), lisible et modifiable par le seul propriétaire. Le jeton (32 octets
   aléatoires, en base64url dans `/bienvenue/{jeton}`) n'est montré qu'une fois ; la base n'en garde que l'empreinte
   SHA-256. Les inscriptions restent fermées : le compte est créé **par le serveur** (action de la page
   « Bienvenue ») avec la clé secrète Supabase (`auth.admin.createUser`, e-mail confirmé d'office), après
   vérification du jeton (existant, non expiré, non utilisé) ; puis le profil est créé et l'invitation marquée
   utilisée, et l'invité est connecté. Clé secrète : variable **`SUPABASE_SECRET_KEY` côté Vercel**, lue par un module
   `server-only`, jamais envoyée au navigateur.
3. **Collection** : la table `possessions` (0012) est déjà privée par compte ; sa colonne `cree_le` donne les
   derniers ajouts. Rien à changer pour US-21.
4. **Profil public** : une fonction `profil_public(pseudo)` (`security definer`) renvoie pseudo, avatar et versions
   possédées **seulement si le profil est public** ; les visiteurs ne lisent jamais `possessions` ni `profils`
   directement. Page `/collectionneurs/[pseudo]` rendue à la demande et gardée 5 minutes au plus (`revalidate = 300`),
   `noindex`, absente du plan du site ; profil privé ou inconnu → `notFound()`.
5. **Badges calculés, jamais stockés** : fonction pure `src/lib/badges/` (possessions + catalogue + séries →
   badges gagnés et prochains, avec progression), testée sur des cas fabriqués. Rien à resynchroniser quand le
   catalogue ou la collection change.
6. **Avatars** : douze icônes SVG dessinées pour le site (`public/avatars/`), choisies par un identifiant (`avatar`
   vérifié par la base) ; pas d'envoi d'image, donc rien à modérer.
Alternatives écartées : e-mail d'invitation de Supabase (service d'envoi à configurer, refusé par le propriétaire) ;
inscription ouverte (hors périmètre) ; badges stockés (à recalculer à chaque changement du catalogue) ; lecture
publique de `possessions` par la RLS (trop facile d'exposer une collection privée par erreur).

**ADR-15 — Séries : titre, puis Wikidata, puis main (étape 23).** Colonne `games.series text[]` (migration 0023 ;
les 3 valeurs de `franchise` y sont reprises, `franchise` n'est plus lue). Une **liste de référence** dans
`src/lib/series/` donne pour chaque série son nom affiché (français s'il existe), ses motifs de titre, sa série parente
(Dr. Mario → Mario) et ses noms Wikidata. Séries d'un jeu = union de celles trouvées par le titre et par Wikidata,
ramenées aux noms de référence, plus les parentes ; une série Wikidata hors liste est gardée sous son libellé français
(sinon anglais) et signalée dans le résumé, pour enrichir la liste. Remplissage du catalogue par
`scripts/series-wikidata.mjs` (session Claude, une requête par seconde) ; l'import n'applique que les règles sur le
titre aux nouveaux jeux (pas de Wikidata depuis Vercel, à cause de la limite des API). Correction à la main (US-11)
→ verrou `series` dans `games.verrous` : ni l'import ni le script ne touchent alors le champ. Alternatives écartées :
une seule série par jeu (Dr. Mario n'apparaîtrait pas sous « Mario ») ; Wikidata seul (53 % des jeux) ; Giant Bomb
(clé dans l'adresse, réservé à la consolidation rétro, étape 26).

**ADR-14 — L'éditeur officiel de la région l'emporte (étape 22).** Suite de l'ADR-13 : le relais lit aussi le format
(boîte ou téléchargement) des deux bases. Une carte Switch ou 3DS compte comme éditée par Nintendo si GameTDB le dit,
si son éditeur est vide et que Nintendo l'édite (ADR-13), ou si Nintendo Europe (carte européenne) ou Nintendo Japon
(carte japonaise) l'édite, **quel que soit l'éditeur donné par GameTDB** ; l'éditeur de la carte devient alors
« Nintendo ». Une carte seulement américaine garde l'éditeur de GameTDB. 3DS : une carte « 3DSWare » est retypée « 3DS »
(l'import n'est pas modifié) si la base de sa région la dit vendue en boîte par Nintendo ; une carte américaine suit
l'Europe ou le Japon (choix du propriétaire). Sans bases officielles (échec du téléchargement), rien ne change.
Alternatives écartées : base européenne pour les cartes américaines aussi (faux positifs : éditeurs différents entre
Amérique et Europe) ; liste de jeux à la main (à refaire à chaque import).

**ADR-13 — Éditeur officiel quand GameTDB est vide (étape 22).** Le relais dépose `nintendo/editeurs.json` : les
bases de code (identifiant sans la lettre de région) des jeux que Nintendo Europe ou Nintendo Japon disent édités par
Nintendo (ou The Pokémon Company au Japon), pour la Switch et la 3DS. L'import tient une cartouche pour « éditée par
Nintendo » si GameTDB le dit **ou**, quand son éditeur est vide, si sa base est dans ce fichier ; il ne contredit jamais un
éditeur renseigné. DS : les identifiants en Y ne sont plus écartés (les démos le restent par leur titre et leur genre) ;
une carte sans région prend celle de la 4ᵉ lettre de son identifiant (E = US, P et pays européens = PAL, J = JAP,
O = US et PAL). Testé sur des copies réduites des deux bases (fixtures).

**ADR-12 — Game Boy Color (étape 17).** Lecteur de cartouches de l'ADR-09 généralisé : en-tête sur une ou deux lignes,
date « First released », colonnes de région seules. La colonne **Dual Mode** donne le préfixe du code produit de chaque
jeu (`DMG-` si Oui, `CGB-` sinon), porté par le jeu à importer et prioritaire sur le préfixe de la console. Console
`gbc` (portable, 1998), placée entre la N64 et la GBA (ordre chronologique : la N64 passe à -3) ; boîtes et séries par
les mêmes fichiers que l'ADR-10 (dépôts `Nintendo_-_Game_Boy_Color`).

**ADR-17 — Prix eBay : demandés à l'ouverture de la fiche, gardés 6 h, rien en base (étape 25).**
1. **Route** `GET /api/prix/{console}/{jeu}` (Node, région `cdg1`) : lit les titres du jeu (client public), puis
   interroge la Browse API pour chaque version sortie : US et JAP sur `EBAY_US` (JAP : requête « … japanese »),
   PAL sur `EBAY_FR` et `EBAY_GB` ; catégorie « Video Games » (139973), 50 annonces par appel ; au plus 4 appels.
   Réponse : par région, médiane en euros, nombre d'annonces pertinentes, marchés, lien, date du calcul.
2. **Fraîcheur** : réponse gardée **6 h** par jeu dans le cache de données de Next (`unstable_cache`, `revalidate:
   21600`) et `Cache-Control: s-maxage=21600` ; jeton eBay (client credentials, 2 h) gardé 1 h 50 ; taux de la BCE
   (`eurofxref-daily.xml`, sans clé) gardé 24 h. **Rien en base**, aucune migration : conforme au contrat d'eBay.
3. **Quota** : 5 000 appels par jour, 4 par jeu toutes les 6 h. Le prix est demandé **par le navigateur** après
   l'affichage (les pages restent statiques, les robots ne le déclenchent pas) ; `robots.txt` interdit `/api/`.
   eBay en erreur (429, 5xx, délai de 8 s) : la route répond 503, le bloc est masqué, rien n'est gardé.
4. **Pertinence** (module pur `src/lib/prix/`, repris de l'étude et corrigé par ses tests) : tous les mots du titre
   présents ; numéro de suite absent du titre écarté (« Super Mario Galaxy 2 ») ; lots, guides, manuels **seuls**
   (un jeu complet « avec manuel » reste), boîtes vides, steelbooks, amiibo, consoles et reproductions écartés ; JAP :
   mention du Japon exigée ; US : aucune mention du Japon ni de PAL ; PAL : aucune mention du Japon. **Médiane** à partir de 5 annonces ; sinon « Pas assez d'annonces ».
5. **Lien « eBay › »** : recherche des **objets vendus** du jeu (`/sch/i.html?_nkw=…&_sacat=139973&LH_Sold=1&LH_Complete=1`)
   sur ebay.com (JAP, US) ou ebay.fr (PAL) : les ventes réelles restent consultables chez eBay.
6. **Clés** : `EBAY_CLIENT_ID` et `EBAY_CLIENT_SECRET` dans les variables de **Vercel** (Production et Preview),
   lues côté serveur seulement ; aussi en secrets GitHub (étude).
   Code : `src/lib/prix/calcul.ts` (recherches par version, accès réseau passés en paramètre, testé sans réseau),
   `src/lib/prix/ebay.ts` (`server-only` : jeton, Browse, BCE), `src/app/api/prix/[console]/[jeu]/route.ts`. Titre
   cherché pour la version JAP : l'anglais (US, sinon PAL), sinon le romanisé.
7. **Tests** : unitaires sur des fixtures écrites au format de la Browse API avec des titres relevés par l'étude
   (pertinence, médiane, conversion, liens) ; e2e : route interceptée par Playwright (prix, « pas assez », bloc
   masqué), jamais eBay en direct.
8. **Si eBay ouvre Marketplace Insights** : même route, médiane des ventes des 90 derniers jours à la place des
   annonces ; libellé « prix de vente ».

**ADR-18 — Captures RAWG : adresses en base, images servies par RAWG, import une fois (étape 28, SPEC v1.43).**
1. **Source** : API RAWG (`api.rawg.io/api`), clé gratuite du propriétaire. Conditions lues le 22/11 (description de
   l'API) : gratuit pour un projet personnel ou de moins de 100 000 visiteurs par mois, **à condition de citer RAWG
   avec un lien actif sur chaque page** qui montre ses données ; pas de clone de RAWG. La clé passe **dans l'adresse**
   (`?key=`) : le formulaire de clés de la session ne sait la mettre que dans un en-tête → clé en secret GitHub
   `RAWG_API_KEY`, jamais dans le dépôt ni dans Vercel (rien n'appelle RAWG à l'ouverture d'une fiche).
2. **Pas de copie des images** (choix du propriétaire du 22/11) : la base garde les adresses `media.rawg.io` ; le
   navigateur les charge chez RAWG. Le carrousel demande la version réduite par RAWG
   (`media.rawg.io/media/resize/640/-/…`, vérifiée le 22/11 : 31 Ko au lieu de 103), l'agrandissement la version 1280. Risque : RAWG
   change ou retire une image → l'image cassée est retirée du carrousel (US-26) ; un nouveau passage de l'import la
   remplace.
3. **Rapprochement** (module pur `src/lib/captures/`, testé sur des fixtures) : recherche RAWG par titre (US, sinon
   PAL, sinon romanisé) filtrée sur la plateforme RAWG de la console (`/platforms`, table de correspondance par
   console) ; accepté seulement si le titre normalisé (ADR-05) est **identique** et la console présente ; sinon
   aucun jeu (jamais « le plus proche »). Étude du 22/11 (§1 sexdecies) : avant la comparaison, un suffixe
   « (année) » ou « (nom de console) » et un « The » en tête du titre RAWG sont retirés ; rien d'autre (pas de titre
   « contenu dans », pas de distance entre titres). Virtual Boy et Switch 2 n'existent pas chez RAWG : pas de captures.
4. **Données** : migration, table `captures` (`game_id`, `position` 1 à 6, `url`, `largeur`, `hauteur`) et colonne
   `games.rawg_slug` (lien « Captures : RAWG ») ; lecture publique (RLS), écriture réservée au propriétaire
   (`est_proprietaire()`, ADR-16) et à la clé secrète. Une ligne `captures` par image, supprimées avec le jeu.
5. **Import** : tâche GitHub « Relais RAWG » (lecture de RAWG, secrets `RAWG_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SECRET_KEY`) → fichier JSON dans le bucket privé `gametdb/rawg/{console}.json` (jeu, slug RAWG, captures,
   mode de rapprochement) ; **planche** regardée par le propriétaire ; puis `scripts/captures-rawg.mjs` depuis la
   session (skill `script-prod`, `--sauf n,n` pour écarter) écrit en base. Quota : 20 000 appels par mois (environ
   2 par jeu, 2 800 jeux) : un passage complet tient dans un mois.
6. **Fiche** : la fiche reste **préparée à l'avance** (les captures sont lues avec le jeu) ; composant client
   `Captures` (carrousel CSS `scroll-snap`, agrandissement en `<dialog>`), `<img loading="lazy">` sans
   optimisation Next (images déjà réduites par RAWG, pas de quota d'optimisation Vercel). Après un import,
   les fiches sont refaites (étiquette `catalogue` vidée ou nouveau déploiement).
7. **Tests** : unitaires (rapprochement, adresses réduites, ordre des captures) sur des réponses RAWG relevées par
   l'étude et enregistrées dans `__fixtures__/` ; e2e : carrousel, agrandissement, Échap, bloc absent sans captures,
   images de `media.rawg.io` interceptées par Playwright ; jamais RAWG en direct.

**ADR-19 — Guides japonais : tables à part, couverture servie par Google, chargés à la demande (étape 29, SPEC v1.47).**
1. **Un guide n'est pas un jeu** : tables à part plutôt qu'un « type » dans `games` (un guide n'a ni régions, ni
   jaquettes, ni sorties ; il peut couvrir plusieurs jeux). Migration 0031 :
   - `guides` : `id`, **`isbn` (13 chiffres, unique)** — un guide sans ISBN n'entre pas (US-28) —, `titre` (japonais),
     `editeur`, `date_parution` + `precision_date` (le type existant : NDL donne le mois), `pages`,
     `google_books_id` (couverture et lien « Google Books › » ; vide = vignette neutre), `ndl_url` (notice NDL),
     `verrous text[]` (champs corrigés à la main, gardés par les passages suivants, comme ADR-03), `cree_le`, `maj_le` ;
   - `guides_jeux` : (`guide_id`, `game_id`) clé primaire, suppression en cascade des deux côtés : un guide peut
     couvrir **plusieurs jeux** (Pokémon Or et Argent) ;
   - `guides_exclus` : `isbn` clé primaire, `raison`, `cree_le` : un guide écarté sur la planche ou supprimé n'est
     **jamais remis** (comme la table `exclusions` des jeux, migration 0010) ;
   - RLS : lecture pour tous (`guides_exclus` : propriétaire seulement), écriture réservée au propriétaire
     (`est_proprietaire()`, ADR-16) et à la clé secrète. pgTAP : lecture anonyme, écriture refusée, ISBN unique et à
     13 chiffres, cascade.
2. **Couverture** : **jamais copiée** (conditions de Google Books, §1 septdecies) : la base garde `google_books_id`,
   le navigateur charge `books.google.com/books/content?id=…&printsec=frontcover&img=1&zoom=1&fife=w800-h1200`
   (300 px) dans un `<img loading="lazy">` sans optimisation Next (comme ADR-18) ; image cassée → vignette neutre.
   Mention « powered by Google » à côté des couvertures et lien vers la page Google Books du guide
   (`books.google.com/books?id=…`). Rien n'appelle Google à l'ouverture d'une page : pas de clé dans Vercel.
3. **Liens d'achat** : adresses de recherche par ISBN, calculées (module pur), jamais stockées : Amazon Japon
   (`www.amazon.co.jp/s?k={isbn}`) et Suruga-ya (`www.suruga-ya.jp/search?search_word={isbn}`), ouverts dans un nouvel
   onglet (`rel="noopener noreferrer"`) ; adresses vérifiées à la main avant la PR de la page.
4. **Catalogue** (US-27) : l'accueil reste aussi léger qu'après l'audit de performance (BILAN §13) : **les guides ne
   sont pas dans le HTML de l'accueil**. Cocher « Guides » charge une seule fois une route préparée à l'avance
   (`/guides.json`, gardée 5 min, étiquette `catalogue` vidée par chaque écriture) : par guide, l'ISBN, le titre,
   l'éditeur, la date, la couverture et, pour chaque jeu couvert, son identifiant (console, genres, studios, séries,
   titres pris dans le catalogue déjà chargé). Les cartes « guide » passent par les mêmes recherche, filtres, tris,
   lots de 60 et frise (fonctions pures de `src/lib/catalogue/` étendues : élément « jeu » ou « guide ») ; `?voir=` dans
   l'adresse comme `?tri=` ; guides masqués sur les marchés Europe et Amérique du Nord.
5. **Page du guide** `/guides/[isbn]` : préparée à l'avance (ISR 5 min, `generateStaticParams`), métadonnées et
   données structurées schema.org `Book` (ISBN, éditeur, date, `about` = jeux), dans le plan du site ; 404 en français
   pour un ISBN inconnu. **Fiche du jeu** : bloc « Guides (N) » lu avec le jeu (page toujours statique).
6. **Remplissage** (US-28) : depuis la **session Claude** (NDL, Google Books joints depuis le 24/11 ; clé Google en
   en-tête ajoutée par le réseau, jamais écrite), skill `script-prod`. `scripts/guides.mjs --console 3ds` : pour
   chaque jeu sorti au Japon, recherche NDL par titre JAP, titre en lettres latines et titre Wikidata (un appel toutes
   les 6 s, ADR du §1 septdecies), filtres du module pur `src/lib/guides/` (guide et pas artbook ni magazine, titre
   non suivi d'un chiffre ni d'un autre mot du titre d'un autre jeu, console citée ou date proche), couverture Google
   Books (`country=JP`), puis `--planche dossier` (planche numérotée) ; le propriétaire écarte des numéros ;
   `--ecrire --sauf n,n` écrit les guides gardés et ajoute les écartés à `guides_exclus`. Relancer ne crée pas de
   doublon (`isbn` unique, liens en `upsert`) et respecte les verrous.
7. **Tests** : unitaires sur des fixtures (réponses NDL et Google Books enregistrées par l'étude, écrites dans
   `src/lib/guides/__fixtures__/`) : ISBN 10 → 13, filtre guide / artbook / magazine, rapprochement titre ↔ jeu (les
   faux positifs de l'étude : *Xenoblade X*, Kirby Super Deluxe), adresses de couverture et d'achat ; extension des tests
   du catalogue (éléments mêlés, `?voir=`, marché) ; pgTAP (point 1) ; e2e : coches, carte → page du guide, bloc de la
   fiche, couvertures interceptées par Playwright ; jamais NDL ni Google en direct.
8. **Plus tard** : case « j'ai ce guide » (table `possessions_guides`, ADR-07), consoles suivantes (Wii U, DS, Wii…),
   page d'administration des guides.

## 5. Modèle de données

```
consoles(id, slug, nom, type 'salon'|'portable', annee, ordre, wikipedia_liste, igdb_platform_id — inutilisé depuis v0.8)
games(id, console_id → consoles, slug, igdb_id, wikipedia_url, developpeur, franchise (plus lue : ADR-15), series text[], genre,
      physique bool, verrous text[], metacritic_note smallint 0–100, metacritic_url, created_at, updated_at)
releases(id, game_id → games, region 'JAP'|'US'|'PAL', sortie bool, titre, titre_romanise (JAP),
         date_sortie date, precision_date 'jour'|'mois'|'annee', code_produit, editeur,
         jaquette_path, jaquette_source 'gametdb'|'igdb'|'photo'|'url', verrous text[], updated_at)
         unique (game_id, region)
import_runs(id, console_id, lance_le, resume jsonb)
possessions(user_id → auth.users, game_id → games (cascade), region, cree_le) primary key (user_id, game_id, region)
profils(user_id → auth.users (cascade) primary key, pseudo citext unique 3–20 [a-z0-9-], avatar (liste fixe),
        public bool défaut false, role 'proprietaire'|'collectionneur' défaut 'collectionneur', cree_le)   (ADR-16)
invitations(id, nom, jeton_hache unique, cree_le, expire_le, utilisee_le, user_id → auth.users)          (ADR-16)
captures(game_id → games (cascade), position 1–6, url, largeur, hauteur)                                  (ADR-18)
guides(id, isbn char(13) unique, titre, editeur, date_parution, precision_date, pages, google_books_id, ndl_url,
       verrous text[], cree_le, maj_le)                                                                   (ADR-19)
guides_jeux(guide_id → guides (cascade), game_id → games (cascade)) primary key (guide_id, game_id)       (ADR-19)
guides_exclus(isbn primary key, raison, cree_le)                                                          (ADR-19)
```

- Un jeu = une œuvre sur une console ; ses 3 sorties sont toujours créées (`sortie = false` si absente).
- Valeurs fixes (`type`, `region`, `precision_date`, `jaquette_source`) en **types énumérés** Postgres : refusées
  par la base si invalides, et devenues des types TypeScript exacts.
- **RLS** : `select` pour tous ; `insert/update/delete` pour `authenticated` seulement (inscriptions
  désactivées ⇒ seul le propriétaire). Même règle pour le bucket d'images. Testé en pgTAP.
- Évolution du schéma **uniquement** par `supabase/migrations/` ; types TypeScript générés et vérifiés en CI.

## 6. Écrans et routes (v1)

| Route | Contenu | US |
|---|---|---|
| `/` → `/consoles/wii-u` | Catalogue à la manière de gamecartdb : présentation, « Tous les jeux », recherche, marché, tri, grille/liste, groupes par année | US-02, 03, 05, 06 |
| `/jeux/[console]/[jeu]` | Grande jaquette et sélecteur JAP/US/PAL dessous, informations, disponibilité, sources | US-04 |
| `/a-propos` | Non-affiliation, sources (Wikipédia, GameTDB) et licences | US-07 |
| `/admin/connexion`, `/admin/import` | Connexion ; import avec aperçu et lots | US-09, 10 |
| `/admin/jeux`, `/admin/jeux/[jeu]` | Liste des jeux ; correction d'une fiche (champs verrouillés contre l'import) — sous `/admin` pour la protection du proxy (v0.9) | US-11 |
| `/admin/jaquettes`, `/admin/jaquettes/[jeu]/[region]` | Toutes les jaquettes, filtre « à remplacer » ; remplacement par adresse ou photo | US-12 |

Pas de sélecteur de région global : le marché se choisit dans le catalogue, la région sur la fiche. Les jaquettes sont l'élément visuel
principal (priorité du propriétaire) : grille à bords fins, proportions de boîte respectées, pas de recadrage.

## 7. Tests

| Niveau | Quoi |
|---|---|
| Vitest | lecture du tableau Wikipédia **sur fixture** (50 jeux Nintendo en boîte attendus), base GameTDB **sur fixture**, règle du physique, rapprochement, normalisation, slug, verrous, conversion WebP |
| pgTAP | RLS (anon lit, n'écrit pas), bucket, unicité `(game_id, region)` |
| Playwright | catalogue → fiche, filtre par marché, recherche au fil de la frappe, bascule de région sur la fiche, connexion, correction |
| CI | lint, types, unitaires, build, e2e sur base Supabase locale, types générés à jour |

Fixtures : copies datées de « List of Wii U games » et d'un extrait de la base GameTDB (+ README d'origine) ; aucun
test n'appelle les sites en direct.

## 8. Plan par étapes (milestones)

1. **Socle** : Next.js, Tailwind, ESLint, Vitest, Playwright, CI, déploiement Vercel.
2. **Base** : Supabase, migrations (schéma, RLS, bucket), console Wii U, connexion US-09.
3. **Consultation** : US-02, US-03, US-04, US-05 avec 3–4 jeux Wii U saisis en données de départ → *site visible tôt*.
4. **Import Wii U** : US-10 (Wikipédia + IGDB + jaquettes ; IGDB remplacé par GameTDB à l'étape 5).
5. **Correction** : import GameTDB (scans de boîtes, codes produit), jaquette HD, US-08 (sombre) + US-15 (logo), US-12 (page « Jaquettes »), US-11.
6. **Filtres** : US-06.
7. **Finitions** : US-07, référencement. Puis console suivante.
   Référencement : adresses canoniques et aperçus absolus sur `https://nintendo-db.vercel.app` (`metadataBase`),
   même depuis une prévisualisation (Vercel y ajoute déjà `noindex`) ; aperçu de partage = jaquette 600 px de la
   version « Tous » ; données schema.org `VideoGame` (JSON échappé) ; `robots.txt` exclut `/admin`.

8. **Wii** (v1.2, plan à valider) — 3 PR :
   1. **Relais Wii** : la tâche GitHub dépose aussi `wii/wiitdb.xml` et, pour chaque disque Nintendo, la **face avant
      découpée** du scan `coverfullHQ` (moitié droite, sans la tranche), en JPEG ≈ 485 × 680 (`wii/faces/{id}.jpg` ; recoupées sans la bande blanche de la tranche, #87) :
      ≈ 100 Ko par scan au lieu d'1 Mo. Fixture `wiitdb.xml` réduite (+ README).
   2. **Import Wii** : migration (console `wii`, salon, 2006) ; import paramétré par console : Wii = GameTDB seul
      (même lecteur, type « disque Wii », codes `RVL-XXXX`) ; tailles de jaquette sans agrandissement (300 et 485 px
      réels). L'import Wii se lance depuis l'admin après le merge (une fois).
   3. **Catalogue toutes consoles** : accueil = tous les jeux, console sur chaque vignette, filtre **Console** dans
      le panneau, sitemap et « À propos » à jour.

9. **DS + 3DS** (v1.3) — PR toutes basées sur `main`, mergeables dans n'importe quel ordre (pas d'empilement, leçon
   de l'étape 8) :
   1. **Proportions des jaquettes par console** : `Jaquette` reçoit la console ; DS/3DS 768 × 680, Wii/Wii U 27 × 38.
   2. **Relais + import DS/3DS** : bases réduites `ds/`, `3ds/` et scans (`coverHQ`, sinon `coverM`) ; migration 0008
      (consoles DS 2004, 3DS 2011, ordre chronologique) ; règles ci-dessus, titre PAL anglais, codes
      `NTR-`/`CTR-P-`/`KTR-P-` ; pages d'import ; fixtures réduites.

10. **Switch + Switch 2** (v1.4) — 3 PR visant `main`, à merger **dans l'ordre** (#101, #103, #105) : la Switch 2
   réutilise les jeux « à venir » de la PR 1, et sa migration 0010 doit passer après la 0009 de la Switch :
   1. **Import des nouveautés** (toutes consoles) : comparaison base / import dans l'aperçu (nouveau, modifié,
      inchangé), case « Afficher les inchangés », enregistrement des seuls changements ; jeux « à venir » ignorés.
   2. **Switch** : relais (base réduite `switch/switchtdb.xml`, scans `switch/scans` : `coverHQ` US, FR, EN, DE (FR d'abord depuis v1.16), sinon
      `coverM` ; JA en `coverM`) ; migration 0009 (console `switch`, salon, 2017) ; cartouche « ALL » = 3 régions,
      variantes écartées, codes `HAC-P-` ; proportions 1166 × 1888 ; fixture réduite.
   3. **Switch 2** : migration 0010 (console `switch-2`, 2025 ; table `exclusions` + RLS + pgTAP) ; lecteur de la
      liste Wikipédia Switch 2 (fixture) ; case « en boîte » et exclusions dans l'aperçu ; jaquettes à la main.

11. **GameCube** (v1.5) — 1 PR de code basée sur `main` (après #110 seulement pour la ligne de version de la SPEC) :
   relais (base réduite `gamecube/gctdb.xml`, faces découpées `gamecube/faces`, repli sur la petite image) ;
   migration 0011 (console `gamecube`, salon, 2001, avant la DS) ; règles ci-dessus, codes `DOL-` ; fixture réduite.

12. **Ma collection** (v1.6, US-16) — 2 PR à merger **dans l'ordre** (la seconde lit ce que la première crée) :
   1. **Base et fiche** : migration 0012 (`possessions` + RLS + pgTAP), lecture de la session et des possessions dans le
      navigateur (`src/lib/collection/`), cases « Je l'ai » sur la fiche, e2e connecté (projet `*-admin`).
   2. **Catalogue** : coche verte sur les vignettes, filtre « Collection » (Tous / Possédés / Manquants, `?collection=`),
      compteur par console ; rien de tout cela pour un visiteur (e2e public).

13. **Note Metacritic** (v1.7, US-17) — 2 PR à merger **dans l'ordre** :
   1. **Données et affichage** : migration 0013 (`metacritic_note`, `metacritic_url`, contrainte 0–100) ; fiche (note aux
      couleurs Metacritic, jetons `mc-bon`, `mc-moyen`, `mc-faible`, clair et sombre ; lien ; source) ; étiquette du chiffre
      dans le catalogue, au style des étiquettes JAP / US / PAL ;
      saisie et verrou dans la correction d'une fiche (US-11).
   2. **Mise à jour depuis Wikipédia** : lecteur de l'encadré (note par console, ambiguïtés) testé sur des **fixtures**
      (copies d'articles) ; page d'administration « Notes Metacritic » : aperçu, lots de 20, résumé.

14. **N64 + GBA** (v1.8) — 2 PR à merger **dans l'ordre** :
   1. **Liste et import** : lecteur Wikipédia paramétré (fixtures réduites des deux listes) ; migration 0014 (consoles
      `n64` 1996 et `gba` 2001, ordre chronologique ; source de jaquette `libretro`) ; pages d'import ; sans jaquettes.
   2. **Jaquettes** : index libretro déposé par le relais, rapprochement titre + région (testé sur fixtures), copie à
      l'import, forme réelle sur la fiche et cadre carré dans le catalogue, mention de la source.

15. **N64 + GBA complétées** (v1.9, ADR-10) — 1 PR, sans migration : lecteur No-Intro (fixtures réduites des deux
    fichiers), codes produit et boîtes japonaises par série, testés sur fixtures ; puis réimport des deux consoles par le
    propriétaire.

16. **Statistiques** (v1.10, ADR-11, US-18) — 2 PR, sans migration, dans n'importe quel ordre :
    1. **Ma collection, régions, Metacritic** : calculs purs + tests ; page `/admin/statistiques` et bouton sur
       l'accueil de l'administration ; compteurs retirés du panneau Filtres ; test e2e (page privée, blocs affichés).
    2. **État du catalogue** : décomptes + tests ; liens vers les listes ; filtre « sans code produit » de la liste
       Jeux de l'administration.

17. **Game Boy Color** (v1.11, ADR-12) — 1 PR, migration 0015 (console `gbc`) : lecteur généralisé et préfixe par jeu
    (fixtures GBC réduites : liste, index libretro, No-Intro) ; page d'import, forme des boîtes, À propos. Puis relais
    (index libretro GBC) et import par le propriétaire.

18. **Game Boy** (v1.12) — 1 PR, migration 0016 (console `gb`, portable, 1989, avant la N64) : en-tête « PAL region »
    lu ; préfixe `DMG-` ; fixtures Game Boy réduites (liste, index libretro, No-Intro) ; page d'import, forme des boîtes,
    À propos. Puis relais (index libretro Game Boy) et import par le propriétaire.

19. **Virtual Boy** (v1.13) — 1 PR, migration 0017 (console `vb`, 1995, entre le Game Boy et la N64) : lectures
    corrigées ci-dessus ; boîte « (Japan, USA) » pour les États-Unis seulement ; préfixe `VUE-` ; fixtures Virtual Boy.

20. **Super Nintendo** (v1.14) — 1 PR, migration 0018 (console `snes`, 1990, entre le Game Boy et le Virtual Boy) :
    « Cancelled » ; titres japonais de la cellule du titre pour la boîte JAP ; « ō » = « ou » ; préfixe du code par la
    lettre de région de la série (rare) ; fixtures Super Nintendo réduites.

21. **NES** (v1.15) — 1 PR, migration 0019 ou suivante (console `nes`, 1983, en tête de l'ordre) : règle « World » sans
    le Japon ; préfixe du code selon la région de la série (rare) ; fixtures NES réduites.

22. **Jeux absents** (v1.18, ADR-13) — 2 PR : (1) DS, identifiants en Y et régions vides ; (2) Switch et 3DS, éditeur
    repris de Nintendo Europe et Japon (relais + import). Puis relais et nouvel import de la DS, de la Switch et de la 3DS
    par le propriétaire (aperçu avant enregistrement).

23. **Séries** (v1.21, ADR-15) — 3 PR : (1) SPEC et DESIGN ; (2) migration 0023, liste de référence et règles
    (`src/lib/series/`), séries des nouveaux jeux à l'import, champ « Séries » verrouillable dans l'administration,
    script `series-wikidata.mjs` ; (3) filtre « Série » du catalogue (`?serie=`) et séries sur la fiche. Puis
    remplissage par le script, vérifié dans la base, corrections du propriétaire.

24. **Frise** (v1.22, SPEC v1.38) — 2 PR : (1) SPEC, maquette, plan et backlog ; (2) découpage en années et côtés
    (fonction pure, `src/lib/catalogue/`), composant `Frise` (jetons de couleur, composant `Jaquette`), bouton « Frise »
    et tri restreint aux dates, tests unitaires et e2e.

27. **Collectionneurs invités** (v1.23, ADR-16, SPEC v1.39) — 6 PR, dans cet ordre (la 1re est un prérequis de
    sécurité) : (1) **rôles** : migration `profils` + `est_proprietaire()`, écriture du catalogue et des jaquettes
    réservée au rôle propriétaire, `exigerProprietaire()` et `/admin` vérifient le rôle, pgTAP ; (2) **invitations** :
    migration `invitations`, page « Collectionneurs » (créer, copier, annuler, supprimer un compte), page
    `/bienvenue/[jeton]` et création du compte par le serveur (clé secrète côté Vercel) ; (3) **mon profil** (`/profil` :
    pseudo, avatar, public, statistiques, derniers ajouts) et icône de compte selon le rôle ; (4) **badges** (calcul pur
    + affichage) ; (5) **profil public** (`profil_public()`, `/collectionneurs/[pseudo]`) ; (6) e2e de bout en bout
    (invitation → compte → profil public) et bilan.

29. **Guides japonais** (v1.40, ADR-19, SPEC v1.47) — 5 PR : (1) **documents** (ADR-19, modèle, plan) ;
    (2) **migration 0031** (`guides`, `guides_jeux`, `guides_exclus`, RLS), pgTAP, types ; (3) **module pur**
    `src/lib/guides/` + fixtures + `scripts/guides.mjs` (planche, `--ecrire`, `--sauf`) ; puis **remplissage 3DS et
    Switch** après la planche relue par le propriétaire ; (4) **page du guide** `/guides/[isbn]`, bloc « Guides » de la
    fiche, plan du site, sources dans « À propos » ; (5) **catalogue** : `/guides.json`, coches « Jeux » / « Guides »,
    cartes, recherche, filtres, tris, frise, e2e ; puis bilan.

**Réglages de comptes** (Supabase, Vercel, compte développeur Twitch pour IGDB) : regroupés dans une session
faite **depuis le PC** (leçon du bilan précédent), avant l'étape 2.

## 9. Risques

| # | Risque | Parade |
|---|---|---|
| R1 | Rapprochement Wikipédia ↔ GameTDB manqué (titre différent) | Jeu écarté avec la raison dans l'aperçu ; correction ou ajout à la main (US-11) ; tests sur fixtures |
| R2 | Pas de scan GameTDB pour une région | Vignette neutre, signalée dans le résumé ; remplaçable (US-12) |
| R9 | Wii : jaquettes moins grandes que la Wii U (≈ 485 px) ; découpe de la face mal placée sur certains scans | Découpe testée sur des scans réels (fixtures) ; photo du propriétaire en remplacement (US-12) |
| R3 | Droits des jaquettes | Mention de la source ; « non affilié » (US-07) ; retrait sur demande |
| R4 | Attributions (CC BY-SA Wikipédia, GameTDB) | Lien source sur chaque fiche + page À propos |
| R5 | Prévisualisation Vercel partageant la base de production | Prévenir dans la PR ; piste : branches Supabase |
| R6 | Image IGDB = illustration sans bandeau Wii U, pas un scan de boîte | Scans GameTDB en priorité ; restes remplacés à la main (US-12) ; aucun bandeau imité par le site |
| R9 | GameTDB indisponible, bloqué ou scan retiré | Relais par GitHub (#53) ; jaquette déjà copiée conservée ; mention de la source, retrait sur demande |
| R6 | Forme du tableau Wikipédia qui change | Lecture par en-têtes de colonnes, test sur fixture ; échec explicite plutôt que données fausses |
| R7 | *(Limites IGDB : sans objet depuis v0.8.)* | — |
| R10 | Switch 2 : liste Wikipédia qui change de forme ; jaquettes toutes à la main | Lecture par en-têtes, test sur fixture ; vignette neutre en attendant ; GameTDB revérifié à chaque étape (une base Switch 2 remplacerait Wikipédia) |
| R11 | Nouveautés : un champ changé non détecté | Comparaison testée sur fixtures (jeu inchangé, date corrigée, nouvelle région) ; « Tout réenregistrer » en secours |
| R8 | Codes produit absents | Déduits de l'identifiant GameTDB ; sinon saisie manuelle (US-11) |

## 10. Commandes (dès l'étape 1)

```
npm run dev | lint | typecheck | test | e2e
npm run db:start | db:test | db:types
```

## 11. Prochaines étapes

Backlog (demandes du propriétaire, dans l'ordre ; chaque étape commence par une étude ou une maquette validée) :

| Étape | Sujet | À trancher d'abord |
|---|---|---|
| 25 | **Prix eBay** dans la fiche : **terminée le 22/11** (#207, #208, #210, #211, #212 ; BILAN §14) | reste : accès aux ventes terminées (Marketplace Insights) à demander à eBay par le propriétaire ; ADR-17 point 8 |
| 26 | **ScreenScraper** : 1) **jaquettes manquantes**, toutes consoles (décision du 22/11 : 270 versions sorties sans jaquette sur 2 837, dont 177 japonaises : GBA 76, GB 54, NES 48, SNES 32, GBC 24) ; 2) consolidation rétro (NES à GameCube) : dates, éditeurs, jeux manquants. **Giant Bomb écarté** (21/11 : 403 depuis la session et depuis GitHub). ScreenScraper refuse aussi la session (403 du réseau) : tout passe par des tâches GitHub | identifiants en secrets GitHub `SCREENSCRAPER_DEVID`, `SCREENSCRAPER_DEVPASSWORD`, `SCREENSCRAPER_USER` (pseudo), `SCREENSCRAPER_PASSWORD` (ajoutés le 22/11) ; tâche « Étude ScreenScraper » (`scripts/etude-screenscraper.mjs`, lecture seule) : quota du compte, boîte de face `box-2D` de la bonne région par version (exacte, monde seule, autre région, aucune, jeu non trouvé) ; droit d'héberger les images ; puis plan de l'import (source de jaquette `screenscraper` : migration) ; **étude du 22/11** : boîte de la bonne région pour 164 versions sur 270, 99 jeux introuvables par le titre (GBA 47), 9 rapprochés sans titre identique (écartés) ; accord de ScreenScraper pour héberger les images avec mention de la source. **Import** : tâche « Relais ScreenScraper » → bucket privé `gametdb/screenscraper/{console}/{jeu}/{région}.jpg` (le résultat d'une tâche GitHub n'est pas lisible depuis la session) ; planche regardée par le propriétaire ; puis `scripts/jaquettes-screenscraper.mjs` depuis la session (versions toujours sans jaquette, source `screenscraper`, gardée par l'import comme `nintendo`). Ensuite : les 99 introuvables, puis dates et éditeurs ; **22/11** : 142 jaquettes écrites (2 refusées sur la planche), 128 versions encore sans jaquette. **2e passage** : recherche par code produit (`jeuInfos`, `serialnum`), puis par chaque titre connu et sa forme courte ; sans titre identique, le premier jeu trouvé par un titre complet est déposé dans `screenscraper-approche/…`, marqué « ≈ » sur la planche ; `--sauf n,n` écarte les numéros refusés ; **bilan du 22/11** : 2e passage +49 (Mickey Mouse: Magic Wands! JAP refusé), **191 jaquettes ScreenScraper**, 79 versions encore sans jaquette (15 Famicom Mini GBA, Densetsu no Starfy, Fire Emblem SNES et NES… : introuvables ; Advance Wars, Ring Fit Adventure JAP… : pas de boîte de leur région) → autre source ou photo (US-12). Reste de l'étape : dates et éditeurs rétro ; **dates et éditeurs** : tâche « Étude ScreenScraper dates » (`scripts/etude-screenscraper-dates.mjs`, lecture seule) : échantillon de jeux NES à GameCube (150 par défaut, graine fixe), jeu trouvé par code produit ou titre identique, dates comparées par région à la précision commune, éditeurs ramenés à la société ; écarts dans le journal ; **résultat complet (585 jeux, 1 137 versions)** : 457 jeux trouvés ; dates identiques à la précision commune 79 % (sur 1 084 comparées), jour ou mois différent 15 %, **58 années différentes** (5 %), toutes vérifiées sur l'encadré Wikipédia : ScreenScraper se trompe presque toujours (année seule approximative, date d'une autre console ou d'un autre jeu) ; **4 dates corrigées** chez nous (Pokémon Channel US, Top Gear Rally JAP, The Tower SP US, Nigel Mansell PAL : `scripts/dates-retro-corrigees.mjs`, date et précision verrouillées). Éditeurs : 88 % identiques ; les écarts viennent de l'éditeur unique de ScreenScraper pour toutes les régions → non repris. **Étape terminée** (22/11) |
| 28 | **Captures RAWG** dans la fiche (SPEC v1.43, ADR-18) : **terminée le 23/11** (#218, #220 à #225, #227, #228 ; BILAN §15) : 804 jeux avec captures | plan en 5 PR : 1) documents et maquette ; 2) tâche « Étude RAWG » en lecture seule (#220, **faite le 22/11**, §1 sexdecies : 81 % au titre identique, 92 % avec suffixes ignorés, aucun faux rapprochement accepté) ; 3) migration `captures` ; 4) relais + planche + écriture en base ; 5) carrousel de la fiche. Avant l'étude : clé RAWG du propriétaire en secret GitHub `RAWG_API_KEY` |
| 27 | **Profils utilisateurs** et **badges** | intention v1.5 (décision 9, 21/11) : comptes sur invitation, profil privé par défaut et public au choix, badges sur 4 axes ; puis SPEC, maquettes, conception (rôles propriétaire / invité, RLS) |
| 29 | **Guides japonais** (攻略本, intention v1.6 décision 10, v1.7) : guides dans le même catalogue que les jeux (carte propre avec la couverture, menant au jeu ; coches d'affichage « Jeux » et « Guides ») et listés dans la fiche du jeu ; ~~rétro d'abord~~ **3DS et Switch d'abord**, guides seulement (§1 septdecies : NDL + couvertures Google Books) ; case « je l'ai » plus tard | **étude des sources** en lecture seule (la session ne joint aucune de ces sources : tâche GitHub) : couverture du catalogue rétro (part des jeux avec au moins un guide), champs disponibles (couverture, éditeur, date, ISBN, pages), droit d'héberger les couvertures, rapprochement guide → jeu ; candidates : Retromags (base « Japanese Language Guides »), The Video Game Library, Internet Archive (`strategyguides`), NDL Search (ISBN), Zelda Dungeon et Bulbapedia ; lien d'achat ou prix : eBay (ADR-17) ou recherche Suruga-ya ; puis SPEC, maquettes (fiche + page), ADR, plan |
