# Conception — Nintendo DB

> Étape 2 du playbook : **comment** construire ce que décrit `docs/SPEC.md` v1.1.
>
> Version 0.1 — 16/11/2026 — statut : **brouillon, à valider**

## 1. Mesure préalable des sources (16/11/2026)

Avant de concevoir l'import, mesure de Wikidata sur les jeux dont Nintendo est éditeur (`P123 = Q8093`) :

| Console | Jeux | Date JAP | Date US | Date PAL | Titre japonais | Code produit |
|---|---|---|---|---|---|---|
| Nintendo 64 | 81 | 53 % | 64 % | 20 % | 81 % | 0 % |
| Game Boy | 62 | 24 % | 29 % | 23 % | 87 % | 0 % |
| Switch | 205 | 21 % | 16 % | 15 % | 95 % | 0 % |
| GameCube | 85 | — | — | — | — | 74 % (GameID `P5838`) |

Constats : Wikidata est bon pour **la liste des jeux, les identifiants et le titre japonais**, faible pour les
**dates par région**, n'a **pas de code produit** (sauf le GameID GameCube/Wii), **pas de jaquettes**, et ne
distingue **pas physique / dématérialisé**. Il n'indique pas non plus *dans quelle région* Nintendo est éditeur.
→ Décision du propriétaire : **Wikidata + Wikipédia** (ADR-03).

## 2. Stack

Identique à `mon-site-sdlc` (décision 7 de l'intention) :

| Besoin | Choix |
|---|---|
| Pages et serveur | **Next.js** (App Router, TypeScript strict), server actions |
| Styles | **Tailwind CSS**, mobile d'abord, thèmes clair/sombre |
| Base, connexion | **Supabase** : Postgres (RLS), Auth (e-mail + mot de passe, inscriptions désactivées) |
| Import | **cheerio** (tableaux Wikipédia), `fetch` (Wikidata SPARQL) |
| Tests | **Vitest** (unitaires), **Playwright** (375 × 812, WebKit + Chromium), **pgTAP** (base) |
| Hébergement, CI | **Vercel** (région Paris `cdg1`), **GitHub Actions** |

## 3. Architecture

```
Visiteur (iPhone) ──HTTPS──▶ Vercel / Next.js ── pages publiques préparées à l'avance (ISR)
                                   │
Propriétaire (connecté) ──────────▶├──▶ Supabase (Postgres + Auth)
                                   │
                                   └──▶ query.wikidata.org, en.wikipedia.org   (import, côté serveur)

Jaquettes : <img> chargées directement depuis leur site d'origine par le navigateur (ADR-04)
```

## 4. Décisions (ADR)

**ADR-01 — Public en lecture, un seul administrateur.** Lecture ouverte à tous (rôle `anon`), écriture réservée
au compte du propriétaire, créé à la main ; inscriptions désactivées. La RLS vérifie l'écriture côté base, en
plus des contrôles des server actions.

**ADR-02 — Pages publiques statiques, région choisie dans le navigateur.** Les pages contiennent les données
des **3 régions** ; la région est un attribut `data-region` sur `<html>`, posé par un petit script **avant
l'affichage** (comme le thème sur gamecartdb) à partir de `localStorage` (défaut PAL). Le CSS n'affiche que la
région active. *Pourquoi* : pages cachables (rapides, pas de base sollicitée à chaque visite) et bascule
instantanée sans rechargement (US-03), sans « flash » de la mauvaise région. Écartée : région en cookie lue par
le serveur (pages non cachables). Après une modification, `revalidatePath` régénère les pages concernées.

**ADR-03 — Import en deux sources, aperçu puis enregistrement.**
1. **Wikidata** (licence CC0) : liste des jeux d'une console avec Nintendo éditeur → identifiant Wikidata,
   titres (dont japonais), développeur, franchise, genre, GameID, dates quand elles existent, lien Wikipédia.
2. **Wikipédia anglais** (CC BY-SA 4.0) : tableau « List of *console* games » → dates **JAP / US / PAL** et
   éditeur par région. Les listes de Wikipédia séparent jeux en boîte et jeux téléchargeables : être dans la
   liste « boîte » = **physique**. Rapprochement par le lien Wikipédia de Wikidata, sinon par titre normalisé.
3. **Aperçu** (n'écrit rien) : ajoutés / modifiés / ignorés avec la raison ; puis enregistrement **par lots**
   piloté par le navigateur (même principe que l'ADR-03 de `mon-site-sdlc`, évite les délais Vercel).
4. **Verrous** : tout champ modifié à la main est verrouillé ; l'import ne le remplace jamais et signale l'écart.
*Pourquoi Wikipédia anglais* : ses listes ont des colonnes de dates par région plus systématiques que le français.
Hypothèse à vérifier sur les fixtures de la première console (risque R1).

**ADR-04 — Jaquettes = liens externes, jamais copiées.** Une adresse `https` par sortie, saisie à la main
(US-12). Affichée par une balise `<img loading="lazy" referrerpolicy="no-referrer">` (pas `next/image`, qui
ferait de notre serveur un relais d'images de n'importe quel site), vignette neutre si l'image ne charge pas,
mention du site d'origine sous l'image. Sécurité : seules les adresses `https` sont acceptées ; la politique de
sécurité du contenu (CSP) autorise `img-src https:` mais aucun script externe.

**ADR-05 — Recherche dans Postgres.** Colonne de titre normalisé (minuscules, sans accents ni ponctuation,
fonction `unaccent`) sur chaque sortie + index trigramme (`pg_trgm`) : une requête trouve un jeu par n'importe
lequel de ses 3 titres (US-05). Écartée : index chargé dans le navigateur (≈ 3 000 jeux, poids inutile sur 4G).

**ADR-06 — Adresses stables.** `/consoles/{console}` et `/jeux/{console}/{jeu}` avec un *slug* tiré du titre
PAL (sinon US, sinon romanisé), figé à la création pour que les liens partagés restent valides.

## 5. Modèle de données

```
consoles(id, slug, nom, type 'salon'|'portable', annee, ordre, wikidata_id, wikipedia_liste)
games(id, console_id → consoles, slug, wikidata_id, wikipedia_url, developpeur, franchise, genre,
      physique bool, verrous text[], created_at, updated_at)
releases(id, game_id → games, region 'JAP'|'US'|'PAL', sortie bool, titre, titre_romanise (JAP),
         date_sortie date, precision_date 'jour'|'mois'|'annee', code_produit, editeur,
         jaquette_url, titre_normalise (calculé), verrous text[], updated_at)
         unique (game_id, region)
import_runs(id, console_id, lance_le, resume jsonb)
```

- Un jeu = une œuvre sur une console ; ses 3 sorties sont toujours créées (avec `sortie = false` si absente).
- `precision_date` : beaucoup de sources ne donnent que l'année ou le mois ; on affiche ce qu'on sait.
- « Nintendo éditeur dans au moins une région » : vérifié à l'import sur `releases.editeur`.
- **RLS** : `select` pour `anon` et `authenticated` sur toutes les tables ; `insert/update/delete` pour
  `authenticated` seulement (inscriptions désactivées ⇒ seul le propriétaire). Testé en pgTAP.
- Évolution du schéma **uniquement** par `supabase/migrations/` ; types TypeScript générés et vérifiés en CI.

## 6. Écrans et routes

| Route | Contenu | US |
|---|---|---|
| `/` | Consoles par ordre chronologique, salon / portables | US-01 |
| `/consoles/[console]` | Catalogue grille/liste, tri, groupes par année, filtres | US-02, 03, 06 |
| `/jeux/[console]/[jeu]` | Fiche, onglets JAP/US/PAL, tableau des 3 régions, source | US-04 |
| `/recherche?q=` | Résultats toutes consoles | US-05 |
| `/a-propos` | Non-affiliation, sources et licences | US-07 |
| `/admin/connexion` | Connexion du propriétaire | US-09 |
| `/admin/import` | Choix d'une console, aperçu, enregistrement par lots | US-10 |
| `/jeux/[console]/[jeu]/modifier` | Correction, jaquettes par région (connecté) | US-11, 12 |

Le sélecteur JAP / US / PAL est dans l'en-tête, collé en haut de l'écran.

## 7. Tests

| Niveau | Quoi |
|---|---|
| Vitest | normalisation des titres, slug, rapprochement Wikidata ↔ Wikipédia, analyse des tableaux Wikipédia et des réponses SPARQL **sur fixtures**, règles de verrous, validation des URL d'images |
| pgTAP | RLS (anon lit, n'écrit pas), unicité `(game_id, region)`, recherche sans accents |
| Playwright | parcours accueil → catalogue → fiche, bascule de région sans flash, recherche, connexion, correction |
| CI | lint, types, unitaires, build, e2e sur base Supabase locale, types générés à jour |

Fixtures : copies datées d'une réponse SPARQL et d'une page « List of Nintendo 64 games » (+ README d'origine),
téléchargées une fois ; aucun test n'appelle les sites en direct.

## 8. Plan par étapes (milestones)

1. **Socle** : Next.js, Tailwind, ESLint, Vitest, Playwright, CI, déploiement Vercel, page d'accueil vide.
2. **Base** : Supabase, migrations (schéma, RLS, recherche), consoles pré-remplies, connexion US-09.
3. **Consultation** : US-01, US-02, US-03, US-04 avec quelques jeux N64 saisis en données de départ
   → *site utilisable avant l'import*.
4. **Import** : US-10 sur la **Nintendo 64** d'abord, puis les autres consoles une à une.
5. **Correction** : US-11, US-12.
6. **Recherche et filtres** : US-05, US-06.
7. **Finitions** : US-07, US-08, référencement.

## 9. Risques

| # | Risque | Parade |
|---|---|---|
| R1 | Les tableaux Wikipédia varient d'une console à l'autre | Un analyseur par forme de tableau, testé sur fixture ; console non couverte = saisie manuelle |
| R2 | Images externes qui disparaissent ou bloquent l'affichage depuis un autre site | Vignette neutre automatique ; mention du site ; adresse modifiable (US-12) |
| R3 | Droits des jaquettes | Pas de copie ; mention « non affilié » et propriété des visuels (US-07) ; retrait sur demande |
| R4 | Attribution CC BY-SA de Wikipédia | Lien vers la page source sur chaque fiche + page À propos |
| R5 | Prévisualisation Vercel partageant la base de production | Prévenir dans la PR ; piste : branches Supabase (leçon du bilan précédent) |
| R6 | Volume (~3 000 jeux) et limites de Wikidata | Import console par console, par lots, avec un `User-Agent` identifiant le projet |

## 10. Commandes (dès l'étape 1)

```
npm run dev | lint | typecheck | test | e2e
npm run db:start | db:test | db:types
```

## 11. Prochaines étapes

Valider ce document → maquettes des 4 écrans publics (accueil, catalogue, fiche, recherche) → issues de l'étape 1.
