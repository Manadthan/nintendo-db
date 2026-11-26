# CLAUDE.md — Nintendo DB

Lu par Claude au début de chaque session. Court par principe : les détails sont dans les documents.

## Objectif

Site de référence des **jeux publiés par Nintendo**, sur **toutes les consoles Nintendo** (**v1 : Wii U**), avec
bascule entre les versions **JAP / US / PAL** (titre, date, code produit, visuels propres à chaque région).
Inspiration : gamecartdb.com, limité à Nintendo éditeur. En ligne : **https://nintendo-db.vercel.app**.

**Projet d'apprentissage** du SDLC avec Claude : explique brièvement *pourquoi* tu fais chaque choix et
fais valider les décisions importantes (questions à choix). Le propriétaire travaille surtout depuis
l'app Claude sur **iPhone 12 mini** : réponses courtes, pas de commandes à taper sur son ordinateur.
Interface en **français**.

## Méthode

Suivre **`PLAYBOOK.md`** : intention → spec → design/maquettes → plan → PR → revue → déploiement → bilan.

## Documents de référence

| Fichier | Contenu | Statut |
|---|---|---|
| `PLAYBOOK.md` | Méthode SDLC appliquée au projet | v1.0 validée |
| `intent/intent.md` | Problème, résultat attendu, contraintes, décisions | v1.8 à valider |
| `docs/SPEC.md` | User stories + critères d'acceptation (= définition de « terminé ») | v1.53 à valider |
| `docs/DESIGN.md` | Stack, ADR, modèle de données, sources de données, tests, risques | v1.47 à valider |
| `docs/MAQUETTES.md` | Lien vers les maquettes (2 écrans de la v1, Statistiques, Frise, Collectionneurs, Prix eBay, Captures, Guides, À venir, Amiibo : `docs/maquettes/`) | v0.14 à valider |
| `docs/avancement/` | Avancement détaillé des étapes en cours (un fichier par étape) | à jour |
| `docs/BILAN.md` | Rétrospective : v1 (étapes 1 à 7), étapes 8 à 10 (§8), étapes 11 à 14 (§9), 15 à 17 (§10), 18 à 22 (§11), 23 à 27 (§12), audit de performance (§13), étape 25 (§14), étape 28 (§15), étape 29 (§16), couvertures Amazon (§17), étape 30 (§18), étape 31 (§19) : chiffres, réussites, difficultés, leçons | v1.13 à valider |

## Règles de travail

- **Jamais de commit direct sur `main`.** Une issue → une branche → une PR → revue du propriétaire → merge.
- Branches : `feat/us-xx-…`, `fix/…`, `docs/…`, `chore/…`. Commits **Conventional Commits**.
- PR petites (< 300 lignes), décrivent les critères couverts **et ce qui n'a pas été vérifié**.
- **Donner le lien de prévisualisation Vercel dès l'ouverture d'une PR** (message au propriétaire + « Comment tester ») :
  `https://nintendo-db-git-<branche, / remplacés par ->-manadthan.vercel.app`.
- **Plan validé avant de coder** chaque étape.
- Toute fonctionnalité arrive avec ses tests ; CI verte avant merge ; montrer la sortie des tests.
- Bug : d'abord un test qui échoue, puis la correction sans modifier le test.
- Données de jeux testées sur des **fixtures**, jamais sur des sites en direct.
- Aucun secret dans le dépôt.
- Une demande qui contredit SPEC ou DESIGN : le signaler, mettre le document à jour d'abord.
- Claude fait tout jusqu'au merge sur `main`, **jamais le merge lui-même**.
- Même erreur commise deux fois → skill `correct` (la rendre impossible), puis ajouter la règle ici.
- **pstack par défaut** (`.claude/skills/PSTACK.md`) : `tdd` pour chaque bug, `typescript-best-practices` pour le code,
  `blast-radius` avant une PR risquée, `how`/`why` avant de modifier une partie inconnue. PLAYBOOK.md reste la méthode.

## Stack et commandes

Next.js 16 (App Router, TypeScript strict) · Tailwind 4 · Vitest · Playwright · GitHub Actions ;
Vercel (région Paris `cdg1`, `vercel.json`) ; Supabase (`supabase/`, migrations appliquées en production au merge).

```
npm run dev        # serveur local
npm run check      # lint + typecheck + tests unitaires : avant chaque commit (hook .claude/hooks/ : commit refusé si rouge), sortie montrée
npm run build      # build de production : lit la base (accueil préparé à l'avance) → variables Supabase requises
npm run e2e        # Playwright 375 × 812 (Chromium ici ; WebKit seulement en CI) ; base requise (CI : base jetable)
npm run db:start   # base locale (Docker : absent de l'environnement de Claude → la CI fait foi)
npm run db:test    # tests pgTAP
npm run db:types   # régénérer src/types/database.ts après une migration
npm run session -- scripts/xxx.mjs  # script de données sur la base de production, depuis la session Claude
npm run relais     # relais GameTDB depuis la session Claude (GameTDB bloque GitHub)
```

- Le schéma évolue **uniquement** par `supabase/migrations/`. Une migration appliquée en production ne se modifie
  jamais : on en ajoute une nouvelle. Les prévisualisations Vercel partagent la base de production : le signaler
  dans toute PR qui touche la base.

## Arborescence

```
src/app/                 pages (App Router) — layout.tsx, page.tsx, globals.css (couleurs des maquettes)
src/app/admin/           administration (US-09) : connexion/, accueil, import/ (US-10, ?console=wii), jaquettes/ (liste ?console=, remplacement /admin/jaquettes/{console}/{jeu}/{région}, US-12), jeux/ (liste ?console= ?filtre=sans-code, correction /admin/jeux/{console}/{jeu}, US-11), notes/ (notes Metacritic depuis Wikipédia, ?console=, US-17), statistiques/ (US-18), collectionneurs/ (invitations par lien, comptes des invités, US-19), import/annonces/ (jeux à venir de Nintendo, menu « même jeu que », US-33 : components/ImportAnnonces.tsx) ; actions/annonces.ts, auth.ts, collectionneurs.ts, import.ts, jaquettes.ts, jeux.ts, metacritic.ts
src/lib/auth/proprietaire.ts  exigerProprietaire() : en tête de CHAQUE action d'administration ; vérifie le rôle « proprietaire » en base (est_proprietaire(), ADR-16), pas seulement la session
src/proxy.ts             contrôle de connexion et de rôle, sur /admin SEULEMENT (les pages publiques restent statiques) ; un collectionneur invité est renvoyé à son profil (/profil)
src/lib/auth/routes.ts   règles de redirection de l'administration + tests ; session-navigateur.ts : connecté ou non, lu dans le navigateur (pages statiques)
src/lib/catalogue/       toutes les consoles (charger.ts : jeux + consoles, étape 8), version affichée, dates en français, tri, groupes (catalogue.ts), marché : adresse ?marche= puis navigateur (marche.ts), recherche ?q= (recherche.ts), filtres ?console= ?dispo= ?annee= ?genre= ?dev= ?serie= (filtres.ts, US-06 ; Série : SPEC v1.37), studios nettoyés et « Nintendo (first party) » (developpeurs.ts, #89), couleur de la note Metacritic (metacritic.ts, US-17), frise : années et côtés, tris par date (frise.ts, SPEC v1.38), affichage par lots de 60 (lots.ts, SPEC v1.41), position au retour d'une fiche avec le nombre de jeux dessinés (defilement.ts), jeux à venir : calculé depuis la date et sa précision, jour de Paris, clé de tri, jeux de la bande « À venir » (a-venir.ts, US-32, ADR-20), lecture (charger.ts) + tests
src/lib/prix/            prix eBay (US-25, ADR-17) : pertinence des annonces (suites, lots, régions), médiane, euros (taux BCE), liens vers les ventes (prix.ts, pur), recherches par version (calcul.ts), accès eBay et BCE (ebay.ts, serveur seulement), libellés et ancienneté (affichage.ts) ; amiibo (US-29) : « amiibo {nom} », sans catégorie, lots / cartes NFC / customs écartés, figurine ≠ carte (amiibo.ts) + tests ; routes src/app/api/prix/[console]/[jeu]/ et src/app/api/prix/amiibo/[slug]/ (gardées 6 h, 503 si eBay ne répond pas) ; __fixtures__/ (réponse Browse et taux BCE écrits à la main)
src/lib/captures/       captures RAWG (US-26, ADR-18) : plateformes RAWG par console, rapprochement titre + console (suffixes « (année) », « (console) », « The » ignorés), 6 captures au plus, adresses réduites 640 / 1280 (rawg.ts, pur, sans import : lu par le relais) + tests ; __fixtures__/ (réponses RAWG écrites à la main)
src/lib/guides/          guides japonais (US-27, US-28, ADR-19) : ISBN 10 → 13, guide ou artbook / magazine, rapprochement livre ↔ jeu (suites, titre plus long d'un autre jeu, console citée ou date proche), dates et pages NDL, adresses de couverture et page Google Books, liens Amazon Japon et Suruga-ya (guides.ts, pur, sans import : lu par le script) ; couvertures Amazon : ISBN 10, adresse, image vide d'1 px, chemin versionné (amazon.ts, pur, sans import : lu par scripts/couvertures-amazon.mjs) ; lecture d'une réponse NDL OpenSearch (ndl.ts), couverture affichée : copie Amazon, sinon Google Books (couverture.ts, SPEC v1.52), page du guide : jeux couverts, métadonnées, schema.org Book (page.ts), lecture (charger.ts), guides du catalogue : réponse de /guides.json et lien avec les jeux chargés (catalogue.ts) + tests ; route src/app/guides.json/ (préparée, 5 min) ; page src/app/guides/[isbn]/ (ISR 5 min, couverture : components/CouvertureGuide.tsx, e2e : tests/e2e/guides.sql) ; __fixtures__/ (réponses NDL et Google Books du 24/11)
src/lib/amiibo/           amiibo (US-29 à US-31, ADR-21) : lecture d'AmiiboAPI (type lu dans l'identifiant, séries, dates JAP / US / PAL, jeux compatibles), fusion avec Nintendo US (2026, boîtes ; coffrets de cartes écartés), Europe (dates PAL, amiibo absents ailleurs) et Japon (nom et date JAP par le code de la figurine, sinon série + jour unique), éditeur par série, slugs uniques, rattachement des jeux compatibles au catalogue (amiibo.ts, pur, sans import : lu par le script) + tests ; __fixtures__/ (extraits réels du 25/11) ; fiche de l'amiibo et bloc « Amiibo (N) » de la fiche du jeu : images du bucket construites à l'affichage, région par défaut, date, référencement Product (fiche.ts), lecture (charger.ts) + tests ; page src/app/amiibo/[slug]/ (ISR 5 min, e2e : tests/e2e/amiibo.sql), composants FicheAmiibo, AmiiboDuJeu, ImageAmiibo, BasculeRegion (JAP / US / PAL, partagée avec FicheJeu) ; catalogue : réponse de /amiibo.json (séries ramenées aux noms de nos jeux, consoles des jeux compatibles), cartes mêlées aux jeux selon le marché, recherche (catalogue.ts) + tests ; route src/app/amiibo.json/ (préparée, 5 min) ; coche « Amiibo » (?voir=amiibo, voir.ts), CarteAmiibo
src/lib/statistiques/   statistiques du propriétaire (US-18, ADR-11) : calculs purs (statistiques.ts : collection par console, régions, Metacritic, état du catalogue) + tests, lecture paginée (charger.ts : chargerCollection, aussi pour Mon profil ; catalogue en cache 5 min, étiquette `catalogue` vidée par chaque action qui modifie un jeu, ADR-11 v1.25) ; page src/app/admin/statistiques/
src/app/bienvenue/[jeton]/  page « Bienvenue » d'un lien d'invitation : compte créé par le serveur (clé secrète), invitation réservée puis rendue en cas d'échec (US-20, actions/bienvenue.ts)
src/app/collectionneurs/[pseudo]/  profil public (US-23) : seulement si public (profil_public(), migration 0026), noindex, hors plan du site ; gardé 5 min et refait aussitôt quand le profil change (revalidatePath) ; jeux possédés par console
src/app/profil/          Mon profil (US-22) : pseudo, avatar, profil public, ma collection (jeux, versions, badges, par console, par région), badges gagnés et prochains (US-24), derniers ajouts, déconnexion ; tout compte connecté (actions/profil.ts)
src/lib/profil/          avatars : 12 identifiants, ceux de la base (avatars.ts + test qui relit la migration 0024) ; collection résumée, badges, derniers ajouts et jeux par console (collection.ts, calculs de US-18 réutilisés : syntheseProfil), lecture du compte (charger.ts) ou d'un profil public (public.ts), adresse publique (adresse.ts) + tests
src/app/jeux/[console]/[jeu]/  fiche d'un jeu (US-04), préparée à l'avance ; src/app/not-found.tsx : 404 en français
src/lib/fiche/           conversion et région par défaut de la fiche (fiche.ts), lecture (charger.ts) + tests
src/components/          EnTete (collé en haut au défilement ; Logo ; icônes Catalogue, À propos, BoutonTheme, BoutonCompte : seul accès à la connexion ou au compte (/admin, collectionneur renvoyé à /profil), SPEC v1.15 ; Avatar + ChoixAvatar (12 icônes SVG dessinées pour le site, ADR-16) ; BoutonHaut « Remonter en haut », SPEC v1.34), Catalogue (client : recherche différée et mémorisée, marché, tri, filtres, lots de 60 au défilement), ListeJeux (grille/liste/frise, mémorisée : la frappe ne redessine pas les cartes), Frise (vue chronologique : jeux en alternance, année au centre, SPEC v1.38), Filtres (panneau et pastilles, US-06), FicheJeu (client : JAP/US/PAL), AnalyseImport (client : aperçu puis enregistrement par lots), Jaquette (ou vignette neutre), Disponibilite, NoteMetacritic (pastille aux couleurs Metacritic sur la jaquette du catalogue, US-17), PrixEbay (bloc « Prix eBay » de la fiche, demandé à /api/prix après l'affichage, masqué si eBay ne répond pas, US-25), EtiquetteAVenir (jeu annoncé, US-32 : cartes du catalogue, frise, fiche), BandeAVenir (bande « À venir » de l'accueil, au-dessus de « Tous les jeux », 12 cartes, défilement de côté en CSS, US-32), Captures (bloc « Captures » de la fiche : carrousel des captures RAWG en 640, image en grand dans un <dialog>, image cassée retirée, lien RAWG, US-26)
src/lib/referencement/   adresse du site, sitemap, robots, métadonnées et données structurées des fiches (étape 7) + tests ; src/app/sitemap.ts, robots.ts
src/lib/theme/           choix du thème : auto/clair/sombre, script anti-éclair (US-08) + tests
src/lib/recherche/       normaliser() pour la recherche (ADR-05) + tests
src/lib/import/          import (ADR-03) : consoles.ts (sources par console : Wii U = Wikipédia + GameTDB, Wii, DS, 3DS = GameTDB seul ; chemins du relais, codes WUP-P-/RVL-/NTR-/CTR-P-/KTR-P-/HAC-P-/DOL-), wikipedia.ts (tableau « List of Wii U games »), wikipedia-switch-2.ts (liste Switch 2 : Wikipédia seul, date au jour près, étape 10), wikipedia-cartouches.ts (listes NES, Game Boy, Super Nintendo, Virtual Boy, N64, GBA et Game Boy Color : en-tête sur 1 ou 2 lignes, cellules fusionnées, dates par région, préfixe DMG- / CGB- par jeu, « —N/a », éditeurs « (JP) » entre parenthèses, « Cancelled », titres japonais de la cellule pour la boîte JAP, étapes 14, 17 à 21), libretro.ts (boîtes libretro-thumbnails : index, rapprochement titre + région, adresse ; lu aussi par le relais), nointro.ts (séries No-Intro de libretro-database : codes produit NUS-/AGB-, boîte japonaise par la série, étape 15), apercu.ts (aperçu, lots de 10, résumés, nouveautés : nouveau / modifié / inchangé, jeux à venir), donnees.ts (assemblage, fusion avec verrous, choix des jaquettes), jaquettes.ts (WebP 300/600/768 via sharp), gametdb.ts (boîtes par région, titres japonais, compilations, codes produit ; lu depuis le relais), resultat.ts (erreurs des actions rendues lisibles), physique.ts (règle : boîte Nintendo exigée, sorties par région), relais-wii.ts (base Wii réduite, face avant découpée, disques GameCube du commerce et petite image en JPEG : lu aussi par le relais), relais-portables.ts (DS/3DS : cartes du commerce, langue du scan, carte PAL anglaise, base réduite), relais-switch.ts (Switch : régions « ALL », cartouches du commerce, scans par région, base réduite), reessais.ts (réessais des envois du relais, #92), metacritic.ts (note Metacritic lue dans l'encadré Wikipédia : note de la console du jeu ou ambiguë, US-17), editeurs-officiels.ts (éditeurs de Nintendo Europe et Japon pour un éditeur vide chez GameTDB, Switch et 3DS, ADR-13 ; lu par le relais), eshop.ts (visuel « Nintendo eShop » de GameTDB reconnu par empreinte : ni déposé par le relais, ni copié par l'import, 23/11/2026), annonces.ts (jeux à venir lus chez Nintendo Japon, Europe et US : dates et précisions, éditions spéciales et contenus en plus écartés, boîte US du My Nintendo Store, doublons ; sans import : lu par le relais des annonces ; Nintendo Europe lu en anglais, US-33, ADR-20), import-annonces.ts (régions d'un même jeu regroupées, menu « même jeu que » du Japon, rapprochement avec le catalogue, nouveau / modifié / inchangé / écarté, verrous, boîte US en jaquette) + tests ; __fixtures__/ (copies datées, README)
scripts/                 icones.mjs (apple-icon.png), fixture-wikipedia.mjs, fixture-gametdb.mjs, fixture-gametdb-wii.mjs, fixture-gametdb-portable.mjs, fixture-gametdb-switch.mjs, fixture-gametdb-gamecube.mjs, fixture-metacritic.mjs, fixture-wikipedia-cartouches.mjs, fixture-libretro.mjs, fixture-nointro.mjs, jaquettes-gamecartdb.mjs (jaquettes Switch 2 US et PAL copiées de gamecartdb, lancé depuis la session comme le relais), jaquettes-pal-francaises.mjs (boîtes PAL Wii U et Switch remplacées une fois par la française de GameTDB, SPEC v1.28), jaquettes-nintendo-eu.mjs (boîtes PAL officielles PEGI de nintendo.com/eu, source « nintendo », SPEC v1.29), jaquettes-manquantes.mjs (versions sans jaquette du contrôle du 20/11/2026 : officielles Nintendo EU / JP / US, sinon GameTDB ; planche docs/planches/), retirer-jeux.mjs (4 jeux retirés + exclusions, 20/11/2026), series-wikidata.mjs (séries du catalogue : titre + Wikidata, ADR-15 ; --essai, --limite, --rapport), etude-giantbomb.mjs (étape 26 : échantillon rétro comparé à l'API Giant Bomb, lecture seule, tâche GitHub « Étude Giant Bomb »), etude-screenscraper.mjs (étape 26 : versions sans jaquette cherchées chez ScreenScraper, lecture seule, tâche GitHub « Étude ScreenScraper » ; identifiants jamais écrits), etude-ebay.mjs (étape 25 : annonces eBay en cours d'un échantillon et accès aux ventes terminées, lecture seule, tâche GitHub « Étude eBay » ; clés jamais écrites), etude-screenscraper-dates.mjs (étape 26 : dates et éditeurs d'un échantillon rétro comparés à ScreenScraper, lecture seule, tâche GitHub « Étude ScreenScraper dates »), dates-retro-corrigees.mjs (4 dates rétro corrigées et verrouillées après vérification sur Wikipédia, 22/11/2026), etude-guides.mjs (étape 29 : guides japonais d'un échantillon (ETUDE_CONSOLES, ex. 3ds,switch) cherchés chez NDL Search (titre japonais par Wikidata ; un appel toutes les 6 s), couvertures chez openBD, NDL, Open Library et Google Books (clé : en-tête X-Goog-Api-Key ajouté par le réseau de la session, GOOGLE_BOOKS_CLE en tâche GitHub ; country=JP), scans chez Internet Archive ; lecture seule ; se lance depuis la session (NODE_USE_ENV_PROXY=1) ou par la tâche GitHub « Étude guides »), amiibo.mjs (étape 30, US-31, depuis la session : --planche /dossier (AmiiboAPI + Nintendo US, Europe, Japon ; amiibo.json, jeux.md, planches par série) puis --ecrire /dossier --sauf n,n --sans-jeu n:titre (images WebP 300/600 dans le bucket amiibo, sorties, jeux ; écartés dans amiibo_exclus ; relançable) ; remplissage du 25/11 : 954 amiibo), couvertures-amazon.mjs (26/11/2026, SPEC v1.52 : couvertures des guides copiées depuis Amazon Japon dans le bucket guides ; --planche /dossier puis --ecrire /dossier --sauf n,n ; guide verrouillé « couverture » jamais touché), guides.mjs (étape 29, US-28, depuis la session : --console 3ds --planche /dossier (NDL un appel toutes les 6 s, couvertures Google Books, planche + guides-{console}.json), puis --ecrire /dossier --console 3ds --sauf n,n (planche de cette console seulement, #273 ; guides gardés écrits, numéros écartés dans guides_exclus) ; --limite n pour un essai), etude-rawg.mjs (étape 28 : échantillon cherché chez RAWG par titre et console, captures, version réduite 640 ; lecture seule, tâche GitHub « Étude RAWG » ; clé jamais écrite), relais-rawg.mjs (tâche GitHub « Relais RAWG » : jeux cherchés chez RAWG → bucket privé gametdb/rawg/{console}.json ; entrées consoles, tous), captures-rawg.mjs (depuis la session : --planche /dossier, une planche par console, puis écriture des captures et de games.rawg_slug ; --sauf n,n, --console ; « ≈ » : titre RAWG pas exactement le nôtre), relais-screenscraper.mjs (tâche GitHub « Relais ScreenScraper » : boîtes des versions sans jaquette → bucket privé gametdb/screenscraper/{console}/{jeu}/{région}.jpg), jaquettes-screenscraper.mjs (depuis la session : --planche pour regarder, puis écriture, --sauf n,n pour écarter des numéros de la planche ; « ≈ » : rapprochement sans titre identique, screenscraper-approche/ ; source « screenscraper »), jaquettes-eshop.mjs (6 fausses jaquettes « Nintendo eShop » Switch, 23/11/2026 : 3 boîtes JAP officielles, 3 images retirées), jaquettes-sans-usk.mjs (3 boîtes PAL USK remplacées par une boîte PEGI seul, 20/11/2026 ; 28 autres sans remplaçante), jaquettes-sans-boitier.mjs (boîtier en plastique retiré de 103 jaquettes Switch et Switch 2, 23/11/2026, SPEC v1.44 : --planche puis écriture ; relance sans effet), famicom-mini.mjs (Famicom Mini GBA, 23/11/2026 : 28 boîtes JAP, libretro ou site officiel japonais, codes AGB-xxxJ No-Intro, titres JAP « Famicom Mini: … » verrouillés ; --planche puis --ecrire), jaquettes-libretro-noms.mjs (43 boîtes rétro libretro nommées à la main, 23/11/2026 : --planche puis --ecrire, --sauf n,n), dates-manquantes.mjs (39 dates de sortie sourcées et verrouillées, Bionic Commando: Elite Forces PAL décoché, 23/11/2026 ; essai sans --ecrire), jaquettes-restantes.mjs (23/11/2026 : 3 boîtes Wii JAP de GameTDB, Pokopia JAP officielle Nintendo Asie sans boîtier, Advance Wars 1+2: Re-Boot Camp JAP et Fitness Boxing 3 Switch 2 US décochés ; essai sans --ecrire) ; relais-annonces.mjs (depuis la session : jeux à venir de Nintendo Japon, Europe et US → bucket privé gametdb/annonces.json ; --essai n'écrit rien ; US-33) ; relais-gametdb.mjs (tâche GitHub « Relais GameTDB » : bases Wii U, Wii, GameCube, DS, 3DS, Switch (réduites) + scans → bucket privé gametdb, Wii dans wii/faces, GameCube dans gamecube/faces, Switch dans switch/scans/{JAP,US,PAL} ; secrets SUPABASE_URL / SUPABASE_SECRET_KEY ; importe src/lib/import/relais-wii.ts : sans alias « @/ »)
src/lib/jaquettes/       boite-nintendo.ts (photo du My Nintendo Store → jaquette : marge et boîtier retirés, image en largeur refusée, US-33), boitier.ts (boîtier gris ou rouge des photos Nintendo et gamecartdb : gabarits, détection par le bord droit, sans import : lu par les scripts, SPEC v1.44), supprimer.ts (jeu + toutes ses jaquettes), chemins et URL des jaquettes ({game_id}/{région}-{version}-{300|600|768}.webp, ADR-04, version : #60), enregistrer.ts (WebP → stockage → sortie), telecharger.ts (image par adresse, SSRF) + tests
src/lib/admin/           console choisie (consoles.ts, étape 8), page « Jaquettes » (vignettes, filtre « à remplacer »), correction d'une fiche (champs modifiés → verrous), nouveau jeu (verrou « manuel »), filtre « sans code produit » (codes.ts, US-18) + tests
src/lib/collection/      ma collection (US-16, ADR-07) : versions possédées (collection.ts, pur + tests), session et possessions chargées dans le navigateur, bascule d'une case (navigateur.ts) ; filtre ?collection= (collection.ts ; compteurs : page Statistiques, US-18), étiquettes JAP / US / PAL vertes (jeton `possede`) pour les versions possédées ; amiibo (US-30) : une case par amiibo (clé `amiibo:{id}` dans le même ensemble, table possessions_amiibo), marque verte « ✓ Je l'ai » sur la carte, même filtre
src/lib/series/          séries (étape 23, ADR-15) : liste de référence, règles sur le titre, noms Wikidata, parentes (series.ts, sans import : lu par le script) + tests
src/lib/badges/          badges (US-24, ADR-16 point 5) : calculés à chaque ouverture, jamais stockés ; total, par console, série complète, régions ; prochains badges (badges.ts) + tests ; affichage : components/Badges.tsx (icônes des avatars, couleur par catégorie)
src/lib/invitations/     jeton d'invitation (aléatoire, empreinte SHA-256 seule en base), lien, état (US-19, ADR-16), formulaire de la page Bienvenue (inscription.ts, US-20) + tests
src/lib/images/          réduction d'une photo dans le navigateur avant envoi (1600 px) + tests
src/lib/supabase/        env.ts (variables vérifiées + tests), admin.ts (clé secrète SUPABASE_SECRET_KEY, serveur seulement : comptes des collectionneurs, ADR-16), server.ts (session), client.ts, public.ts (pages publiques, sans cookies)
src/types/database.ts    types de la base, générés (npm run db:types) et vérifiés en CI
tests/e2e/               tests Playwright ; connexion.spec.ts ignoré sans base locale (tourne en CI)
supabase/                config.toml (inscriptions désactivées), migrations/ (0001 schéma, 0002 RLS, 0003 jaquettes, 0004 données de départ : 4 jeux Wii U, 0005 source gametdb, 0006 bucket du relais, 0007 console Wii, 0008 consoles DS et 3DS, 0009 console Switch, 0010 Switch 2 + table exclusions : jeux décochés « en boîte », 0011 console GameCube, 0012 possessions : collection privée, RLS par compte, 0013 note Metacritic du jeu, 0014 consoles N64 et GBA + source de jaquette libretro, 0015 console Game Boy Color, 0016 console Game Boy, 0017 console Virtual Boy, 0018 console Super Nintendo, 0019 source de jaquette gamecartdb, 0020 console NES, 0021 source de jaquette nintendo, 0022 corrections de données : développeurs collés des listes à cartouches, 3D Tetris JAP, 0023 séries du jeu : series text[], 0024 rôles : profils + est_proprietaire(), écriture du catalogue, des jaquettes et des exclusions réservée au propriétaire, ADR-16, 0025 invitations : empreinte du jeton, propriétaire seul, 0026 profil_public() : profil public sans e-mail, security definer, 0027 source de jaquette screenscraper, 0028 captures RAWG : table captures (6 au plus, media.rawg.io seulement) + games.rawg_slug, US-26, 0029 bucket gametdb : JSON accepté (relais RAWG), 0030 slug RAWG : tiret bas accepté, 0031 guides japonais : guides (ISBN 13 unique, id Google Books), guides_jeux (plusieurs à plusieurs), guides_exclus (propriétaire seul), ADR-19, 0032 précisions de date « saison » et « inconnue » (jeux à venir, ADR-20), 0033 amiibo : amiibo (identifiant unique, type), amiibo_sorties (pas de ligne = pas sorti), amiibo_jeux (jeu du catalogue ou hors catalogue), amiibo_exclus, possessions_amiibo (privées), bucket amiibo, ADR-21, 0034 identifiant amiibo « eu: » (vu seulement chez Nintendo Europe), 0035 couvertures des guides : guides.couverture (chemin), bucket public guides (ADR-19 révisé), 0036 profil_public() : amiibo possédés et derniers ajoutés (US-30)), tests/database/ (pgTAP)
.github/                 CI (workflows/ci.yml), modèles de PR et d'issue
docs/, intent/           SPEC, DESIGN, MAQUETTES, intention
.claude/skills/          skills du projet, chargées à la demande : script-prod (script sur la production), steward (PR et CI), react-best-practices (règles de performance de Vercel, MIT, pour les audits seulement) ; sélection pstack (MIT, PSTACK.md) utilisée par défaut : tdd, typescript-best-practices + 2 principes, blast-radius, how, why, correct, reflect
```

Tests unitaires à côté du code (`*.test.ts`). Couleurs Tailwind (jetons clair/sombre de globals.css, jamais de couleur en dur) : `fond`, `carte`, `texte`, `texte-doux`,
`texte-discret`, `bordure`, `accent`, `accent-fonce`, `inverse`, `accent-doux`, `surface`, `champ`, `erreur`… ; polices `font-sans` (Inter), `font-titre` (Space Grotesk).

## Avancement

- [x] Phase 1 — Intention : `intent/intent.md` validée
- [x] Phase 2 — Spec, design, maquettes validés
- [x] Phase 3 — Issues de l'étape 1 (#4 à #9), milestone « Étape 1 — Socle » (n° 1)
- [x] Phase 4+ — Développement par étapes (DESIGN.md §8) : v1 Wii U terminée
  - [x] Étape 1 — Socle : #4 à #9
  - [x] Étape 2 — Base : #16 à #19
  - [x] Étape 3 — Consultation : #24 à #27
  - [x] Étape 4 — Import : #32 à #35, #40
  - [x] Étape 5 — Correction : GameTDB (#46, relais #53), jaquette HD #48, sombre + logo #49, Jaquettes #42 #43, fiches #44 #45, et #56, #58, #60
  - [x] Étape 6 — Filtres : genres #68, panneau #69
  - [x] Étape 7 — Finitions : À propos (US-07) #72, référencement #73
  - [x] Étape 8 — Wii : étude (DESIGN §1 bis, #77), relais #78, import #79, admin #83, catalogue #80, découpe #87, Startup Disc #90, réessais #92
  - [x] Étape 9 — DS + 3DS : étude (DESIGN §1 ter), proportions des jaquettes #94, relais + import #95
  - [x] Étape 10 — Switch + Switch 2 : étude (DESIGN §1 quater, #99), import des nouveautés #100, Switch #102, Switch 2 #104, relais réessayé #106
  - [x] Étape 11 — GameCube : étude (DESIGN §1 quinquies, #111), relais + import #112 ; filtre Développeur #89
  - [x] Étape 12 — Ma collection : US-16 (versions possédées, privée) #117 #118, en-tête #119, étiquettes vertes #120
  - [x] Étape 13 — Note Metacritic : US-17 (fiche + étiquette ; Wikipédia + saisie à la main) #121 #123 #124
  - [x] Étape 14 — Nintendo 64 + Game Boy Advance : étude (DESIGN §1 septies, #126), listes #127, jaquettes libretro #128, liens symboliques #130
  - [x] Étape 15 — N64 + GBA complétées : codes produit et boîtes japonaises par la série No-Intro (DESIGN ADR-10) #132 #133
  - [x] Étape 16 — Statistiques : US-18, page de l'administration (DESIGN ADR-11) #134 #135 #136 ; tri par note #137
  - [x] Étape 17 — Game Boy Color : étude (DESIGN §1 octies, #138), Wikipédia + libretro + No-Intro, codes DMG- / CGB- (ADR-12) #141 ; éditeurs #140, liens Git #144 ; CI réparée #142
  - [x] Étape 18 — Game Boy : étude (DESIGN §1 nonies), même recette que la Game Boy Color #146 #147
  - [x] Étape 19 — Virtual Boy : étude (DESIGN §1 decies), Japon et États-Unis seulement #148 #149
  - [x] Étape 20 — Super Nintendo : étude (DESIGN §1 undecies), titres japonais pour les boîtes JAP #150 #151
  - [x] Étape 21 — NES : étude (DESIGN §1 duodecies), boîte « World » jamais pour le Japon #154 #155 ; jaquettes officielles #153 #158 #159 ; lecture au-delà de 1 000 jeux #157
  - [x] Étape 22 — Jeux absents : contrôle par les bases officielles (DESIGN §1 terdecies, ADR-13), DS (identifiants en Y, régions vides), Switch et 3DS (éditeur officiel) #165 #166 #167, éditeur officiel par région (ADR-14) #170, jaquettes manquantes et 5 jeux retirés (dont Drag x Drive, exclu à l'import) #172, boîtes PAL sans USK #175 ; relais et imports Switch + 3DS du 21/11 (+4 et +13 jeux) ; session Claude #177
  - [x] Étape 23 — Séries : étude Wikidata (DESIGN §1 quattuordecies), ADR-15 ; documents #180, données #181, filtre #182 ; remplissage du 21/11 : 754 jeux sur 1 126 avec une série
  - [x] Étape 24 — Frise : 3e vue du catalogue (SPEC v1.38, maquette validée) #184 #185
  - [x] Étape 27 — Collectionneurs invités : intention v1.5, SPEC v1.39 et v1.40, ADR-16 #189 ; rôles #190, invitations #191 #192, Mon profil #193 #194, badges #195, profil public #196, bilan
  - [x] Audit de performance (skill react-best-practices, 22/11) : skill #198, page plus légère #199, recherche fluide #200, lots de 60 #201, profil et statistiques #203 ; accueil 4,06 → 1,11 Mo de HTML, JS visiteur 264 → 195 Ko
  - [x] Étape 25 — Prix eBay : étude #207, SPEC US-25 + ADR-17 + maquette #208, calculs #210, route #211, fiche #212 ; prix demandé (annonces en cours), gardé 6 h ; ventes terminées à demander à eBay
  - [x] Étape 26 — ScreenScraper : jaquettes (étude #202, import #205, 2e passage #209, bilan #215 : 191 jaquettes ; 79 versions encore sans jaquette, introuvables), dates rétro (études #216 #217 sur 585 jeux, 58 années différentes vérifiées sur Wikipédia, 4 corrigées) ; éditeurs non repris
  - [x] Fausses jaquettes « Nintendo eShop » (23/11) : détection, garde-fou relais + import, 6 versions corrigées
  - [x] Étape 28 — Captures RAWG : SPEC US-26, ADR-18, maquette #218 ; étude #220 (DESIGN §1 sexdecies) ; migration #222 (+ #225, #227) ; relais #223, écriture #224 : 804 jeux avec captures le 23/11 (14 refusés sur la planche) ; carrousel #228
  - [x] Jaquettes sans boîtier (23/11) : 103 jaquettes Switch et Switch 2 recadrées, script gamecartdb aussi (SPEC v1.44)
  - [x] Dates et jaquettes manquantes (23/11) : 0 version sans date (40 → 0), 13 sans jaquette (80 → 13) ; Famicom Mini complétées (10 boîtes JAP qui étaient américaines remplacées)
  - [x] Étape 29 — Guides japonais (攻略本) : intention v1.6 (#236) puis v1.7 (3DS et Switch d'abord, guides seulement) ; études #238 #239 #241 #243 #244 (DESIGN §1 septdecies) ; SPEC US-27 + US-28 (v1.47) et maquettes (v0.12) #245 ; ADR-19 #246 ; migration 0031 #247 ; script #248 à #251 #273 ; page du guide #252 #254, fiche #256, catalogue #259 #261 #262 ; remplissage du 25/11 : 159 guides (3DS 92, Switch 68), 114 couvertures
  - [x] Étape 30 — Amiibo : étude #257, SPEC US-29 à US-31 #260, maquettes #264, ADR-21 ; migrations 0033 0034 0036 ; script et remplissage du 25/11 (954 amiibo) #271 #274 #279 ; fiche #284, catalogue #287, prix eBay #289, « Je l'ai » #291, profils #292 ; détail : `docs/avancement/etape-30.md`
  - [x] Étape 31 — À venir sur l'accueil : étude #258, SPEC US-32 + US-33 #263, ADR-20 #265 ; migration #268, étiquette #270, bande #272, relais #275, coches #278, import des annonces #280 #283, e2e #290 ; premier import du 26/11 : 7 jeux Switch 2 à venir ; guides et amiibo à venir : plus tard
  - [x] Couvertures Amazon Japon des guides (reprise de l'étape 29, 26/11) : SPEC v1.52, ADR-19 révisé #281, migration 0035 #282, script #285, affichage #286 ; 159 couvertures copiées (45 guides qui n'en avaient pas)
  - [ ] Étapes suivantes (DESIGN §11) : à définir avec le propriétaire
- [x] Bilan final de la v1 : `docs/BILAN.md` v1.1 ; étapes 8 à 10 : v1.2 ; étapes 11 à 14 : v1.3 ; étapes 15 à 17 : v1.4 ; étapes 18 à 22 : v1.5 ; étapes 23 à 27 : v1.6 ; audit de performance : v1.7 ; étape 25 : v1.8 ; étape 28 : v1.9 ; étape 29 : v1.10 ; couvertures Amazon : v1.11 ; étape 30 : v1.12 ; étape 31 : v1.13

## Erreurs récurrentes

- **Scripts de données et relais** sur la production (GameTDB bloque Vercel et GitHub : la session l'atteint) :
  skill `script-prod` (`.claude/skills/script-prod/SKILL.md`).
- **PR et CI** (lien Vercel, chaque tâche lue avant de dire « CI verte », pannes connues : installation des
  navigateurs, pgTAP après une migration, clone superficiel) : skill `steward` (`.claude/skills/steward/SKILL.md`).
- **Sélecteurs e2e ambigus** (3 fois : « Remplacer » trouvait « À remplacer » ; `getByRole("alert")` trouvait aussi
  l'annonceur de navigation de Next.js ; « Jeu ajouté » + « Fiche enregistrée », CI de #290) : `getByRole(…, { name,
  exact: true })` ; un rôle de message se filtre par son texte (`getByRole("status").filter({ hasText })`), **imposé
  par le lint** (`eslint.config.mjs`, `tests/e2e/`).
- **Tests e2e qui se gênent sur la base partagée** (2 fois : code produit de Splatoon modifié pendant qu'un test
  public le lisait ; « Jeu de test e2e » ajouté pendant que le catalogue comptait ses jeux) : les tests connectés
  qui écrivent tournent dans les projets `*-admin` de `playwright.config.ts`, après tous les tests publics ; un
  nouveau fichier de tests d'administration s'ajoute à `ADMINISTRATION`.
- **Prettier sur des fichiers non modifiés** (3 fois le 22/11 : `defilement.ts`, toute la SPEC, `collectionneurs.ts`
  reformatés, diff gonflé) : `npx prettier --write` seulement sur les fichiers `.ts`/`.tsx` touchés, jamais sur
  `docs/*.md` ni sur un dossier entier ; relire `git diff --stat` avant chaque commit.
- **Conflits sur l'Avancement** (4 fois le 25/11 : deux sessions sur les étapes 30 et 31, lignes voisines) : le
  détail d'une étape en cours s'écrit dans `docs/avancement/etape-NN.md`, jamais ici ; CLAUDE.md ne reçoit que la
  ligne de l'étape (créée une fois, cochée à la fin).
- **Abonnement à la mauvaise PR** (4 fois : #209, #219, #226, #288 au lieu de #289) : **imposé par un hook**
  (`.claude/hooks/abonnement-pr.mjs`, `.claude/settings.json`) : pendant 30 min après une création de PR, un abonnement
  à un autre numéro, ou envoyé avant la fin de la création, est refusé avec le bon numéro.
