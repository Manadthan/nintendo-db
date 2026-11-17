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
| `intent/intent.md` | Problème, résultat attendu, contraintes, décisions | v1.1 validée |
| `docs/SPEC.md` | User stories + critères d'acceptation (= définition de « terminé ») | v1.6 validée |
| `docs/DESIGN.md` | Stack, ADR, modèle de données, sources de données, tests, risques | v0.8 validée |
| `docs/MAQUETTES.md` | Lien vers les maquettes (2 écrans de la v1) | v0.6 validée |

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
src/app/admin/           administration (US-09) : connexion/, accueil, import/ (aperçu US-10) ; actions/auth.ts, actions/import.ts
src/lib/auth/proprietaire.ts  exigerProprietaire() : en tête de CHAQUE action d'administration
src/proxy.ts             contrôle de connexion, sur /admin SEULEMENT (les pages publiques restent statiques)
src/lib/auth/routes.ts   règles de redirection de l'administration + tests
src/lib/catalogue/       version affichée, dates en français, tri, groupes (catalogue.ts), marché : adresse ?marche= puis navigateur (marche.ts), recherche ?q= (recherche.ts), lecture (charger.ts) + tests
src/app/jeux/[console]/[jeu]/  fiche d'un jeu (US-04), préparée à l'avance ; src/app/not-found.tsx : 404 en français
src/lib/fiche/           conversion et région par défaut de la fiche (fiche.ts), lecture (charger.ts) + tests
src/components/          EnTete (Logo, BoutonTheme), PiedDePage (lien Administration), Catalogue (client : recherche, marché, tri, grille/liste), FicheJeu (client : JAP/US/PAL), AnalyseImport (client : aperçu puis enregistrement par lots), Jaquette (ou vignette neutre), Disponibilite
src/lib/theme/           choix du thème : auto/clair/sombre, script anti-éclair (US-08) + tests
src/lib/recherche/       normaliser() pour la recherche (ADR-05) + tests
src/lib/import/          import (ADR-03) : wikipedia.ts (tableau « List of Wii U games »), apercu.ts (aperçu, lots de 10, résumés), donnees.ts (assemblage, fusion avec verrous, choix des jaquettes), jaquettes.ts (WebP 300/600/768 via sharp), gametdb.ts (boîtes par région, titres japonais, compilations, codes produit ; lu depuis le relais), resultat.ts (erreurs des actions rendues lisibles), physique.ts (règle : boîte Nintendo exigée, sorties par région) + tests ; __fixtures__/ (copies datées, README)
scripts/                 icones.mjs (apple-icon.png), fixture-wikipedia.mjs, fixture-gametdb.mjs ; relais-gametdb.mjs (tâche GitHub « Relais GameTDB » : base + scans → bucket privé gametdb, secrets SUPABASE_URL / SUPABASE_SECRET_KEY)
src/lib/jaquettes/       chemins et URL des jaquettes ({game_id}/{région}-{version}-{300|600|768}.webp, ADR-04, version : #60) + tests
src/lib/supabase/        env.ts (variables vérifiées + tests), server.ts (session), client.ts, public.ts (pages publiques, sans cookies)
src/types/database.ts    types de la base, générés (npm run db:types) et vérifiés en CI
tests/e2e/               tests Playwright ; connexion.spec.ts ignoré sans base locale (tourne en CI)
supabase/                config.toml (inscriptions désactivées), migrations/ (0001 schéma, 0002 RLS, 0003 jaquettes, 0004 données de départ : 4 jeux Wii U, 0005 source gametdb, 0006 bucket du relais), tests/database/ (pgTAP)
.github/                 CI (workflows/ci.yml), modèles de PR et d'issue
docs/, intent/           SPEC, DESIGN, MAQUETTES, intention
```

Tests unitaires à côté du code (`*.test.ts`). Couleurs Tailwind (jetons clair/sombre de globals.css, jamais de couleur en dur) : `fond`, `carte`, `texte`, `texte-doux`,
`texte-discret`, `bordure`, `accent`, `accent-fonce`, `inverse`, `accent-doux`, `surface`, `champ`, `erreur`… ; polices `font-sans` (Inter), `font-titre` (Space Grotesk).

## Avancement

- [x] Phase 1 — Intention : `intent/intent.md` validée
- [x] Phase 2 — Spec, design, maquettes validés
- [x] Phase 3 — Issues de l'étape 1 (#4 à #9), milestone « Étape 1 — Socle » (n° 1)
- [ ] Phase 4+ — Développement par étapes (DESIGN.md §8)
  - [x] Étape 1 — Socle : #4 à #9
  - [x] Étape 2 — Base : #16 à #19
  - [x] Étape 3 — Consultation : #24 à #27
  - [x] Étape 4 — Import : #32 à #35, #40
  - [ ] Étape 5 — Correction (milestone n° 5) : #46 GameTDB (lecture ✅, import ✅), #48 jaquette HD ✅, #53 relais GameTDB ✅, #56 lien Administration ✅, #58 retrait d'IGDB ✅, #60 cache des jaquettes ✅, #49 sombre + logo (cette PR), #42 à #45
- [ ] Phase finale — Bilan

## Erreurs récurrentes

- **Clone superficiel** (`git clone --depth 1`) : il ne suit que `main`, et l'alerte « branche non poussée » revient
  après chaque `git push -u`. Une fois par clone : `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`.
