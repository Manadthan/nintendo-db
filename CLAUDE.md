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
| `intent/intent.md` | Problème, résultat attendu, contraintes, décisions | v1.3 validée |
| `docs/SPEC.md` | User stories + critères d'acceptation (= définition de « terminé ») | v1.11 validée |
| `docs/DESIGN.md` | Stack, ADR, modèle de données, sources de données, tests, risques | v1.4 validée |
| `docs/MAQUETTES.md` | Lien vers les maquettes (2 écrans de la v1) | v0.6 validée |
| `docs/BILAN.md` | Rétrospective : v1 (étapes 1 à 7), puis étapes 8 à 10 (§8) : chiffres, réussites, difficultés, leçons | v1.2 à valider |

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
```

- Le schéma évolue **uniquement** par `supabase/migrations/`. Une migration appliquée en production ne se modifie
  jamais : on en ajoute une nouvelle. Les prévisualisations Vercel partagent la base de production : le signaler
  dans toute PR qui touche la base.

## Arborescence

```
src/app/                 pages (App Router) — layout.tsx, page.tsx, globals.css (couleurs des maquettes)
src/app/admin/           administration (US-09) : connexion/, accueil, import/ (US-10, ?console=wii), jaquettes/ (liste ?console=, remplacement /admin/jaquettes/{console}/{jeu}/{région}, US-12), jeux/ (liste ?console=, correction /admin/jeux/{console}/{jeu}, US-11) ; actions/auth.ts, import.ts, jaquettes.ts, jeux.ts
src/lib/auth/proprietaire.ts  exigerProprietaire() : en tête de CHAQUE action d'administration
src/proxy.ts             contrôle de connexion, sur /admin SEULEMENT (les pages publiques restent statiques)
src/lib/auth/routes.ts   règles de redirection de l'administration + tests
src/lib/catalogue/       toutes les consoles (charger.ts : jeux + consoles, étape 8), version affichée, dates en français, tri, groupes (catalogue.ts), marché : adresse ?marche= puis navigateur (marche.ts), recherche ?q= (recherche.ts), filtres ?console= ?dispo= ?annee= ?genre= (filtres.ts, US-06), lecture (charger.ts) + tests
src/app/jeux/[console]/[jeu]/  fiche d'un jeu (US-04), préparée à l'avance ; src/app/not-found.tsx : 404 en français
src/lib/fiche/           conversion et région par défaut de la fiche (fiche.ts), lecture (charger.ts) + tests
src/components/          EnTete (Logo, BoutonTheme), PiedDePage (lien Administration), Catalogue (client : recherche, marché, tri, filtres, grille/liste), Filtres (panneau et pastilles, US-06), FicheJeu (client : JAP/US/PAL), AnalyseImport (client : aperçu puis enregistrement par lots), Jaquette (ou vignette neutre), Disponibilite
src/lib/referencement/   adresse du site, sitemap, robots, métadonnées et données structurées des fiches (étape 7) + tests ; src/app/sitemap.ts, robots.ts
src/lib/theme/           choix du thème : auto/clair/sombre, script anti-éclair (US-08) + tests
src/lib/recherche/       normaliser() pour la recherche (ADR-05) + tests
src/lib/import/          import (ADR-03) : consoles.ts (sources par console : Wii U = Wikipédia + GameTDB, Wii, DS, 3DS = GameTDB seul ; chemins du relais, codes WUP-P-/RVL-/NTR-/CTR-P-/KTR-P-/HAC-P-), wikipedia.ts (tableau « List of Wii U games »), wikipedia-switch-2.ts (liste Switch 2 : Wikipédia seul, date au jour près, étape 10), apercu.ts (aperçu, lots de 10, résumés, nouveautés : nouveau / modifié / inchangé, jeux à venir), donnees.ts (assemblage, fusion avec verrous, choix des jaquettes), jaquettes.ts (WebP 300/600/768 via sharp), gametdb.ts (boîtes par région, titres japonais, compilations, codes produit ; lu depuis le relais), resultat.ts (erreurs des actions rendues lisibles), physique.ts (règle : boîte Nintendo exigée, sorties par région), relais-wii.ts (base Wii réduite, face avant découpée : lu aussi par le relais), relais-portables.ts (DS/3DS : cartes du commerce, langue du scan, carte PAL anglaise, base réduite), relais-switch.ts (Switch : régions « ALL », cartouches du commerce, scans par région, base réduite), reessais.ts (réessais des envois du relais, #92) + tests ; __fixtures__/ (copies datées, README)
scripts/                 icones.mjs (apple-icon.png), fixture-wikipedia.mjs, fixture-gametdb.mjs, fixture-gametdb-wii.mjs, fixture-gametdb-portable.mjs, fixture-gametdb-switch.mjs ; relais-gametdb.mjs (tâche GitHub « Relais GameTDB » : bases Wii U, Wii, DS, 3DS, Switch (réduites) + scans → bucket privé gametdb, Wii dans wii/faces, Switch dans switch/scans/{JAP,US,PAL} ; secrets SUPABASE_URL / SUPABASE_SECRET_KEY ; importe src/lib/import/relais-wii.ts : sans alias « @/ »)
src/lib/jaquettes/       supprimer.ts (jeu + toutes ses jaquettes), chemins et URL des jaquettes ({game_id}/{région}-{version}-{300|600|768}.webp, ADR-04, version : #60), enregistrer.ts (WebP → stockage → sortie), telecharger.ts (image par adresse, SSRF) + tests
src/lib/admin/           console choisie (consoles.ts, étape 8), page « Jaquettes » (vignettes, filtre « à remplacer »), correction d'une fiche (champs modifiés → verrous), nouveau jeu (verrou « manuel ») + tests
src/lib/images/          réduction d'une photo dans le navigateur avant envoi (1600 px) + tests
src/lib/supabase/        env.ts (variables vérifiées + tests), server.ts (session), client.ts, public.ts (pages publiques, sans cookies)
src/types/database.ts    types de la base, générés (npm run db:types) et vérifiés en CI
tests/e2e/               tests Playwright ; connexion.spec.ts ignoré sans base locale (tourne en CI)
supabase/                config.toml (inscriptions désactivées), migrations/ (0001 schéma, 0002 RLS, 0003 jaquettes, 0004 données de départ : 4 jeux Wii U, 0005 source gametdb, 0006 bucket du relais, 0007 console Wii, 0008 consoles DS et 3DS, 0009 console Switch, 0010 Switch 2 + table exclusions : jeux décochés « en boîte »), tests/database/ (pgTAP)
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
- [x] Bilan final de la v1 : `docs/BILAN.md` v1.1

## Erreurs récurrentes

- **GameTDB bloque des hébergeurs** (Vercel dès #53, GitHub le 18/11/2026 : « Connect Timeout ») : le relais peut
  tourner depuis la session Claude, qui atteint GameTDB. Clé Supabase en secret réseau de l'environnement (injectée
  dans l'en-tête `apikey`, jamais vue), `SUPABASE_SECRET_KEY=sb_secret_proxy-injected`, `NODE_USE_ENV_PROXY=1`,
  `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`, et un préchargement qui retire l'en-tête `Authorization` des
  requêtes vers Supabase.

- **Clone superficiel** (`git clone --depth 1`) : il ne suit que `main`, et l'alerte « branche non poussée » revient
  après chaque `git push -u`. Une fois par clone : `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`.
- **Sélecteurs e2e ambigus** (2 fois : « Remplacer » trouvait « À remplacer » ; `getByRole("alert")` trouvait aussi
  l'annonceur de navigation de Next.js) : `getByRole(…, { name, exact: true })`, et toujours filtrer un rôle
  générique par son texte (`getByRole("alert").filter({ hasText })`).
- **Tests e2e qui se gênent sur la base partagée** (2 fois : code produit de Splatoon modifié pendant qu'un test
  public le lisait ; « Jeu de test e2e » ajouté pendant que le catalogue comptait ses jeux) : les tests connectés
  qui écrivent tournent dans les projets `*-admin` de `playwright.config.ts`, après tous les tests publics ; un
  nouveau fichier de tests d'administration s'ajoute à `ADMINISTRATION`.
