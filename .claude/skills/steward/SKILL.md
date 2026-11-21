---
name: steward
description: Ouvrir et suivre une pull request de nintendo-db jusqu'au merge par le propriétaire (branche, npm run check, modèle de PR, lien de prévisualisation Vercel, CI lue tâche par tâche, pannes connues). À charger avant de committer pour une PR, et à chaque événement de CI ou de revue sur une PR.
---

# Ouvrir et suivre une PR

Le propriétaire relit depuis son iPhone et **merge lui-même** : Claude ne merge jamais.

## Avant d'ouvrir

- Plan validé par le propriétaire (questions à choix). S'il change en route, le dire dans la PR
  (« Changement par rapport au plan validé ») et au propriétaire.
- Branche `feat/us-xx-…`, `fix/…`, `docs/…` ou `chore/…`, partie de `origin/main` à jour ; jamais de commit sur
  `main`. Si la session impose une autre branche, demander au propriétaire laquelle prendre.
- Clone superficiel qui ne suit que `main` : `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`
  (fait par le script de démarrage de l'environnement).
- `npm run check`, sortie montrée (fichiers et tests passés). Bug : d'abord le test qui échoue, puis la correction.
- Moins de 300 lignes ; deux sujets indépendants → deux PR. Commits Conventional Commits, en français.

## Ouvrir

- Suivre `.github/pull_request_template.md` sans en retirer de section : Quoi, Closes #, Critères d'acceptation
  (copiés de `docs/SPEC.md`), Comment tester, **Ce qui n'a pas été vérifié** (ce que ni les tests ni Claude n'ont
  vu : à regarder pendant le test manuel), Checklist.
- Lien de prévisualisation, dans la PR **et** dans le message au propriétaire, avec les étapes sur l'iPhone :
  `https://nintendo-db-git-<branche, / remplacés par ->-manadthan.vercel.app`.
- Migration ou script de données : signaler que les prévisualisations partagent la base de production.
- S'abonner à l'activité de la PR (`subscribe_pr_activity`).

## Suivre la CI

Quatre tâches : « Lint, types, tests, build », « Tests e2e (iPhone 12 mini, Chromium + WebKit) »,
« Base de données (migrations, tests pgTAP) », « Vercel Preview Comments ».

- Dire « CI verte » seulement après avoir lu la conclusion de **chacune** (`pull_request_read`, `get_check_runs`).
  Erreur du 19/11/2026 : un test pgTAP rouge sur `main` de #127 à #134, que personne n'avait lu.
- Les commentaires de vercel[bot] (« Building », puis « Ready ») ne demandent rien.
- Rouge : trouver la cause et la corriger ; jamais de test désactivé ni de commit vide pour relancer.

### Pannes connues

- **e2e arrêtée pendant l'installation des navigateurs** (miroir Ubuntu lent : #109, #120, PR du 19/11) : ce n'est
  pas le code. `ci.yml` a un cache des navigateurs et des paquets Ubuntu, 10 min par essai, un second essai qui
  arrête d'abord l'apt-get du premier, une limite de 35 min. Le confirmer dans le journal ; une seule relance.
- **pgTAP** : une migration qui ajoute une valeur d'énumération casse les tests qui listent ses valeurs : les mettre
  à jour dans la même PR.
- **Types** : après une migration, `npm run db:types` (vérifié en CI). Docker est absent de la session : pour pgTAP
  et les e2e connectés, la CI fait foi.

## Fin

- CI verte et pas de conflit : donner au propriétaire le lien de la PR ; il relit et merge.
- Mergée : mettre à jour l'Avancement de CLAUDE.md si l'étape avance (dans la PR suivante ou une PR `docs`).
