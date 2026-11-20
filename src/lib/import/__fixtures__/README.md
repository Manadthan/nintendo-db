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

## `wiiutdb.xml`

| | |
|---|---|
| Source | https://www.gametdb.com/wiiutdb.zip?LANG=EN (base du 17/11/2026, version 20261117145358) |
| Conditions | Base GameTDB « pour que chacun l'utilise dans tout projet lié aux jeux » (FAQ) ; pas de licence formelle |
| Contenu | 140 entrées sur 2 860 : disques en boîte de Nintendo (code éditeur 01), plus Shovel Knight et NES Remix (cas de test) ; sans résumés ni empreintes de disque ; genres des disques et leur traduction française (bloc `<genres>`, US-06) |

Fabriquée par :

```
node scripts/fixture-gametdb.mjs <wiiutdb.zip> > src/lib/import/__fixtures__/wiiutdb.xml
```

Résultats attendus : 46 jeux de la liste Wikipédia rapprochés ; 3 boîtes Nintendo absentes de Wikipédia
(NES Remix Pack, New Super Mario Bros. U + New Super Luigi U, Mario vs. Donkey Kong: Minna de Mini Land).

## `wiitdb.xml` (étape 8)

| | |
|---|---|
| Source | https://www.gametdb.com/wiitdb.zip?LANG=EN (base du 17/11/2026, version 20261117154122) |
| Conditions | Comme la base Wii U ci-dessus |
| Contenu | Base **réduite comme le dépose le relais** (`reduireBaseWii`) : 234 disques du commerce (identifiant en R ou S) des 88 jeux dont au moins une boîte est éditée par Nintendo ; champs lus par l'import ; genres en français |

Fabriquée par :

```
node scripts/fixture-gametdb-wii.mjs <wiitdb.zip> > src/lib/import/__fixtures__/wiitdb.xml
```

## `dstdb.xml` et `3dstdb.xml` (étape 9)

| | |
|---|---|
| Source | https://www.gametdb.com/dstdb.zip?LANG=EN (version 20261120152947, téléchargée le 20/11/2026 : SPEC v1.33) et https://www.gametdb.com/3dstdb.zip?LANG=EN (version 20261117153429, téléchargée le 17/11/2026) |
| Conditions | Comme la base Wii U ci-dessus |
| Contenu | Bases **réduites comme le dépose le relais** (`reduireBasePortable`) : cartes du commerce des jeux dont au moins une carte est éditée par Nintendo (« Nintendo » ou « 任天堂 »), sans démos, bornes, logiciels, jeux Super Nintendo ou eShop ; DS : 420 cartes (131 jeux après les rééditions ; identifiants en Y gardés, région vide déduite de l'identifiant), 3DS : 295 cartes (118 jeux) |

Fabriquées par :

```
node scripts/fixture-gametdb-portable.mjs ds <dstdb.zip> > src/lib/import/__fixtures__/dstdb.xml
node scripts/fixture-gametdb-portable.mjs 3ds <3dstdb.zip> > src/lib/import/__fixtures__/3dstdb.xml
```

## `switchtdb.xml` (étape 10)

| | |
|---|---|
| Source | https://www.gametdb.com/switchtdb.zip?LANG=EN (version 20261118053903), téléchargée le 18/11/2026 |
| Conditions | Comme la base Wii U ci-dessus |
| Contenu | Base **réduite comme le dépose le relais** (`reduireBaseSwitch`) : cartouches du commerce (type `Switch`, identifiant terminé par une lettre, au moins une région JPN, USA, EUR ou ALL) des jeux dont au moins une cartouche est éditée par Nintendo : 141 cartouches, 112 jeux |

Fabriquée par :

```
node scripts/fixture-gametdb-switch.mjs <switchtdb.zip> > src/lib/import/__fixtures__/switchtdb.xml
```

## `gctdb.xml` (étape 11)

| | |
|---|---|
| Source | https://www.gametdb.com/wiitdb.zip?LANG=EN&GAMECUBE=1 (version 20261118185002), téléchargée le 18/11/2026 |
| Conditions | Comme la base Wii U ci-dessus |
| Contenu | Base **réduite comme le dépose le relais** (`reduireBaseWii` avec `estDisqueGameCubeDuCommerce`) : disques GameCube du commerce (G, plus Zelda Collector's Edition et Pac-Man Vs.) des jeux dont au moins une boîte est éditée par Nintendo : 158 disques, 58 jeux |

Fabriquée par :

```
node scripts/fixture-gametdb-gamecube.mjs <wiitdb-gc.zip> > src/lib/import/__fixtures__/gctdb.xml
```

## `switch-2-wikipedia.html` (étape 10)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Nintendo_Switch_2_games&action=render, téléchargée le 18/11/2026 |
| Conditions | CC BY-SA 4.0, comme la liste Wii U ci-dessus |
| Contenu | Premier tableau « wikitable », nettoyé comme la liste Wii U : 1 033 jeux, dont 34 édités par Nintendo (30 datés au jour près) |

Fabriquée par :

```
node scripts/fixture-wikipedia.mjs <page.html> > src/lib/import/__fixtures__/switch-2-wikipedia.html
```

## `n64-wikipedia.html` et `gba-wikipedia.html` (étape 14)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Nintendo_64_games&action=render et https://en.wikipedia.org/w/index.php?title=List_of_Game_Boy_Advance_games&action=render, téléchargées le 19/11/2026 |
| Conditions | CC BY-SA 4.0, comme la liste Wii U ci-dessus |
| Contenu | Tableau des jeux : ses 2 lignes d'en-tête, les jeux dont un éditeur est Nintendo (N64 : 58, GBA : 120) et 15 autres ; clés de tri cachées et annotations techniques retirées |

Fabriquées par :

```
node scripts/fixture-wikipedia-cartouches.mjs <page.html> > src/lib/import/__fixtures__/n64-wikipedia.html
```

## `metacritic-wikipedia.json` (étape 13)

| | |
|---|---|
| Source | API de Wikipédia anglais (`action=query&prop=revisions`, redirections suivies), 16 articles de jeux, le 19/11/2026 |
| Conditions | CC BY-SA 4.0, comme la liste Wii U ci-dessus |
| Contenu | Pour chaque article, seulement l'encadré du jeu (« Infobox video game ») et celui des critiques (« Video game reviews »), là où se lit la note Metacritic ; les redirections de l'API (« Doubutsu Banchou » → « Cubivore ») |

Fabriquée par :

```
node scripts/fixture-metacritic.mjs <réponse API.json> > src/lib/import/__fixtures__/metacritic-wikipedia.json
```

## `n64-libretro.xml` et `gba-libretro.xml` (étape 14)

| | |
|---|---|
| Source | Noms des fichiers du dossier `Named_Boxarts` des dépôts https://github.com/libretro-thumbnails/Nintendo_-_Nintendo_64 et …/Nintendo_-_Game_Boy_Advance, le 19/11/2026 |
| Conditions | Noms de fichiers seulement (aucune image) |
| Contenu | Index **identique à celui que dépose le relais** (`indexEnXml`) : N64 1 115 boîtes, GBA 5 961 |

Fabriquées par :

```
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/libretro-thumbnails/Nintendo_-_Nintendo_64.git
node scripts/fixture-libretro.mjs Nintendo_-_Nintendo_64 > src/lib/import/__fixtures__/n64-libretro.xml
```

## `n64-nointro.dat` et `gba-nointro.dat` (étape 15)

| | |
|---|---|
| Source | https://github.com/libretro/libretro-database, `metadat/no-intro/Nintendo - Nintendo 64.dat` et `… - Game Boy Advance.dat`, le 19/11/2026 |
| Conditions | Noms et numéros de série des cartouches seulement (aucune image, aucun contenu de jeu) |
| Contenu | Même format que l'original, réduit aux lignes lues (`name`, `region`, `serial`) : sans les lignes `rom` (sommes de contrôle). N64 2 263 entrées, GBA 3 509 |

Fabriquées par :

```
node scripts/fixture-nointro.mjs "Nintendo - Nintendo 64.dat" > src/lib/import/__fixtures__/n64-nointro.dat
```

## `gbc-wikipedia.html`, `gbc-libretro.xml`, `gbc-nointro.dat` (étape 17)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Game_Boy_Color_games&action=render ; dépôt https://github.com/libretro-thumbnails/Nintendo_-_Game_Boy_Color (noms de fichiers) ; libretro-database `metadat/no-intro/Nintendo - Game Boy Color.dat` ; le 19/11/2026 |
| Conditions | Wikipédia : CC BY-SA 4.0 ; libretro : noms de fichiers et numéros de série seulement |
| Contenu | Liste : ligne d'en-tête, 45 jeux Nintendo et 15 autres ; index : 1 524 boîtes ; No-Intro : 2 446 entrées, réduites aux lignes lues |

Fabriquées par `scripts/fixture-wikipedia-cartouches.mjs`, `scripts/fixture-libretro.mjs` et `scripts/fixture-nointro.mjs`, comme pour la N64 et la GBA.

## `gb-wikipedia.html`, `gb-libretro.xml`, `gb-nointro.dat` (étape 18)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Game_Boy_games&action=render ; dépôt https://github.com/libretro-thumbnails/Nintendo_-_Game_Boy (noms de fichiers) ; libretro-database `metadat/no-intro/Nintendo - Game Boy.dat` ; le 19/11/2026 |
| Conditions | Wikipédia : CC BY-SA 4.0 ; libretro : noms de fichiers et numéros de série seulement |
| Contenu | Liste : 2 lignes d'en-tête, 91 jeux Nintendo et 15 autres ; index : 1 647 boîtes ; No-Intro : 2 144 entrées, réduites aux lignes lues |

Fabriquées par les mêmes scripts que la Game Boy Color.

## `vb-wikipedia.html`, `vb-libretro.xml`, `vb-nointro.dat` (étape 19)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Virtual_Boy_games&action=render ; dépôt https://github.com/libretro-thumbnails/Nintendo_-_Virtual_Boy (noms de fichiers) ; libretro-database `metadat/no-intro/Nintendo - Virtual Boy.dat` ; le 19/11/2026 |
| Conditions | Wikipédia : CC BY-SA 4.0 ; libretro : noms de fichiers et numéros de série seulement |
| Contenu | Liste entière (22 jeux, dont 11 Nintendo) ; index : 42 boîtes ; No-Intro : 64 entrées, réduites aux lignes lues |

Fabriquées par les mêmes scripts que la Game Boy Color.

## `snes-wikipedia.html`, `snes-libretro.xml`, `snes-nointro.dat` (étape 20)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Super_Nintendo_Entertainment_System_games&action=render ; dépôt https://github.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System (noms de fichiers) ; libretro-database `metadat/no-intro/Nintendo - Super Nintendo Entertainment System.dat` ; le 19/11/2026 |
| Conditions | Wikipédia : CC BY-SA 4.0 ; libretro : noms de fichiers et numéros de série seulement |
| Contenu | Liste : 2 lignes d'en-tête, 98 jeux Nintendo et 15 autres ; index : 3 782 boîtes ; No-Intro : 3 746 entrées, réduites aux lignes lues |

Fabriquées par les mêmes scripts que la Game Boy Color.

## `nes-wikipedia.html`, `nes-libretro.xml`, `nes-nointro.dat` (étape 21)

| | |
|---|---|
| Source | https://en.wikipedia.org/w/index.php?title=List_of_Nintendo_Entertainment_System_games&action=render ; dépôt https://github.com/libretro-thumbnails/Nintendo_-_Nintendo_Entertainment_System (noms de fichiers) ; libretro-database `metadat/no-intro/Nintendo - Nintendo Entertainment System.dat` ; le 19/11/2026 |
| Conditions | Wikipédia : CC BY-SA 4.0 ; libretro : noms de fichiers et numéros de série seulement |
| Contenu | Liste : 2 lignes d'en-tête, 104 jeux Nintendo et 15 autres ; index : 13 896 boîtes ; No-Intro : 13 296 entrées, réduites aux lignes lues (presque sans numéro de série : codes à la main) |

Fabriquées par les mêmes scripts que la Game Boy Color.

## `nintendo-europe.json`, `nintendo-japon.json` (étape 22, ADR-13)

| | |
|---|---|
| Source | Base de Nintendo Europe (https://searching.nintendo-europe.com/en/select, jeux) et de Nintendo Japon (https://search.nintendo.jp/nintendo_soft/search.json), lues le 20/11/2026 |
| Conditions | Données publiques des sites de Nintendo ; seuls l'éditeur, les codes produit et le titre sont gardés |
| Contenu | Extraits : 5 jeux européens (4 édités par Nintendo dont Fire Emblem: Three Houses et Fire Emblem Fates, 1 par Ubisoft), 5 jeux japonais (Pikmin 4, Buddy Mission BOND, Pokémon LEGENDS Z-A par The Pokémon Company, Shovel Knight 3DS par Nintendo, Fit Boxing 3 par Imagineer) |

Choisis à la main dans les bases complètes pour couvrir chaque règle (éditeur, console, région).

Ajouts du 20/11/2026 (ADR-14) : champs `physical_version_b` et `system_type` (Fire Emblem Fates, Ever Oasis) et
`sform` des jeux 3DS japonais (Ever Oasis : carte et téléchargement ; Fire Emblem if 透魔王国 : téléchargement seul).
