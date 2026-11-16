# CLAUDE.md — Nintendo DB

Lu par Claude au début de chaque session. Court par principe : les détails sont dans les documents.

## Objectif

Site de référence des **jeux publiés par Nintendo**, sur **toutes les consoles Nintendo** (**v1 : Wii U**), avec
bascule entre les versions **JAP / US / PAL** (titre, date, code produit, visuels propres à chaque région).
Inspiration : gamecartdb.com, limité à Nintendo éditeur.

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
| `docs/SPEC.md` | User stories + critères d'acceptation (= définition de « terminé ») | v1.3 validée |
| `docs/DESIGN.md` | Stack, ADR, modèle de données, sources de données, tests, risques | v0.3 validée |
| `docs/MAQUETTES.md` | Lien vers les maquettes (2 écrans de la v1) | v0.2 validée |

## Règles de travail

- **Jamais de commit direct sur `main`.** Une issue → une branche → une PR → revue du propriétaire → merge.
- Branches : `feat/us-xx-…`, `fix/…`, `docs/…`, `chore/…`. Commits **Conventional Commits**.
- PR petites (< 300 lignes), décrivent les critères couverts **et ce qui n'a pas été vérifié**.
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
Supabase et Vercel à venir (DESIGN.md §2).

```
npm run dev        # serveur local
npm run check      # lint + typecheck + tests unitaires : à lancer avant chaque commit, sortie montrée
npm run build      # build de production
npm run e2e        # Playwright 375 × 812 (Chromium ici ; WebKit seulement en CI)
```

## Arborescence

```
src/app/                 pages (App Router) — layout.tsx, page.tsx, globals.css (couleurs des maquettes)
src/lib/recherche/       normaliser() pour la recherche (ADR-05) + tests
tests/e2e/               tests Playwright
.github/                 CI (workflows/ci.yml), modèles de PR et d'issue
docs/, intent/           SPEC, DESIGN, MAQUETTES, intention
```

Tests unitaires à côté du code (`*.test.ts`). Couleurs Tailwind : `fond`, `carte`, `texte`, `texte-doux`,
`texte-discret`, `bordure`, `accent`, `accent-fonce` ; polices `font-sans` (Inter), `font-titre` (Space Grotesk).

## Avancement

- [x] Phase 1 — Intention : `intent/intent.md` validée
- [x] Phase 2 — Spec, design, maquettes validés
- [x] Phase 3 — Issues de l'étape 1 (#4 à #9) ; milestone à créer par le propriétaire
- [ ] Phase 4+ — Développement par étapes (DESIGN.md §8)
  - [ ] Étape 1 — Socle : #4 ✅, #5 ✅, #6 ✅, #7 ✅, #9 (cette PR), #8 Vercel (réglage depuis le PC)
- [ ] Phase finale — Bilan

## Erreurs récurrentes

- **Clone superficiel** (`git clone --depth 1`) : il ne suit que `main`, et l'alerte « branche non poussée » revient
  après chaque `git push -u`. Une fois par clone : `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`.
