# Conception — Nintendo DB

> Étape 2 du playbook : **comment** construire ce que décrit `docs/SPEC.md` v1.2.
>
> Version 0.2 — 16/11/2026 — statut : **brouillon, à valider**
>
> | Version | Date | Changements |
> |---|---|---|
> | 0.2 | 16/11/2026 | v1 Wii U ; sources Wikipédia + IGDB (Wikidata, MobyGames écartés) ; jaquettes copiées chez nous |
> | 0.1 | 16/11/2026 | Premier brouillon (Wikidata + Wikipédia, liens d'images externes) |

## 1. Étude des sources (16/11/2026)

| Source | Ce qu'elle apporte | Conditions | Verdict |
|---|---|---|---|
| **Wikipédia** « List of Wii U games » | 792 jeux, dont **67 édités par Nintendo**, **50 en boîte** (marqués †) ; dates **Japon / Amérique du Nord / Australasie / Europe** ; titres NA et PAL quand ils diffèrent | CC BY-SA 4.0 : attribution | **Retenue** : liste de référence et dates |
| **IGDB** (Twitch) | **Jaquettes par région** (`game_localizations`), haute définition ; titres régionaux ; dates par région | Gratuit, y compris commercial ; **stockage encouragé** ; mention visible d'IGDB ; compte développeur Twitch | **Retenue** : jaquettes et titres japonais |
| Wikidata | Liste et titre japonais corrects ; dates PAL 15–23 % ; aucun code produit ; pas de jaquettes ; pas de distinction boîte / dématérialisé | CC0 | Écartée (redondante avec les deux autres) |
| MobyGames | Données riches | Page « Just a moment… » anti-robots : conditions illisibles par un programme ; API devenue payante (à confirmer) | Écartée |
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
                                   └──▶ en.wikipedia.org, api.igdb.com, images.igdb.com  (import, côté serveur)
```

## 4. Décisions (ADR)

**ADR-01 — Public en lecture, un seul administrateur.** Lecture ouverte à tous (rôle `anon`), écriture réservée
au compte du propriétaire, créé à la main ; inscriptions désactivées. La RLS vérifie l'écriture côté base, en
plus des contrôles des server actions.

**ADR-02 — Pages publiques statiques, région choisie dans le navigateur.** Les pages contiennent les données
des **3 régions** ; la région est un attribut `data-region` sur `<html>`, posé par un petit script **avant
l'affichage** (comme le thème sur gamecartdb) à partir de `localStorage` (défaut PAL). Le CSS n'affiche que la
région active. *Pourquoi* : pages cachables (rapides) et bascule instantanée sans rechargement (US-03), sans
« flash » de la mauvaise région. Écartée : région en cookie lue par le serveur (pages non cachables). Après une
modification, `revalidatePath` régénère les pages concernées.

**ADR-03 — Import Wikipédia + IGDB, aperçu puis enregistrement.**
1. **Wikipédia** (référence) : tableau de la liste des jeux de la console, lu avec cheerio. Retenus : éditeur
   contenant « Nintendo » dans au moins une région **et** marqué † (en boîte). Récupérés : titres (NA, PAL),
   développeur, éditeur, dates **JAP** (colonne Japan), **US** (North America), **PAL** (Europe ; Australasie
   ignorée), « Unreleased » = non sorti.
2. **IGDB** : pour chaque jeu, recherche par titre sur la plateforme Wii U → identifiant IGDB ; puis
   `game_localizations` (titre et jaquette par région) et la jaquette principale en secours. Le titre japonais
   vient de la localisation Japon ; sa forme romanisée est le titre IGDB principal ou saisie à la main.
3. **Aperçu** (n'écrit rien) : jeux, rapprochement IGDB proposé (corrigeable à la main si le titre est ambigu),
   ajoutés / modifiés / ignorés avec la raison. Puis enregistrement **par lots de 10** piloté par le
   navigateur, jaquettes comprises (même principe que l'ADR-03 de `mon-site-sdlc`, évite les délais Vercel).
4. **Verrous** : tout champ modifié à la main est verrouillé ; l'import ne le remplace jamais et signale l'écart.
5. **Identifiants IGDB** (Client ID et secret Twitch) : variables d'environnement côté serveur sur Vercel, jamais
   dans le dépôt ni dans le navigateur ; jeton d'accès demandé à la volée et gardé en mémoire.

**ADR-04 — Jaquettes copiées chez nous, en WebP haute définition.** Source IGDB en `t_cover_big_2x`
(528 × 748) ou plus grand, convertie avec sharp en **deux tailles WebP** : 300 px et 600 px de large
(la grande pour l'écran Retina), servies avec `srcset`. Chemin : `{game_id}/{region}-{taille}.webp` dans un
bucket public ; écriture réservée au propriétaire. Toute image est **ré-encodée** (jamais servie telle quelle).
Mention « Jaquette : IGDB » (ou « Photo ») sous la jaquette. *Pourquoi* : rendu net et rapide comme gamecartdb,
pas d'image cassée si la source change, et IGDB préfère qu'on stocke ses images. Remplace l'ADR-04 de la v0.1.

**ADR-05 — Recherche dans Postgres.** Titre normalisé (minuscules, sans accents ni ponctuation, `unaccent`)
sur chaque sortie + index trigramme (`pg_trgm`) : une requête trouve un jeu par n'importe lequel de ses 3 titres.

**ADR-06 — Adresses stables.** `/consoles/{console}` et `/jeux/{console}/{jeu}` avec un *slug* tiré du titre
PAL (sinon US, sinon romanisé), figé à la création. En v1, `/` affiche le catalogue Wii U (US-01 en S).

## 5. Modèle de données

```
consoles(id, slug, nom, type 'salon'|'portable', annee, ordre, wikipedia_liste, igdb_platform_id)
games(id, console_id → consoles, slug, igdb_id, wikipedia_url, developpeur, franchise, genre,
      physique bool, verrous text[], created_at, updated_at)
releases(id, game_id → games, region 'JAP'|'US'|'PAL', sortie bool, titre, titre_romanise (JAP),
         date_sortie date, precision_date 'jour'|'mois'|'annee', code_produit, editeur,
         jaquette_path, jaquette_source 'igdb'|'photo'|'url', titre_normalise (calculé), verrous text[], updated_at)
         unique (game_id, region)
import_runs(id, console_id, lance_le, resume jsonb)
```

- Un jeu = une œuvre sur une console ; ses 3 sorties sont toujours créées (`sortie = false` si absente).
- **RLS** : `select` pour tous ; `insert/update/delete` pour `authenticated` seulement (inscriptions
  désactivées ⇒ seul le propriétaire). Même règle pour le bucket d'images. Testé en pgTAP.
- Évolution du schéma **uniquement** par `supabase/migrations/` ; types TypeScript générés et vérifiés en CI.

## 6. Écrans et routes (v1)

| Route | Contenu | US |
|---|---|---|
| `/` → `/consoles/wii-u` | Catalogue grille de jaquettes / liste, tri, groupes par année, filtres | US-02, 03, 06 |
| `/jeux/[console]/[jeu]` | Grande jaquette, onglets JAP/US/PAL, tableau des 3 régions, sources | US-04 |
| `/recherche?q=` | Résultats | US-05 |
| `/a-propos` | Non-affiliation, sources (Wikipédia, IGDB) et licences | US-07 |
| `/admin/connexion`, `/admin/import` | Connexion ; import avec aperçu et lots | US-09, 10 |
| `/jeux/[console]/[jeu]/modifier` | Correction, jaquettes par région | US-11, 12 |

Le sélecteur JAP / US / PAL est dans l'en-tête, collé en haut de l'écran. Les jaquettes sont l'élément visuel
principal (priorité du propriétaire) : grille à bords fins, proportions de boîte respectées, pas de recadrage.

## 7. Tests

| Niveau | Quoi |
|---|---|
| Vitest | lecture du tableau Wikipédia **sur fixture** (50 jeux Nintendo en boîte attendus), réponses IGDB **sur fixtures**, rapprochement, normalisation, slug, verrous, conversion WebP |
| pgTAP | RLS (anon lit, n'écrit pas), bucket, unicité `(game_id, region)`, recherche sans accents |
| Playwright | catalogue → fiche, bascule de région sans flash, recherche, connexion, correction |
| CI | lint, types, unitaires, build, e2e sur base Supabase locale, types générés à jour |

Fixtures : copie datée de « List of Wii U games » et de quelques réponses IGDB (+ README d'origine) ; aucun
test n'appelle les sites en direct.

## 8. Plan par étapes (milestones)

1. **Socle** : Next.js, Tailwind, ESLint, Vitest, Playwright, CI, déploiement Vercel.
2. **Base** : Supabase, migrations (schéma, RLS, bucket, recherche), console Wii U, connexion US-09.
3. **Consultation** : US-02, US-03, US-04 avec 3–4 jeux Wii U saisis en données de départ → *site visible tôt*.
4. **Import Wii U** : US-10 (Wikipédia + IGDB + jaquettes).
5. **Correction** : US-11, US-12.
6. **Recherche et filtres** : US-05, US-06.
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
| R6 | Forme du tableau Wikipédia qui change | Lecture par en-têtes de colonnes, test sur fixture ; échec explicite plutôt que données fausses |
| R7 | Limites IGDB (4 requêtes/s) | Lots de 10, requêtes groupées ; ≈ 50 jeux en v1 |
| R8 | Codes produit absents des deux sources | Saisie manuelle (décision 3 de la spec) ; piste Redump plus tard |

## 10. Commandes (dès l'étape 1)

```
npm run dev | lint | typecheck | test | e2e
npm run db:start | db:test | db:types
```

## 11. Prochaines étapes

Valider ce document → maquettes des 3 écrans de la v1 (catalogue, fiche, recherche) → issues de l'étape 1.
