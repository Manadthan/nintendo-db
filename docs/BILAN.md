# Bilan — Nintendo DB (v1 Wii U, étapes 1 à 5)

> Dernière phase du playbook (`PLAYBOOK.md`) : **rétrospective** en fin de grande étape. Ce qui a été livré, ce qui a
> bien marché, ce qui a coincé, et ce qu'on en retient pour la suite et pour un prochain projet avec Claude.
>
> Version 1.0 — 17/11/2026 — statut : **validé**

## 1. En chiffres

| | |
|---|---|
| Durée | 2 jours (16 → 17/11/2026), depuis un iPhone 12 mini |
| Étapes du plan | 5 sur 7 : socle, base, consultation, import, correction. Restent les filtres (US-06) et les finitions (US-07, référencement) |
| User stories livrées | US-02, 03, 04, 05, 08, 09, 10, 11, 12, et **US-15 (logo)**, ajoutée en cours de route |
| Pull requests mergées | 36, toutes passées par la CI et la revue du propriétaire |
| Tests automatiques | 146 unitaires (Vitest), 45 de bout en bout lancés sur Chromium et WebKit (iPhone 12 mini), 39 sur la base (pgTAP) |
| Migrations de base | 6, appliquées automatiquement en production au merge |
| Code applicatif | ≈ 5 500 lignes (hors tests) |
| Données en ligne | 48 jeux Wii U en boîte, 132 scans de vraies boîtes sur 135 disques, codes produit de chaque région |

## 2. Ce qui a bien marché

- **Les questions à choix** (retour du propriétaire : *ce qui a le plus aidé*). Chaque décision importante a été
  prise en un geste depuis l'iPhone, sur des options déjà préparées : sources GameTDB et retrait d'IGDB, règle
  du physique, compilations, relais GitHub, thème sombre plus doux, logo cartouche, lien d'administration.
- **Les documents d'abord.** Toute demande qui contredisait SPEC, DESIGN ou MAQUETTES a d'abord changé le
  document (SPEC v1.0 → v1.6, DESIGN v0.1 → v0.9). Les PR citaient les critères couverts et ce qui n'était pas
  vérifié.
- **Une étude courte avant de changer de source.** Avant d'adopter GameTDB, une vingtaine de minutes de mesures
  réelles (couverture 89 %, scans au format exact d'une boîte, codes produit, licence) ont permis une décision
  sûre ; une sonde GitHub Actions a de même prouvé en une minute que GitHub, lui, accédait à GameTDB.
- **La CI comme filet.** Elle a attrapé ce que Claude ne pouvait pas voir : types générés désynchronisés,
  sélecteurs de test ambigus, tests qui se gênaient sur la base partagée, un port déjà occupé sur la machine
  de CI.
- **Rendre les erreurs lisibles.** « React error #441 » ne disait rien ; une fois le vrai message affiché
  (#53), la cause (GameTDB refuse Vercel) est apparue au premier essai.
- **La sécurité pensée en même temps que la fonction** : RLS, bucket privé du relais, protection SSRF de
  l'image par adresse (vérifiée à chaque redirection), images toujours ré-encodées, aucun secret dans le dépôt.

## 3. Ce qui a coincé

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| **Les surprises des sources** (retour du propriétaire : *ce qui a le plus ralenti*) | Jaquettes IGDB sans bandeau, Wikipédia mêlant boîte et téléchargement, GameTDB inaccessible depuis Vercel : chaque fois découvert après le merge, sur la vraie production | Étude chiffrée de la source, sonde depuis l'hébergeur, relais GitHub ; **à faire avant la spec** la prochaine fois |
| Cache des images | Les nouveaux scans écrits au même nom s'affichaient avec l'ancienne image (#60) | Chemin versionné à chaque copie, cache d'un an |
| Page ouverte avant un déploiement | L'ancienne page appelait le nouveau serveur : erreur incompréhensible à l'import | Recharger la page après un merge ; erreurs renvoyées avec leur message (#53) |
| Merge plus rapide que le dernier commit | La PR #54 a été mergée sans le relais, qui a dû repartir dans une nouvelle PR (#55) | Pousser tout le travail avant d'annoncer une PR « prête » |
| PR empilées | 4 PR dépendantes à merger dans l'ordre, chaque correctif reporté à la main sur les branches suivantes | Utile pour avancer vite ; à réserver aux séries courtes |
| Pas de base ni de vrai navigateur iPhone chez Claude | Écrans d'administration vus pour la première fois par la CI ou sur l'iPhone | CI avec base jetable et WebKit ; serveur Supabase factice pour les captures |

## 4. Ce qu'on retient pour travailler avec Claude

1. **Tester les sources d'abord** (retour du propriétaire : *à faire différemment*) : avant d'écrire la spec,
   prototyper l'import réel depuis l'hébergeur de production, avec les vraies images, sur quelques jeux.
2. **Une question à choix par décision**, préparée avec ses conséquences : c'est le meilleur moyen de piloter
   depuis un téléphone.
3. **Mesurer avant de choisir** une source ou un service : couverture, format, licence, accès réseau.
4. **Rendre chaque erreur lisible en production** dès la première version : un message masqué coûte un
   aller-retour.
5. **Tests e2e isolés** : chaque test qui écrit en base travaille sur des données que les autres ne lisent
   pas ; sélecteurs exacts, rôles génériques filtrés par leur texte (règle ajoutée à `CLAUDE.md`).
6. **Une adresse par version** pour tout fichier remplaçable (images) : jamais de cache périmé.

## 5. Pistes pour la suite

- **Étape 6 — Filtres** (US-06) et **étape 7 — Finitions** (US-07 mentions et sources, référencement), puis la
  console suivante, avec une étude GameTDB de cette console dès le départ.
- Déverrouiller un champ corrigé à la main, pour que l'import puisse de nouveau le mettre à jour.
- Liste d'exclusion : un jeu importé supprimé à la main revient aujourd'hui au prochain import.
- Base de prévisualisation séparée (branches Supabase) pour tester migrations et import avant le merge.
- Retirer les colonnes inutilisées `igdb_id` et `igdb_platform_id` (nouvelle migration).

## 6. Le point de vue du propriétaire

| Question | Réponse |
|---|---|
| Ce qui a le plus aidé | **Les questions à choix** : décider vite, depuis l'iPhone, sur des options préparées. |
| Ce qui a ralenti | **Les surprises des sources** : chaque problème de données découvert après le merge. |
| À faire différemment | **Tester les sources d'abord**, avant d'écrire la spec. |
