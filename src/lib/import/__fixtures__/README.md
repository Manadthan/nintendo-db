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
| Source | https://www.gametdb.com/dstdb.zip?LANG=EN (version 20261117152530) et https://www.gametdb.com/3dstdb.zip?LANG=EN (version 20261117153429), téléchargées le 17/11/2026 |
| Conditions | Comme la base Wii U ci-dessus |
| Contenu | Bases **réduites comme le dépose le relais** (`reduireBasePortable`) : cartes du commerce des jeux dont au moins une carte est éditée par Nintendo (« Nintendo » ou « 任天堂 »), sans démos, bornes, logiciels, jeux Super Nintendo ou eShop ; DS : 358 cartes (114 jeux après les rééditions), 3DS : 295 cartes (118 jeux) |

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
