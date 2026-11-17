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
