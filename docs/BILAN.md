# Bilan — Nintendo DB (v1 Wii U, étapes 1 à 7 ; Wii, DS, 3DS, Switch, étapes 8 à 10)

> Dernière phase du playbook (`PLAYBOOK.md`) : **rétrospective** en fin de grande étape. Ce qui a été livré, ce qui a
> bien marché, ce qui a coincé, et ce qu'on en retient pour la suite et pour un prochain projet avec Claude.
>
> Version 1.2 — 18/11/2026 — statut : **validé**
>
> | Version | Date | Changements |
> |---|---|---|
> | 1.2 | 18/11/2026 | **Étapes 8 à 10** : Wii, DS, 3DS, Switch, Switch 2, import des nouveautés (§8) |
> | 1.1 | 17/11/2026 | **Bilan final de la v1** : étapes 6 (filtres) et 7 (finitions) ajoutées (§7), chiffres mis à jour, pistes |
> | 1.0 | 17/11/2026 | Bilan des étapes 1 à 5 |

## 1. En chiffres

| | |
|---|---|
| Durée | 2 jours (16 → 17/11/2026), depuis un iPhone 12 mini |
| Étapes du plan | **7 sur 7** : socle, base, consultation, import, correction, filtres, finitions — **v1 Wii U terminée** |
| User stories livrées | US-02 à US-12, et **US-15 (logo)**, ajoutée en cours de route ; exigence « Référencement » |
| Pull requests mergées | 41, toutes passées par la CI et la revue du propriétaire |
| Tests automatiques | 173 unitaires (Vitest), 55 de bout en bout lancés sur Chromium et WebKit (iPhone 12 mini), 39 sur la base (pgTAP) |
| Migrations de base | 6, appliquées automatiquement en production au merge |
| Code applicatif | ≈ 6 300 lignes (hors tests) |
| Données en ligne | 48 jeux Wii U en boîte, 132 scans de vraies boîtes sur 135 disques, codes produit de chaque région, genres en français |

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

- **Étape 8 — Wii** (décidée le 17/11) : jeux en boîte édités par Nintendo, avec une étude GameTDB de la Wii **avant
  la spec** (leçon 1).
- Idées du propriétaire, à étudier ensuite (intention à mettre à jour d'abord) : **comptes utilisateurs et jeux
  possédés**, **tableau de complétion par console** sur la page utilisateur, **note Metacritic** et **valeur estimée**
  sur la fiche (sources à mesurer avant tout : accès, coût, licence).
- **Import automatique après un changement des données importées** : aujourd'hui il faut relancer l'import à la main
  (genres, §7).
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

## 7. Étapes 6 et 7 : filtres et finitions

| | |
|---|---|
| Livré | Genres de GameTDB traduits par la base elle-même (#70) ; panneau « Filtres » : disponibilité, année, genre, pastilles, adresse partageable (#71) ; page « À propos » (#74) ; référencement : sitemap, robots, adresses canoniques, aperçus de partage avec jaquette, données schema.org (#75) |
| Méthode | 2 PR indépendantes par étape, mergeables dans n'importe quel ordre (au lieu de PR empilées, §3) ; spec mise à jour avant le code (SPEC v1.7 puis v1.8 : filtre en doublon retiré, référencement précisé) |
| Incident | Tests e2e qui se gênaient sur la base partagée, **2ᵉ fois** : un jeu de test ajouté en administration apparaissait dans le catalogue d'un autre test. Corrigé à la racine (tests d'administration après les tests publics) et règle ajoutée à `CLAUDE.md` |

| Question | Réponse du propriétaire |
|---|---|
| Ce qui a le plus aidé | **Les explications sur ce qu'il fallait tester** (« Comment tester », « Ce qui n'a pas été vérifié »). |
| Ce qui a ralenti | **Réimporter les données** pour remplir le champ Genre. |
| À faire différemment | Rien. |

Leçons ajoutées :

7. **Dire précisément quoi tester, et ce qui n'a pas été vérifié** : c'est ce qui rend la revue possible depuis un
   téléphone. À garder dans chaque PR.
8. **Une donnée importée nouvelle ne doit pas exiger de geste manuel** : prévoir, dès la PR, comment la production
   est mise à jour (import relancé automatiquement, ou rattrapage par migration).


## 8. Étapes 8 à 10 : Wii, DS, 3DS, Switch et Switch 2

| | |
|---|---|
| Durée | 2 jours (17 → 18/11/2026) |
| Livré | 6 consoles au lieu d'une : Wii (87 jeux), DS (114), 3DS (118), Switch (112), Switch 2 (Wikipédia, photos à la main), dans un seul catalogue filtrable par console ; jaquettes aux proportions de chaque boîte ; **import des nouveautés** (seuls les jeux nouveaux ou modifiés sont enregistrés) ; exclusions mémorisées (« en boîte » décoché) |
| Pull requests | 15 mergées (#77 à #107), CI verte à chaque fois |
| Tests | 241 unitaires (+ 68), 60 de bout en bout, 47 sur la base ; 10 migrations |
| Code applicatif | ≈ 7 800 lignes (hors tests) |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| **Le relais GameTDB** (retour du propriétaire : *ce qui a le plus ralenti*) | Envoi Supabase en erreur sans message (#92), puis GameTDB qui **bloque GitHub** (18/11) : l'import Switch attendait des scans qui ne venaient pas | Réessais des envois (#93) et des téléchargements (#107) ; relais lancé **depuis la session Claude**, clé Supabase injectée par le réseau sans jamais apparaître (méthode dans `CLAUDE.md`) |
| Qualité des jaquettes Wii | Bande blanche à gauche, tranches noires ou inclinées : la découpe au milieu du scan ne suffisait pas | Détection du bord de la face, testée d'abord sur des scans qui échouaient (#87) |
| Règles des données découvertes au fil de l'eau | Wii Startup Disc, démos et bornes DS, rééditions, packs et éditions spéciales Switch, jeux Switch 2 en téléchargement seul | Une règle par cas, avec un test sur fixture ; exclusion mémorisée quand la source ne sait pas trancher |
| PR empilées (étape 8) puis dépendantes (étape 10) | 2 PR mergées dans leur branche au lieu de `main` ; conflits à résoudre après chaque merge | PR basées sur `main` ; ordre de merge annoncé dans chaque PR quand il est imposé (migrations) |

| Question | Réponse du propriétaire |
|---|---|
| Ce qui a le plus aidé | **L'étude avant la spec** : les mesures chiffrées de GameTDB avant chaque console (leçon 1 appliquée). |
| Ce qui a ralenti | **Le relais GameTDB.** |
| À faire différemment | **Voir les jaquettes avant** : montrer quelques jaquettes réelles dès l'étude, avant d'écrire le code. |

Leçons ajoutées :

9. **Montrer les images réelles dès l'étude** : quelques jaquettes de la future console (bonnes et mauvaises), vues
   par le propriétaire avant la spec. La bande blanche des boîtes Wii aurait été vue avant le code.
10. **Ne pas dépendre d'un seul chemin réseau** : une source peut bloquer un hébergeur du jour au lendemain (Vercel,
    puis GitHub). Garder un chemin de secours documenté et testé (relais depuis la session).
11. **Une source qui ne sait pas trancher → une décision mémorisée** : quand la donnée manque (boîte ou
    téléchargement), demander une fois au propriétaire et s'en souvenir, plutôt qu'une liste figée dans le code.

Pistes : **filtre par développeur** (#89), **GameCube** (étape 11), déblocage de GitHub par GameTDB à surveiller,
jaquettes Switch 2 et japonaises Switch à compléter à la main.
