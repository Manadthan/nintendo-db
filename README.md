# Nintendo DB

[![CI](https://github.com/Manadthan/nintendo-db/actions/workflows/ci.yml/badge.svg)](https://github.com/Manadthan/nintendo-db/actions/workflows/ci.yml)

Les jeux Nintendo en boîte, version par version : jaquettes, titres et dates au **Japon**, en
**Amérique du Nord** et en **Europe**. Première console : **Wii U**. Projet de fan, non affilié à Nintendo.

Projet d'apprentissage du cycle de développement avec Claude : voir [`PLAYBOOK.md`](PLAYBOOK.md).

## Documents

| Document | Contenu |
|---|---|
| [`intent/intent.md`](intent/intent.md) | Pourquoi ce site, décisions de départ |
| [`docs/SPEC.md`](docs/SPEC.md) | User stories et critères d'acceptation |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Stack, décisions techniques (ADR), données, tests, plan |
| [`docs/MAQUETTES.md`](docs/MAQUETTES.md) | Maquettes des écrans (iPhone 12 mini) |
| [`CLAUDE.md`](CLAUDE.md) | Règles de travail, lu par Claude à chaque session |

## Démarrer

Prérequis : Node.js 24 (voir `.nvmrc`).

```
npm install
npm run dev        # http://localhost:3000
```

## Vérifier

```
npm run check      # lint + types + tests unitaires (Vitest)
npm run build      # build de production
npm run e2e        # tests de bout en bout (Playwright, 375 × 812)
```

La CI (GitHub Actions) lance tout cela sur chaque pull request, avec WebKit (Safari) en plus.

## Stack

Next.js (App Router, TypeScript strict) · Tailwind CSS · Supabase · Vercel (région Paris) — détails dans
[`docs/DESIGN.md`](docs/DESIGN.md).
