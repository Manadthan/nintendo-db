# Conception — Nintendo DB

> Étape 2 du playbook : **comment** construire ce que décrit `docs/SPEC.md` v1.2.
>
> Version 0.6 — 17/11/2026 — statut : **validée**
>
> | Version | Date | Changements |
> |---|---|---|
> | 0.6 | 17/11/2026 | **GameTDB** : scans de boîtes par région (prioritaires sur IGDB) et codes produit (étude du 17/11) ; R6 et R8 traités |
> | 0.5 | 16/11/2026 | R6 : jaquettes IGDB qui ne sont pas des scans de boîte (#40) |
> | 0.4 | 16/11/2026 | §5 aligné sur la migration 0001 (#17) : plus de `titre_normalise` (recherche dans le navigateur, ADR-05) ; valeurs fixes en types énumérés Postgres |
> | 0.3 | 16/11/2026 | ADR-02 : plus de région globale (marché dans le catalogue, région sur la fiche) ; ADR-05 : recherche dans le navigateur en v1 ; routes |
> | 0.2 | 16/11/2026 | v1 Wii U ; sources Wikipédia + IGDB (Wikidata, MobyGames écartés) ; jaquettes copiées chez nous |
> | 0.1 | 16/11/2026 | Premier brouillon (Wikidata + Wikipédia, liens d'images externes) |

## 1. Étude des sources (16/11/2026)

| Source | Ce qu'elle apporte | Conditions | Verdict |
|---|---|---|---|
| **Wikipédia** « List of Wii U games » | 792 jeux, dont **67 édités par Nintendo**, **50 en boîte** (marqués †) ; dates **Japon / Amérique du Nord / Australasie / Europe** ; titres NA et PAL quand ils diffèrent | CC BY-SA 4.0 : attribution | **Retenue** : liste de référence et dates |
| **IGDB** (Twitch) | **Jaquettes par région** (`game_localizations`), haute définition ; titres régionaux ; dates par région | Gratuit, y compris commercial ; **stockage encouragé** ; mention visible d'IGDB ; compte développeur Twitch | **Retenue** : jaquettes et titres japonais |
| Wikidata | Liste et titre japonais corrects ; dates PAL 15–23 % ; aucun code produit ; pas de jaquettes ; pas de distinction boîte / dématérialisé | CC0 | Écartée (redondante avec les deux autres) |
| MobyGames | Données riches | Page « Just a moment… » anti-robots : conditions illisibles par un programme ; API devenue payante (à confirmer) | Écartée |
| **GameTDB** (étude du 17/11/2026) | **Scans de vraies boîtes** par région (bandeau Wii U, PEGI/ESRB/CERO), 768 × 1080 = proportions d'une boîte ; base XML téléchargeable (identifiants de disque → **codes produit**, dates, éditeur) | Pas de licence formelle ; base « pour que chacun l'utilise dans tout projet lié aux jeux » ; images propriété des éditeurs (comme IGDB) | **Retenue** : jaquettes (127 sorties sur 143, 89 %) et codes produit |
| Redump / No-Intro | Codes produit des disques | Redump injoignable depuis l'environnement | À revoir pour les codes produit (piste) |

Référence visuelle : **gamecartdb.com copie ses jaquettes chez lui** (WebP haute définition ≈ 300 Ko, servies par
Vercel avec un cache d'un an). C'est le modèle retenu (ADR-04).

## 2. Stack

Identique à `mon-site-sdlc` (décision 7 de l'intention) :

| Besoin | Choix |
|---|---|
| Pages et serveur | **Next.js** (App Router, TypeScript strict), server actions |
| Styles | **Tailwind CSS**, mobile d'abord, thèmes clair/sombre |
| Base, connexion, images | **Supabase** : Postgres (RLS), Auth (inscriptions désactivées), Storage (bucket public) |
| Import | **cheerio** (tableau Wikipédia), API **IGDB** (côté serveur), **sharp** (WebP) |
| Tests | **Vitest**, **Playwright** (375 × 812, WebKit + Chromium), **pgTAP** |
| Hébergement, CI | **Vercel** (région Paris `cdg1`), **GitHub Actions** |

## 3. Architecture

```
Visiteur (iPhone) ──HTTPS──▶ Vercel / Next.js ── pages publiques préparées à l'avance (ISR)
                                   │                └─ jaquettes WebP ◀── Supabase Storage (public)
Propriétaire (connecté) ──────────▶├──▶ Supabase (Postgres + Auth + Storage)
                                   │
                                   └──▶ en.wikipedia.org, api.igdb.com, images.igdb.com, www.gametdb.com, art.gametdb.com  (import, côté serveur)
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

**ADR-03 — Import Wikipédia + IGDB, aperçu puis enregistrement.**
1. **Wikipédia** (référence) : tableau de la liste des jeux de la console, lu avec cheerio. Retenus : éditeur
   contenant « Nintendo » dans au moins une région **et** marqué † (en boîte). Récupérés : titres (NA, PAL),
   développeur, éditeur, dates **JAP** (colonne Japan), **US** (North America), **PAL** (Europe ; Australasie
   ignorée), « Unreleased » = non sorti.
2. **IGDB** : pour chaque jeu, recherche par titre sur la plateforme Wii U → identifiant IGDB ; puis
   `game_localizations` (titre et jaquette par région) et la jaquette principale en secours. Le titre japonais
   vient de la localisation Japon ; sa forme romanisée est le titre IGDB principal ou saisie à la main.
2 bis. **GameTDB** : la base `wiiutdb.zip` donne les identifiants de disque (ex. `ALZP01`). Rapprochement par
   titre US ou PAL ; les 3 premiers caractères sont communs aux 3 régions (`ALZE01`, `ALZJ01`, `ALZP01`), ce qui
   donne la sortie JAP même quand son titre diffère. Code produit = `WUP-P-` + 4 premiers caractères
   (`WUP-P-ALZP`). Base lue à chaque import (pas de copie dans le dépôt, sauf la fixture des tests).
   GameTDB **tranche le physique** (Wikipédia mélange boîte et téléchargement) : type `WiiU` = disque en boîte,
   `eShop` = téléchargement, titre « (Download Code) » = boîte à code, écartée. Jeu retenu si au moins une boîte
   a l'éditeur Nintendo (code `01`) ; sortie d'une région = une boîte existe dans cette région (champ `region`,
   pas la 4ᵉ lettre : un disque PAL peut finir en D, F…). Compilations en boîte absentes de la liste Wikipédia
   (NES Remix Pack / Famicom Remix 1 + 2, New Super Mario Bros. U + New Super Luigi U) : fiches propres.
3. **Aperçu** (n'écrit rien) : jeux, rapprochement IGDB proposé (corrigeable à la main si le titre est ambigu),
   ajoutés / modifiés / ignorés avec la raison. Puis enregistrement **par lots de 10** piloté par le
   navigateur, jaquettes comprises (même principe que l'ADR-03 de `mon-site-sdlc`, évite les délais Vercel).
4. **Verrous** : tout champ modifié à la main est verrouillé ; l'import ne le remplace jamais et signale l'écart.
5. **Identifiants IGDB** (Client ID et secret Twitch) : variables d'environnement côté serveur sur Vercel, jamais
   dans le dépôt ni dans le navigateur ; jeton d'accès demandé à la volée et gardé en mémoire.

**ADR-04 — Jaquettes copiées chez nous, en WebP haute définition.** Source par ordre de priorité : **scan GameTDB**
de la région (`coverHQ`, 768 × 1080 ; PAL : langue EN, sinon FR, DE), puis IGDB en `t_cover_big_2x`
(528 × 748) ou plus grand, puis jaquette principale IGDB en secours. Une jaquette `photo` ou `url` n'est jamais
remplacée par l'import. Image convertie avec sharp en **deux tailles WebP** : 300 px et 600 px de large
(la grande pour l'écran Retina), servies avec `srcset`. Chemin : `{game_id}/{region}-{taille}.webp` dans un
bucket public ; écriture réservée au propriétaire. Toute image est **ré-encodée** (jamais servie telle quelle).
Mention « Jaquette : GameTDB » (ou IGDB, « Photo ») sous la jaquette. *Pourquoi* : rendu net et rapide comme gamecartdb,
pas d'image cassée si la source change, et IGDB préfère qu'on stocke ses images. Remplace l'ADR-04 de la v0.1.

**ADR-05 — Recherche dans le navigateur en v1.** Le catalogue Wii U (≈ 50 jeux) est déjà chargé : la recherche
filtre la liste au fil de la frappe, sur un titre normalisé (minuscules, sans accents ni ponctuation) calculé
pour les 3 régions + éditeur + développeur. *Pourquoi* : instantané, aucun aller-retour serveur, simple à tester.
Quand plusieurs consoles seront en ligne : recherche globale dans Postgres (`unaccent` + `pg_trgm`).

**ADR-06 — Adresses stables.** `/consoles/{console}` et `/jeux/{console}/{jeu}` avec un *slug* tiré du titre
PAL (sinon US, sinon romanisé), figé à la création. En v1, `/` affiche le catalogue Wii U (US-01 en S).

## 5. Modèle de données

```
consoles(id, slug, nom, type 'salon'|'portable', annee, ordre, wikipedia_liste, igdb_platform_id)
games(id, console_id → consoles, slug, igdb_id, wikipedia_url, developpeur, franchise, genre,
      physique bool, verrous text[], created_at, updated_at)
releases(id, game_id → games, region 'JAP'|'US'|'PAL', sortie bool, titre, titre_romanise (JAP),
         date_sortie date, precision_date 'jour'|'mois'|'annee', code_produit, editeur,
         jaquette_path, jaquette_source 'gametdb'|'igdb'|'photo'|'url', verrous text[], updated_at)
         unique (game_id, region)
import_runs(id, console_id, lance_le, resume jsonb)
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
| `/a-propos` | Non-affiliation, sources (Wikipédia, IGDB) et licences | US-07 |
| `/admin/connexion`, `/admin/import` | Connexion ; import avec aperçu et lots | US-09, 10 |
| `/jeux/[console]/[jeu]/modifier` | Correction, jaquettes par région | US-11, 12 |

Pas de sélecteur de région global : le marché se choisit dans le catalogue, la région sur la fiche. Les jaquettes sont l'élément visuel
principal (priorité du propriétaire) : grille à bords fins, proportions de boîte respectées, pas de recadrage.

## 7. Tests

| Niveau | Quoi |
|---|---|
| Vitest | lecture du tableau Wikipédia **sur fixture** (50 jeux Nintendo en boîte attendus), réponses IGDB **sur fixtures**, rapprochement, normalisation, slug, verrous, conversion WebP |
| pgTAP | RLS (anon lit, n'écrit pas), bucket, unicité `(game_id, region)` |
| Playwright | catalogue → fiche, filtre par marché, recherche au fil de la frappe, bascule de région sur la fiche, connexion, correction |
| CI | lint, types, unitaires, build, e2e sur base Supabase locale, types générés à jour |

Fixtures : copie datée de « List of Wii U games » et de quelques réponses IGDB (+ README d'origine) ; aucun
test n'appelle les sites en direct.

## 8. Plan par étapes (milestones)

1. **Socle** : Next.js, Tailwind, ESLint, Vitest, Playwright, CI, déploiement Vercel.
2. **Base** : Supabase, migrations (schéma, RLS, bucket), console Wii U, connexion US-09.
3. **Consultation** : US-02, US-03, US-04, US-05 avec 3–4 jeux Wii U saisis en données de départ → *site visible tôt*.
4. **Import Wii U** : US-10 (Wikipédia + IGDB + jaquettes).
5. **Correction** : import GameTDB (scans de boîtes, codes produit), US-12 (page « Jaquettes »), US-11.
6. **Filtres** : US-06.
7. **Finitions** : US-07, US-08, référencement. Puis console suivante.

**Réglages de comptes** (Supabase, Vercel, compte développeur Twitch pour IGDB) : regroupés dans une session
faite **depuis le PC** (leçon du bilan précédent), avant l'étape 2.

## 9. Risques

| # | Risque | Parade |
|---|---|---|
| R1 | Rapprochement Wikipédia ↔ IGDB erroné (titres proches) | Aperçu avec identifiant IGDB corrigeable ; tests sur fixtures de cas ambigus |
| R2 | Pas de jaquette IGDB pour une région | Jaquette principale en secours, signalée dans le résumé ; remplaçable (US-12) |
| R3 | Droits des jaquettes | Mention de la source ; « non affilié » (US-07) ; retrait sur demande |
| R4 | Attributions (CC BY-SA Wikipédia, IGDB) | Lien source sur chaque fiche + page À propos |
| R5 | Prévisualisation Vercel partageant la base de production | Prévenir dans la PR ; piste : branches Supabase |
| R6 | Image IGDB = illustration sans bandeau Wii U, pas un scan de boîte | Scans GameTDB en priorité ; restes remplacés à la main (US-12) ; aucun bandeau imité par le site |
| R9 | GameTDB indisponible ou scan retiré | Jaquette déjà copiée chez nous conservée ; IGDB en secours ; mention de la source, retrait sur demande |
| R6 | Forme du tableau Wikipédia qui change | Lecture par en-têtes de colonnes, test sur fixture ; échec explicite plutôt que données fausses |
| R7 | Limites IGDB (4 requêtes/s) | Lots de 10, requêtes groupées ; ≈ 50 jeux en v1 |
| R8 | Codes produit absents | Déduits de l'identifiant GameTDB ; sinon saisie manuelle (US-11) |

## 10. Commandes (dès l'étape 1)

```
npm run dev | lint | typecheck | test | e2e
npm run db:start | db:test | db:types
```

## 11. Prochaines étapes

Valider ce document avec les maquettes v0.2 → issues de l'étape 1.
