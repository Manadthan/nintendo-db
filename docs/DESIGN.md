# Conception — Nintendo DB

> Étape 2 du playbook : **comment** construire ce que décrit `docs/SPEC.md` v1.2.
>
> Version 1.6 — 19/11/2026 — statut : **à valider**
>
> | Version | Date | Changements |
> |---|---|---|
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
| Écartés | identifiants en **Y** (démos, téléchargements), genre `software`/`demo`/`sampler`, titres « (Demo) », « Download », « Kiosk », « Taikenban » | identifiants autres que **A, B, C, E** (U = Super Nintendo, J = eShop, V = codes, H = logiciel), mêmes genres et titres |
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

Référence visuelle : **gamecartdb.com copie ses jaquettes chez lui** (WebP haute définition ≈ 300 Ko, servies par
Vercel avec un cache d'un an). C'est le modèle retenu (ADR-04).

## 2. Stack

Identique à `mon-site-sdlc` (décision 7 de l'intention) :

| Besoin | Choix |
|---|---|
| Pages et serveur | **Next.js** (App Router, TypeScript strict), server actions |
| Styles | **Tailwind CSS**, mobile d'abord, thèmes clair/sombre |
| Base, connexion, images | **Supabase** : Postgres (RLS), Auth (inscriptions désactivées), Storage (bucket public) |
| Import | **cheerio** (tableau Wikipédia, base GameTDB), **sharp** (WebP), relais GameTDB par GitHub Actions |
| Tests | **Vitest**, **Playwright** (375 × 812, WebKit + Chromium), **pgTAP** |
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
de la région (`coverHQ`, 768 × 1080 ; PAL : langue EN, sinon FR, DE) ; sans scan, vignette neutre, remplaçable à la
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

## 5. Modèle de données

```
consoles(id, slug, nom, type 'salon'|'portable', annee, ordre, wikipedia_liste, igdb_platform_id — inutilisé depuis v0.8)
games(id, console_id → consoles, slug, igdb_id, wikipedia_url, developpeur, franchise, genre,
      physique bool, verrous text[], created_at, updated_at)
releases(id, game_id → games, region 'JAP'|'US'|'PAL', sortie bool, titre, titre_romanise (JAP),
         date_sortie date, precision_date 'jour'|'mois'|'annee', code_produit, editeur,
         jaquette_path, jaquette_source 'gametdb'|'igdb'|'photo'|'url', verrous text[], updated_at)
         unique (game_id, region)
import_runs(id, console_id, lance_le, resume jsonb)
possessions(user_id → auth.users, game_id → games (cascade), region, cree_le) primary key (user_id, game_id, region)
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
   2. **Switch** : relais (base réduite `switch/switchtdb.xml`, scans `switch/scans` : `coverHQ` US, EN, FR, sinon
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

Valider ce document avec les maquettes v0.2 → issues de l'étape 1.
