# PLAYBOOK — SDLC avec Claude

> Bonnes pratiques tirées de *The AI-native SDLC playbook* (Anthropic,
> https://claude.com/fr/resources/articles/the-ai-native-sdlc-playbook), adaptées à ce projet :
> **un seul propriétaire**, qui travaille surtout depuis l'**iPhone**, et qui apprend le SDLC.
> Complétées par les leçons du projet précédent (`mon-site-sdlc`, `docs/BILAN.md`).
>
> Version 1.0 — 16/11/2026 — statut : **validée**

## 1. Principes

| Principe du playbook | Ce que ça veut dire ici |
|---|---|
| **Chaque étape produit un artefact versionné** que la suivante lit | `intent/intent.md` → `docs/SPEC.md` → `docs/DESIGN.md` → `plan.md` de l'étape → PR (diff + tests) → `docs/BILAN.md` |
| **L'humain décide aux points de contrôle** | Le propriétaire valide l'intention, la spec, le plan, chaque PR et la mise en production. Claude prépare, signale les risques et pose des questions à choix. |
| **Le goulot se déplace vers le plan, la revue, les tests** | Le code est rapide à produire ; on investit dans des critères d'acceptation clairs, des PR petites et une CI exigeante. |
| **La gouvernance s'applique pendant le travail** | Règles dans `CLAUDE.md`, contrôles automatiques (CI, hooks) plutôt que relecture tardive. |
| **Un seul système de référence par artefact** | Le **dépôt** fait foi (markdown). Les issues GitHub renvoient vers les documents ; les PR citent l'issue et les critères. |

## 2. Les étapes

### Étape 1 — Planifier : `intent/intent.md`
- Claude rédige l'intention à partir d'un échange avec le propriétaire : **problème, résultat attendu,
  utilisateurs, contraintes, questions ouvertes**.
- Le propriétaire relit, corrige, tranche les questions ouvertes → statut « validée ».
- Pas de spec tant que l'intention n'est pas validée.

### Étape 2 — Concevoir : `docs/SPEC.md`, `docs/DESIGN.md`, maquettes
- **SPEC** : user stories numérotées (US-xx) + **critères d'acceptation** = définition de « terminé ».
- **DESIGN** : stack, décisions (ADR), modèle de données, sources de données, sécurité, tests, risques.
- **Maquettes** des écrans principaux sur la largeur iPhone avant le développement.
- Toute modification ultérieure du besoin passe **d'abord** par le document, puis par le code.

### Étape 3 — Développer
- **Plan d'abord** : chaque étape commence en lecture seule. Le plan liste fichiers touchés, ordre,
  tests de validation, risques, options écartées. Il doit pouvoir être exécuté par quelqu'un qui n'a pas
  suivi la discussion. Le plan validé est noté dans l'issue (ou `plan.md`) et mis à jour s'il change.
- **Une issue → une branche → une PR**, même pour un petit correctif. PR < 300 lignes idéalement.
- **`CLAUDE.md` court** (≈ 1 page) : commandes, conventions, architecture, erreurs récurrentes.
  Quand Claude fait **deux fois la même erreur**, on ajoute la règle dans `CLAUDE.md`.
- **Skills** (`.claude/skills/`) pour le savoir à appliquer de façon constante (ex. ajout d'une console,
  format des données) ; **hooks** pour ce qui est impératif (fichiers générés protégés, pas de secret,
  lint après modification). Les hooks restent rapides ; les contrôles lourds vont en CI.
- **Sessions parallèles** seulement sur des fichiers différents, et pas plus que ce que la revue suit.

### Étape 4 — Tester
- Claude a une **boucle de vérification** : lint + types + tests + build, en une commande qui échoue
  clairement. Il corrige jusqu'au vert et **montre la sortie**.
- Objectifs mesurables : tests verts, écran conforme à la maquette (capture 375 px), statut HTTP attendu.
- **Bug = test d'abord** : écrire le test qui échoue, le faire valider, puis corriger **sans toucher au test**.
- Les données importées (jeux, régions) sont vérifiées par des tests sur des **fixtures**, jamais sur un
  site en direct.
- Chaque PR dit **ce qui n'a pas été vérifié** (rendu Safari, données réelles…) pour orienter le test manuel.

### Étape 5 — Déployer
- **Revue assistée** : Claude relit chaque PR (bugs, sécurité, conformité à la spec et au plan) en
  séparant l'important du détail. Les constats récurrents alimentent `CLAUDE.md`.
- **L'agent qui a écrit le code n'approuve pas sa PR** : le merge est fait par le propriétaire, `main`
  est protégée.
- **Lien de prévisualisation** dans chaque PR pour tester sur l'iPhone avant le merge.
- Règle centrale : **Claude fait tout jusqu'à la porte de la production, et rien au-delà.**
  La production = merge sur `main` par le propriétaire.
- Migrations de base : uniquement par fichiers versionnés ; une migration appliquée ne se modifie jamais.

### Étape 6 — Maintenir
- Les retours d'usage et incidents redeviennent une **intention** (issue « intent ») qui repasse par le cycle.
- Chaque bug corrigé laisse un **test de non-régression**.
- Mise à jour des données (nouvelles sorties) : tâche planifiable, toujours livrée par PR.
- **Bilan** en fin de projet ou de grande étape : `docs/BILAN.md`.

## 3. Rôles (projet solo)

| Rôle du playbook | Qui |
|---|---|
| Initiateur, responsable produit, responsable des releases | Le propriétaire |
| Rédaction intention / spec / design / plan, code, tests, revue assistée | Claude |
| Approbation des PR, merge, réglages de comptes (GitHub, hébergeur, base) | Le propriétaire |

## 4. Leçons du projet précédent

1. Écrire le « quoi » avant le « comment » : les critères d'acceptation raccourcissent la revue.
2. Livrer tôt un site utilisable, étape par étape, plutôt que tout attendre de l'import de données.
3. Faire valider les choix importants par des **questions à choix**, pas les détails.
4. Tester sur l'appareil réel (Safari iOS) ce que la CI ne voit pas.
5. Regrouper les **réglages de comptes** (clés, variables, secrets) dans une session faite depuis un
   ordinateur (Remote Control) ; garder l'iPhone pour relire, tester, décider.
6. Prévoir une base de prévisualisation séparée si des migrations doivent être testées avant le merge.

## 5. Liste de contrôle

- [ ] `intent/intent.md` validée
- [ ] `docs/SPEC.md` (US + critères d'acceptation) validée
- [ ] `docs/DESIGN.md` (ADR, données, sécurité, tests) + maquettes validées
- [ ] `CLAUDE.md` court avec les commandes de vérification
- [ ] Protection de `main`, modèle de PR, modèle d'issue
- [ ] CI : lint, types, tests unitaires, build, e2e (WebKit, 375 × 812)
- [ ] Plan validé avant chaque étape de développement
- [ ] Hooks / skills quand une règle se répète
- [ ] Lien de prévisualisation dans chaque PR
- [ ] Bilan en fin de projet
