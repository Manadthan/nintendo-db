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
| `intent/intent.md` | Problème, résultat attendu, contraintes, décisions | v1.4 validée |
| `docs/SPEC.md` | User stories + critères d'acceptation (= définition de « terminé ») | v1.36 à valider |
| `docs/DESIGN.md` | Stack, ADR, modèle de données, sources de données, tests, risques | v1.20 à valider |
| `docs/MAQUETTES.md` | Lien vers les maquettes (2 écrans de la v1, Statistiques : `docs/maquettes/`) | v0.7 validée |
| `docs/BILAN.md` | Rétrospective : v1 (étapes 1 à 7), étapes 8 à 10 (§8), étapes 11 à 14 (§9), 15 à 17 (§10), 18 à 22 (§11) : chiffres, réussites, difficultés, leçons | v1.5 à valider |

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
- Même erreur commise deux fois → ajouter la règle ici.

## Stack et commandes

Next.js 16 (App Router, TypeScript strict) · Tailwind 4 · Vitest · Playwright · GitHub Actions ;
Vercel (région Paris `cdg1`, `vercel.json`) ; Supabase (`supabase/`, migrations appliquées en production au merge).

```
npm run dev        # serveur local
npm run check      # lint + typecheck + tests unitaires : à lancer avant chaque commit, sortie montrée
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
src/app/admin/           administration (US-09) : connexion/, accueil, import/ (US-10, ?console=wii), jaquettes/ (liste ?console=, remplacement /admin/jaquettes/{console}/{jeu}/{région}, US-12), jeux/ (liste ?console= ?filtre=sans-code, correction /admin/jeux/{console}/{jeu}, US-11), notes/ (notes Metacritic depuis Wikipédia, ?console=, US-17), statistiques/ (US-18) ; actions/auth.ts, import.ts, jaquettes.ts, jeux.ts, metacritic.ts
src/lib/auth/proprietaire.ts  exigerProprietaire() : en tête de CHAQUE action d'administration
src/proxy.ts             contrôle de connexion, sur /admin SEULEMENT (les pages publiques restent statiques)
src/lib/auth/routes.ts   règles de redirection de l'administration + tests ; session-navigateur.ts : connecté ou non, lu dans le navigateur (pages statiques)
src/lib/catalogue/       toutes les consoles (charger.ts : jeux + consoles, étape 8), version affichée, dates en français, tri, groupes (catalogue.ts), marché : adresse ?marche= puis navigateur (marche.ts), recherche ?q= (recherche.ts), filtres ?console= ?dispo= ?annee= ?genre= ?dev= (filtres.ts, US-06), studios nettoyés et « Nintendo (first party) » (developpeurs.ts, #89), couleur de la note Metacritic (metacritic.ts, US-17), lecture (charger.ts) + tests
src/lib/statistiques/   statistiques du propriétaire (US-18, ADR-11) : calculs purs (statistiques.ts : collection par console, régions, Metacritic, état du catalogue) + tests, lecture paginée (charger.ts) ; page src/app/admin/statistiques/
src/app/jeux/[console]/[jeu]/  fiche d'un jeu (US-04), préparée à l'avance ; src/app/not-found.tsx : 404 en français
src/lib/fiche/           conversion et région par défaut de la fiche (fiche.ts), lecture (charger.ts) + tests
src/components/          EnTete (collé en haut au défilement ; Logo ; icônes Catalogue, À propos, BoutonTheme, BoutonCompte : seul accès à la connexion ou à l'administration, SPEC v1.15 ; BoutonHaut « Remonter en haut », SPEC v1.34), Catalogue (client : recherche, marché, tri, filtres, grille/liste), Filtres (panneau et pastilles, US-06), FicheJeu (client : JAP/US/PAL), AnalyseImport (client : aperçu puis enregistrement par lots), Jaquette (ou vignette neutre), Disponibilite, NoteMetacritic (pastille aux couleurs Metacritic sur la jaquette du catalogue, US-17)
src/lib/referencement/   adresse du site, sitemap, robots, métadonnées et données structurées des fiches (étape 7) + tests ; src/app/sitemap.ts, robots.ts
src/lib/theme/           choix du thème : auto/clair/sombre, script anti-éclair (US-08) + tests
src/lib/recherche/       normaliser() pour la recherche (ADR-05) + tests
src/lib/import/          import (ADR-03) : consoles.ts (sources par console : Wii U = Wikipédia + GameTDB, Wii, DS, 3DS = GameTDB seul ; chemins du relais, codes WUP-P-/RVL-/NTR-/CTR-P-/KTR-P-/HAC-P-/DOL-), wikipedia.ts (tableau « List of Wii U games »), wikipedia-switch-2.ts (liste Switch 2 : Wikipédia seul, date au jour près, étape 10), wikipedia-cartouches.ts (listes NES, Game Boy, Super Nintendo, Virtual Boy, N64, GBA et Game Boy Color : en-tête sur 1 ou 2 lignes, cellules fusionnées, dates par région, préfixe DMG- / CGB- par jeu, « —N/a », éditeurs « (JP) » entre parenthèses, « Cancelled », titres japonais de la cellule pour la boîte JAP, étapes 14, 17 à 21), libretro.ts (boîtes libretro-thumbnails : index, rapprochement titre + région, adresse ; lu aussi par le relais), nointro.ts (séries No-Intro de libretro-database : codes produit NUS-/AGB-, boîte japonaise par la série, étape 15), apercu.ts (aperçu, lots de 10, résumés, nouveautés : nouveau / modifié / inchangé, jeux à venir), donnees.ts (assemblage, fusion avec verrous, choix des jaquettes), jaquettes.ts (WebP 300/600/768 via sharp), gametdb.ts (boîtes par région, titres japonais, compilations, codes produit ; lu depuis le relais), resultat.ts (erreurs des actions rendues lisibles), physique.ts (règle : boîte Nintendo exigée, sorties par région), relais-wii.ts (base Wii réduite, face avant découpée, disques GameCube du commerce et petite image en JPEG : lu aussi par le relais), relais-portables.ts (DS/3DS : cartes du commerce, langue du scan, carte PAL anglaise, base réduite), relais-switch.ts (Switch : régions « ALL », cartouches du commerce, scans par région, base réduite), reessais.ts (réessais des envois du relais, #92), metacritic.ts (note Metacritic lue dans l'encadré Wikipédia : note de la console du jeu ou ambiguë, US-17), editeurs-officiels.ts (éditeurs de Nintendo Europe et Japon pour un éditeur vide chez GameTDB, Switch et 3DS, ADR-13 ; lu par le relais) + tests ; __fixtures__/ (copies datées, README)
scripts/                 icones.mjs (apple-icon.png), fixture-wikipedia.mjs, fixture-gametdb.mjs, fixture-gametdb-wii.mjs, fixture-gametdb-portable.mjs, fixture-gametdb-switch.mjs, fixture-gametdb-gamecube.mjs, fixture-metacritic.mjs, fixture-wikipedia-cartouches.mjs, fixture-libretro.mjs, fixture-nointro.mjs, jaquettes-gamecartdb.mjs (jaquettes Switch 2 US et PAL copiées de gamecartdb, lancé depuis la session comme le relais), jaquettes-pal-francaises.mjs (boîtes PAL Wii U et Switch remplacées une fois par la française de GameTDB, SPEC v1.28), jaquettes-nintendo-eu.mjs (boîtes PAL officielles PEGI de nintendo.com/eu, source « nintendo », SPEC v1.29), jaquettes-manquantes.mjs (versions sans jaquette du contrôle du 20/11/2026 : officielles Nintendo EU / JP / US, sinon GameTDB ; planche docs/planches/), retirer-jeux.mjs (4 jeux retirés + exclusions, 20/11/2026), jaquettes-sans-usk.mjs (3 boîtes PAL USK remplacées par une boîte PEGI seul, 20/11/2026 ; 28 autres sans remplaçante) ; relais-gametdb.mjs (tâche GitHub « Relais GameTDB » : bases Wii U, Wii, GameCube, DS, 3DS, Switch (réduites) + scans → bucket privé gametdb, Wii dans wii/faces, GameCube dans gamecube/faces, Switch dans switch/scans/{JAP,US,PAL} ; secrets SUPABASE_URL / SUPABASE_SECRET_KEY ; importe src/lib/import/relais-wii.ts : sans alias « @/ »)
src/lib/jaquettes/       supprimer.ts (jeu + toutes ses jaquettes), chemins et URL des jaquettes ({game_id}/{région}-{version}-{300|600|768}.webp, ADR-04, version : #60), enregistrer.ts (WebP → stockage → sortie), telecharger.ts (image par adresse, SSRF) + tests
src/lib/admin/           console choisie (consoles.ts, étape 8), page « Jaquettes » (vignettes, filtre « à remplacer »), correction d'une fiche (champs modifiés → verrous), nouveau jeu (verrou « manuel »), filtre « sans code produit » (codes.ts, US-18) + tests
src/lib/collection/      ma collection (US-16, ADR-07) : versions possédées (collection.ts, pur + tests), session et possessions chargées dans le navigateur, bascule d'une case (navigateur.ts) ; filtre ?collection= (collection.ts ; compteurs : page Statistiques, US-18), étiquettes JAP / US / PAL vertes (jeton `possede`) pour les versions possédées
src/lib/images/          réduction d'une photo dans le navigateur avant envoi (1600 px) + tests
src/lib/supabase/        env.ts (variables vérifiées + tests), server.ts (session), client.ts, public.ts (pages publiques, sans cookies)
src/types/database.ts    types de la base, générés (npm run db:types) et vérifiés en CI
tests/e2e/               tests Playwright ; connexion.spec.ts ignoré sans base locale (tourne en CI)
supabase/                config.toml (inscriptions désactivées), migrations/ (0001 schéma, 0002 RLS, 0003 jaquettes, 0004 données de départ : 4 jeux Wii U, 0005 source gametdb, 0006 bucket du relais, 0007 console Wii, 0008 consoles DS et 3DS, 0009 console Switch, 0010 Switch 2 + table exclusions : jeux décochés « en boîte », 0011 console GameCube, 0012 possessions : collection privée, RLS par compte, 0013 note Metacritic du jeu, 0014 consoles N64 et GBA + source de jaquette libretro, 0015 console Game Boy Color, 0016 console Game Boy, 0017 console Virtual Boy, 0018 console Super Nintendo, 0019 source de jaquette gamecartdb, 0020 console NES, 0021 source de jaquette nintendo, 0022 corrections de données : développeurs collés des listes à cartouches, 3D Tetris JAP), tests/database/ (pgTAP)
.github/                 CI (workflows/ci.yml), modèles de PR et d'issue
docs/, intent/           SPEC, DESIGN, MAQUETTES, intention
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
  - [ ] Étape 22 — Jeux absents : contrôle par les bases officielles (DESIGN §1 terdecies, ADR-13), DS (identifiants en Y, régions vides), Switch et 3DS (éditeur officiel) #165 #166 #167, éditeur officiel par région (ADR-14) #170, jaquettes manquantes et 5 jeux retirés (dont Drag x Drive, exclu à l'import) #172, boîtes PAL sans USK #175 ; reste : vérifier l'import Switch et 3DS après #170
- [x] Bilan final de la v1 : `docs/BILAN.md` v1.1 ; étapes 8 à 10 : v1.2 ; étapes 11 à 14 : v1.3 ; étapes 15 à 17 : v1.4 ; étapes 18 à 22 : v1.5

## Erreurs récurrentes

- **GameTDB bloque des hébergeurs** (Vercel dès #53, GitHub le 18/11/2026 : « Connect Timeout ») : le relais tourne
  depuis la session Claude, qui atteint GameTDB : `npm run relais` ; tout script de données : `npm run session --
  scripts/xxx.mjs`. Environnement cloud « nintendo-db » : clé Supabase en secret réseau (injectée dans `apikey`,
  jamais vue), `SUPABASE_URL` et la fausse clé `SUPABASE_SECRET_KEY` en variables, `npm ci` au démarrage ; la
  commande ajoute `NODE_USE_ENV_PROXY=1` (sans lui, Supabase est injoignable). Retirer `Authorization` n'est plus
  utile (essai du 21/11/2026 : lecture, stockage privé et RLS identiques avec ou sans).

- **CI e2e arrêtée pendant l'installation des navigateurs** (#109, #120, puis toutes les PR du 19/11 : miroir Ubuntu
  lent) : ce n'est pas le code. `ci.yml` : cache des navigateurs **et des paquets Ubuntu**, 10 min par essai, second
  essai qui arrête d'abord l'apt-get du premier (verrou), limite 35 min.
- **CI rouge non vue** (19/11 : test pgTAP d'une liste de sources figée, cassé par la migration 0014, rouge sur
  `main` de #127 à #134) : avant de dire « CI verte », lire le résultat de **chaque** tâche de la PR ; une migration
  qui ajoute une valeur d'énumération met à jour les tests qui listent ses valeurs.
- **Clone superficiel** (`git clone --depth 1`) : il ne suit que `main`, et l'alerte « branche non poussée » revient
  après chaque `git push -u`. Une fois par clone : `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`.
- **Sélecteurs e2e ambigus** (2 fois : « Remplacer » trouvait « À remplacer » ; `getByRole("alert")` trouvait aussi
  l'annonceur de navigation de Next.js) : `getByRole(…, { name, exact: true })`, et toujours filtrer un rôle
  générique par son texte (`getByRole("alert").filter({ hasText })`).
- **Tests e2e qui se gênent sur la base partagée** (2 fois : code produit de Splatoon modifié pendant qu'un test
  public le lisait ; « Jeu de test e2e » ajouté pendant que le catalogue comptait ses jeux) : les tests connectés
  qui écrivent tournent dans les projets `*-admin` de `playwright.config.ts`, après tous les tests publics ; un
  nouveau fichier de tests d'administration s'ajoute à `ADMINISTRATION`.
