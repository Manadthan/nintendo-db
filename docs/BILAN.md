# Bilan — Nintendo DB (v1 Wii U, étapes 1 à 7 ; Wii, DS, 3DS, Switch, étapes 8 à 10 ; GameCube, collection, Metacritic, N64, GBA, étapes 11 à 14 ; statistiques, Game Boy Color, étapes 15 à 17 ; Game Boy, Virtual Boy, Super Nintendo, NES, contrôle du catalogue, étapes 18 à 22 ; séries, frise, collectionneurs invités, étapes 23 à 27 ; audit de performance ; prix eBay, étape 25 ; captures RAWG, étape 28 ; guides japonais, étape 29 ; couvertures Amazon des guides)

> Dernière phase du playbook (`PLAYBOOK.md`) : **rétrospective** en fin de grande étape. Ce qui a été livré, ce qui a
> bien marché, ce qui a coincé, et ce qu'on en retient pour la suite et pour un prochain projet avec Claude.
>
> Version 1.11 — 26/11/2026 — statut : **à valider**
>
> | Version | Date | Changements |
> |---|---|---|
> | 1.11 | 26/11/2026 | **Couvertures Amazon Japon des guides** (reprise de l'étape 29) : étude, choix, 4 PR, 159 couvertures copiées, leçons (§17) |
> | 1.10 | 25/11/2026 | **Étape 29, guides japonais** : études, page du guide, catalogue, remplissage 3DS et Switch, écriture sur la mauvaise planche réparée, leçons (§16) |
> | 1.9 | 23/11/2026 | **Étape 28, captures RAWG** : étude, relais, planche, carrousel, 3 corrections en route, leçons (§15) |
> | 1.8 | 22/11/2026 | **Étape 25, prix eBay** : étude, choix, 3 PR de code, difficultés, leçons (§14) |
> | 1.7 | 22/11/2026 | **Audit de performance** (skill `react-best-practices`) : mesures avant/après, difficultés, leçons (§13) |
> | 1.6 | 22/11/2026 | **Fin de l'étape 22 et étapes 23 à 27** : séries, frise, étude Giant Bomb, outillage de la session, collectionneurs invités (§12) |
> | 1.5 | 20/11/2026 | **Étapes 18 à 22** : Game Boy, Virtual Boy, Super Nintendo, NES, jaquettes officielles, contrôle par les bases officielles (§11) |
> | 1.4 | 19/11/2026 | **Étapes 15 à 17** : N64 et GBA complétées, statistiques, tri par note, Game Boy Color ; CI réparée (§10) |
> | 1.3 | 19/11/2026 | **Étapes 11 à 14** : GameCube, filtre Développeur, ma collection, note Metacritic, Nintendo 64 et Game Boy Advance (§9) |
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

## 9. Étapes 11 à 14 : GameCube, ma collection, note Metacritic, N64 et GBA

| | |
|---|---|
| Durée | 1 jour (19/11/2026) |
| Livré | **GameCube** (relais GameTDB, petite image, compilations gardées) ; **filtre Développeur** avec « Nintendo (first party) » ; **ma collection** (US-16 : versions possédées, privées, en étiquettes vertes JAP / US / PAL) ; en-tête en icônes avec un accès unique à la connexion ; **note Metacritic** (US-17 : couleur sur la fiche, étiquette dans le catalogue, lue sur Wikipédia ou saisie à la main) ; **Nintendo 64** (58 jeux, boîtes libretro-thumbnails) et **Game Boy Advance**, deux consoles sans GameTDB |
| Pull requests | 19 mergées (#108 à #130), dont 1 correction après import (#130) |
| Tests | 286 unitaires (+ 45), 67 de bout en bout, 68 sur la base ; 14 migrations |
| Code applicatif | ≈ 9 800 lignes (hors tests) |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| Prévisualisations Vercel en échec sur les PR qui changent la base | Le propriétaire voyait « check failed » alors que la CI était verte : la prévisualisation lit la base de production, sans la nouvelle migration | Expliqué ; ordre de merge annoncé : migration, attendre « Déploiement du schéma », puis la PR suivante |
| Conflits après chaque merge (CLAUDE.md, README des fixtures, numéros de version) | Une résolution à chaque PR dépendante | Garder les deux côtés, `npm run check`, et mettre à jour tout de suite la PR qui en dépend |
| Installation des navigateurs e2e trop lente en CI (2 fois) | CI arrêtée avant le premier test | Cache et second essai (#125), règle ajoutée à `CLAUDE.md` |
| Lien symbolique dans libretro-thumbnails | Majora's Mask refusé à l'import N64 : le fichier choisi était un texte de 46 octets | Test qui échouait d'abord, puis noms « SymbolicLink » écartés (#130) |

Leçons ajoutées :

12. **Une PR qui change la base se teste après le merge de sa migration** : prévenir dès l'ouverture que la
    prévisualisation échouera, et donner l'ordre de merge.
13. **Une nouvelle source se vérifie sur ses fichiers réels, pas seulement sur leurs noms** : l'index libretro était
    juste, mais un nom désignait un lien et pas une image. Télécharger quelques fichiers pendant l'étude.

Pistes : boîtes japonaises N64 et GBA (nommées en japonais dans libretro), codes produit N64 et GBA, jaquettes
Switch 2 à la main ; notes Metacritic manquantes (≈ 40 % des jeux) ; profils d'autres utilisateurs pour la collection.

## 10. Étapes 15 à 17 : N64 et GBA complétées, statistiques, Game Boy Color

| | |
|---|---|
| Durée | 1 jour (19/11/2026) |
| Livré | **Codes produit et boîtes japonaises** N64 / GBA par la série No-Intro (boîtes JAP : N64 19 → 40, GBA 38 → 79) ; **page Statistiques** de l'administration (collection par console, régions, Metacritic, état du catalogue avec listes à compléter) ; **tri par note Metacritic** (« Mieux notés », groupes par tranche) ; **Game Boy Color** (45 jeux, codes DMG- / CGB-) ; éditeurs N64 / GBA corrigés |
| Pull requests | 14 mergées (#131 à #144) |
| Tests | 314 unitaires, 70 de bout en bout, 70 sur la base ; 15 migrations |
| Code applicatif | ≈ 10 600 lignes (hors tests) |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| **CI rouge sans qu'on le voie** : un test pgTAP figé, cassé par la migration 0014 | Rouge sur `main` de #127 à #142 ; le propriétaire ne pouvait plus merger | #142 ; règle ajoutée : lire **chaque** tâche avant de dire « CI verte » |
| Installation des navigateurs WebKit (miroir Ubuntu lent, verrou apt) | e2e arrêtée avant le premier test sur toutes les PR | Paquets Ubuntu en cache, second essai qui libère le verrou (#142) : e2e en ≈ 4 min |
| Fichiers de libretro qui sont des **liens Git** | Majora's Mask puis Pokémon Crystal refusés à l'import | Liens suivis au téléchargement (#144), quel que soit leur nom |
| Page en direct ≠ fixture nettoyée (`<br id>`) | Éditeurs collés (« Hudson SoftNintendo ») en production | Test sur un tableau tel que servi en direct (#140) |
| Un libellé plus long (« Note Metacritic ») | Page plus large que l'iPhone de 1 px en WebKit | Libellé court « Mieux notés » ; le test de largeur l'a vu |

Leçons ajoutées :

14. **Une fixture nettoyée peut cacher un bug** : garder au moins un test sur un morceau de page tel que la source le
    sert vraiment (attributs, liens, encodage).
15. **Vérifier le contenu d'un fichier téléchargé, pas son nom** : un nom d'image peut désigner un lien ou une page
    d'erreur ; on contrôle ce qu'on reçoit.
16. **La CI ne fait foi que si on la lit en entier** : un check rouge accepté une fois devient le bruit de fond.

Pistes : boîtes japonaises GBC (titres romanisés), codes produit GBC (No-Intro rare), Game Boy d'origine, Super
Nintendo, NES ; notes Metacritic à compléter à la main depuis la page Statistiques.

## 11. Étapes 18 à 22 : Game Boy, Virtual Boy, Super Nintendo, NES, contrôle par les bases officielles

| | |
|---|---|
| Durée | 2 jours (19 et 20/11/2026) |
| Livré | **4 consoles** par la recette Wikipédia + libretro (+ No-Intro) : Game Boy (91 jeux), Virtual Boy (11, Japon et États-Unis), Super Nintendo (98, boîtes JAP par les titres japonais de la cellule), NES (104, boîte « World » jamais pour le Japon) ; **jaquettes** : Switch 2 US / PAL de gamecartdb, boîte PAL française d'abord (Wii U, Switch), packshots PEGI officiels de Nintendo Europe ; catalogue **lu page par page au-delà de 1 000 jeux** ; note Metacritic sur la jaquette, tri « plus récents » par défaut, bascule Tous / First party des statistiques, en-tête collé et « Remonter en haut » ; **contrôle par les bases officielles** de Nintendo Europe et Japon (301 écarts) : 27 jeux ajoutés, 161 corrections avec verrou |
| Pull requests | 23 mergées (#145 à #168) |
| Tests | 350 unitaires, 71 de bout en bout, 78 sur la base ; 21 migrations |
| Code applicatif | ≈ 11 000 lignes (hors tests) |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| **Limite de 1 000 lignes** de Supabase par requête | Au-delà de 1 000 jeux (NES), le catalogue s'arrêtait net, sans erreur | Lecture page par page (#157), comme les statistiques |
| **Éditeur vide chez GameTDB** (686 cartouches Switch) | Fire Emblem: Three Houses, Pikmin 4… absents du catalogue sans qu'on le voie | Contrôle par les bases officielles (§1 terdecies), éditeur repris de Nintendo Europe et Japon (ADR-13, #167) |
| DS : identifiants en Y pris pour des démos, cartes sans région | Kirby Super Star Ultra, Layton, Pokémon Noir et Blanc absents | Démos écartées par le titre et le genre seulement (#166) |
| Une source secondaire donne **un autre éditeur que Nintendo** pour la région où Nintendo l'édite | ~20 jeux encore absents (Fire Emblem Fates, Dragon Quest Builders…) | Étude en cours : l'éditeur officiel de la région l'emporte (suite de l'ADR-13) |
| Le site officiel ne montre plus les boîtes retirées de la vente | 15 régions « téléchargement seulement » douteuses | Vérification jeu par jeu sur le web ; 5 jeux retirés, les autres gardés |
| Switch 2 absente de GameTDB | Pas de boîte US ni PAL | gamecartdb, source citée (#153) |

Leçons ajoutées :

17. **Contrôler le catalogue contre une source officielle** : des centaines d'écarts restaient invisibles tant qu'on ne
    comparait l'import qu'à lui-même ; un contrôle externe vaut mieux qu'une règle de plus.
18. **Un nombre rond est une alerte** : 1 000 jeux pile cachait une limite de lecture, pas un catalogue complet.
19. **Champ vide ≠ valeur fausse** : traiter séparément « la source ne sait pas » et « la source dit autre chose »,
    et décider qui l'emporte, région par région.

Pistes : éditeur officiel par région (étape 22, en cours), jaquettes manquantes (≈ 67, Switch 2 JAP surtout), jeux
Wii et DS absents à ajouter à la main (Nintendo n'en donne pas le code produit), Nintendo US comme troisième source.

## 12. Fin de l'étape 22, étapes 23 à 27 : séries, frise, collectionneurs invités

| | |
|---|---|
| Durée | 3 jours (20 au 22/11/2026) |
| Livré | **Fin de l'étape 22** : éditeur officiel par région (ADR-14), jaquettes manquantes, 5 jeux retirés, boîtes PAL sans USK ; **outillage de la session Claude** : `npm run session` et `npm run relais` (scripts sur la production depuis la session), skills `script-prod` et `steward`, `npm run check` lancé avant chaque commit ; **séries** (titre + Wikidata, ADR-15) : 754 jeux sur 1 126 et filtre Série ; **frise**, 3e vue du catalogue ; **étude Giant Bomb** (refusée : 403) ; **collectionneurs invités** (ADR-16) : rôle propriétaire en base, invitations par lien à partager, page Bienvenue, Mon profil (12 avatars dessinés pour le site, collection, derniers ajouts), badges calculés, profil public |
| Pull requests | 28 mergées (#169 à #196), dont 8 pour l'étape 27 (#189 à #196) |
| Tests | 428 unitaires, 81 de bout en bout (Chromium et WebKit), 110 sur la base ; 26 migrations |
| Code applicatif | ≈ 14 000 lignes (hors tests) |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| **Tout compte connecté pouvait écrire le catalogue** (« connecté » voulait dire « propriétaire ») | Inviter des amis leur aurait ouvert l'administration par l'API | Rôle en base et règles d'écriture réservées au propriétaire, **avant** toute invitation (#190) |
| Lien d'invitation gardé seulement par son empreinte | « Copier à nouveau le lien » impossible | « Nouveau lien » (SPEC v1.40) : l'ancien cesse de marcher |
| Clé secrète absente de Vercel | Liste des collectionneurs illisible | Message lisible au lieu d'une page cassée ; variable ajoutée par le propriétaire |
| Giant Bomb refuse l'accès (403), depuis la session comme depuis GitHub | Étude rétro impossible | Abandon sans contournement ; ScreenScraper en attente d'identifiants |
| Wikipédia et Wikidata limitent l'adresse partagée de la session (429) | Remplissage des séries interrompu | Pages publiques de Wikidata, une requête par seconde, réessais |
| **4 bugs trouvés par la CI avant le merge** | — | Types générés (`Args`), panneau « Modifier » refermé après l'envoi, comparaison du pseudo sensible à la casse dans une fonction `security definer`, redirection mal formée sous WebKit depuis une page en cache |
| PR de l'étape 27 au-delà de 300 lignes | Relecture plus longue sur l'iPhone | Coupées en deux (2a/2b, 3a/3b) ; restées ≈ 400 lignes, tests compris |

Leçons ajoutées :

20. **Revoir ce que « connecté » autorise avant d'ouvrir des comptes** : une règle juste pour un seul utilisateur
    devient une faille dès le deuxième.
21. **Une fonction `security definer` à `search_path` vide ne voit pas les opérateurs des extensions** (citext) :
    écrire le test du cas limite (la casse) en même temps que la fonction.
22. **Tester sur WebKit paie** : le bug de redirection n'existait que sous Safari, le navigateur du propriétaire.
23. **Outiller la session** (skills, contrôle avant commit) rend les PR régulières : lien de prévisualisation,
    4 tâches de CI lues, migration vérifiée en production après chaque merge.

Pistes : audit de performance avec la skill `react-best-practices` de Vercel (Mon profil et les statistiques relisent
tout le catalogue à chaque ouverture) ; liste des jeux du profil public repliable ; cas « adresse e-mail déjà utilisée »
à tester ; prix eBay (étape 25) et ScreenScraper (étape 26) dès que les comptes sont prêts.

## 13. Audit de performance (skill `react-best-practices` de Vercel)

| | |
|---|---|
| Durée | 1 jour (22/11/2026) |
| Méthode | Skill copiée dans le dépôt (#198), rapport sans code, puis **4 corrections choisies par le propriétaire** (A à D), une PR chacune, chaque gain **mesuré avant et après** |
| Livré | **A** page plus légère : chemin de jaquette au lieu de 3 adresses complètes, Supabase chargé seulement avec une session (#199) ; **B** recherche fluide : `useDeferredValue`, liste mémorisée (`ListeJeux`), texte de recherche préparé une fois par jeu (#200) ; **C** 60 premiers jeux puis lots de 60 au défilement, retour d'une fiche à la même hauteur (SPEC v1.41, #201) ; **D** Mon profil et Statistiques : catalogue en cache 5 min vidé par chaque modification, lectures en parallèle (DESIGN v1.25, ADR-11, #203) |
| Pull requests | 6 mergées (#198 à #204, hors #202), dont 1 de documentation (#204) |
| Tests | 441 unitaires (+13), e2e et base inchangés ; aucune migration |

| Mesure | Avant | Après |
|---|---|---|
| HTML de l'accueil, brut | 4 059 115 o | 1 110 613 o (**−73 %**) |
| HTML de l'accueil, compressé | 273 Ko | 151 Ko |
| JS d'un visiteur, compressé | 264 Ko | 195 Ko |
| Cartes dessinées à l'ouverture | 1 126 | 60 |
| Pire délai en tapant « mario » (Chromium, processeur ×4) | 380 – 640 ms | 40 – 140 ms |
| Lecture du catalogue (Mon profil, Statistiques) | 1,3 – 1,8 s à chaque ouverture | ≈ 0,6 s cache vide, rien pendant 5 min |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| Prévisualisations Vercel injoignables depuis la session | Impossible d'y mesurer | Build de production local **sur la vraie base** (lecture seule, clé injectée par le réseau), Playwright avec processeur ralenti ×4 |
| `useDeferredValue` seul : **aucun gain mesuré** | Le plan validé ne suffisait pas | Liste sortie dans un composant mémorisé (`ListeJeux`), signalé comme changement de plan dans la PR |
| Une propriété `estompe` passée au composant mémorisé | Les cartes redessinées à chaque lettre malgré `memo` | Estompage sur une enveloppe hors du composant ; trouvé en décomposant chaque interaction (Event Timing) |
| `lireFiltres()` recréait l'objet à chaque lettre (clé = toute l'adresse, `?q=` compris) | Mémorisation annulée | Même objet gardé quand les filtres ne changent pas (`memesFiltres`) |
| Lots de 60 et bouton « Précédent » | Une hauteur notée plus bas que la page redessinée | Nombre de jeux dessinés noté avec la hauteur, redessinés avant de défiler |
| Prettier lancé trop large (3 fois) | SPEC entière reformatée, diff gonflé | Règle ajoutée dans CLAUDE.md (#204) |
| Deux PR ouvertes en même temps prennent la même version de DESIGN (v1.24) | Conflit sur #203 | Merge de `main` dans la branche, version suivante (v1.25) |
| Mesure de la production juste après un merge | Ancienne page encore servie | Attendre le déploiement et vérifier le contenu (nombre de cartes), pas seulement la taille |

Leçons ajoutées :

24. **Mesurer chaque correction, avant et après, dans les conditions du téléphone** : la première version de B ne
    gagnait rien, et seule la mesure l'a montré.
25. **Une optimisation React se vérifie au niveau de l'interaction** (temps de traitement, rendu) : une seule
    propriété qui change suffit à annuler un `memo`.
26. **Un cache n'est acceptable que s'il est vidé par chaque écriture** : l'ADR le dit, et la seule exception (scripts
    de la session) est écrite noir sur blanc.
27. **Un rapport sans code, puis des corrections au choix** : le propriétaire décide de ce qui vaut la complexité
    ajoutée (le bouton « Afficher plus » a été refusé au profit du chargement automatique seul).

Pistes : mesurer Mon profil et Statistiques connecté sur Vercel (non vérifié depuis la session) ; ressenti sur Safari
iPhone (retour par « Précédent », chargement au défilement) ; mémoriser chaque carte si les lots ralentissent après
plusieurs centaines de jeux.

## 14. Étape 25 : prix eBay

| | |
|---|---|
| Durée | une demi-journée (22/11/2026), dès l'arrivée des clés développeur eBay |
| Méthode | Étude en lecture seule par une tâche GitHub (#207), puis spec, conception et maquette validées (#208), puis 3 PR de code : calculs purs (#210), route (#211), bloc de la fiche (#212) |
| Livré | US-25 : sur chaque fiche, le **prix demandé** (médiane des annonces en cours) par version, en euros, avec le nombre d'annonces et un lien vers les **objets vendus** d'eBay ; JAP et US sur eBay US, PAL sur eBay France et Royaume-Uni ; gardé 6 h, rien en base ; bloc masqué si eBay ne répond pas |
| Pull requests | 5 mergées (#207, #208, #210, #211, #212), dont 1 de documents |
| Tests | 477 unitaires (+36), 4 e2e (route interceptée) ; aucune migration |

| Mesure (étude, 28 jeux, 94 versions × marché) | Résultat |
|---|---|
| Accès aux annonces en cours (Browse) | ouvert |
| Accès aux ventes terminées (Marketplace Insights) | refusé : demande à faire par le propriétaire |
| Versions avec un prix | 92 / 94 |
| Annonces pertinentes | US 69 %, JAP 32 %, PAL France 80 %, PAL Royaume-Uni 70 % |
| Premier vrai appel (Super Mario Galaxy, prévisualisation) | JAP 13 €, US 17 €, PAL 12 € ; 12, 41 et 50 annonces |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| developer.ebay.com et l'API d'eBay injoignables depuis la session | Ni documentation ni essai en direct | Étude par une tâche GitHub ; premier essai réel sur la prévisualisation, par le propriétaire |
| Premier lancement : `401 invalid_client` | Étude arrêtée net | Clés de production activées et secrets corrigés par le propriétaire ; message d'erreur clair dans le script |
| Contrat d'eBay : données de Browse gardées 6 h au plus (forum des développeurs, texte officiel non lu) | Plan « mise à jour chaque semaine en base » abandonné | Prix demandé à l'ouverture de la fiche, gardé 6 h par jeu, rien en base (ADR-17) |
| Règles du script d'étude reprises telles quelles | « Galaxy 2 » comptait pour « Galaxy », un jeu complet « avec manuel » était écarté | Trouvé par les tests de la PR 1 ; règles corrigées avant toute mise en ligne |
| `RouteContext` de Next 16 inconnu du contrôle de types (types générés au build) | Typecheck rouge | Type des paramètres écrit à la main |
| Abonnement à la mauvaise PR (#209 au lieu de #210) | Événements d'une PR qui n'était pas la mienne | Désabonnement aussitôt ; toujours reprendre le numéro renvoyé par la création |

Leçons ajoutées :

28. **Lire le contrat d'une API avant de concevoir le stockage** : la limite de 6 h a changé toute l'architecture, et
    elle est arrivée après les choix produit.
29. **Un script d'étude n'est pas du code de production** : ses règles se reprennent avec des tests, qui ont trouvé
    deux défauts dès la première PR.
30. **Quand la session ne joint pas un service, le premier essai réel est confié au propriétaire** avec une adresse
    exacte et le résultat attendu, avant le merge (`/api/prix/wii/super-mario-galaxy`).

Pistes : obtenir l'accès aux ventes terminées (même route, libellé « prix de vente », ADR-17 point 8) ; suivre la
consommation du quota de 5 000 appels par jour ; version JAP plus fiable (peu d'annonces sur eBay US) ; prix
« complet » et « jeu seul » séparés si les annonces le précisent plus souvent.

## 15. Étape 28 : captures RAWG

| | |
|---|---|
| Durée | une journée (22 et 23/11/2026) |
| Méthode | Choix du propriétaire par questions (liens RAWG, import une fois, carrousel de 6), documents et maquette (#218), étude en lecture seule (#220, #221), migration (#222), relais et écriture après planche (#223, #224), carrousel (#228) |
| Livré | US-26 : sur la fiche, un carrousel de 6 captures au plus, image en grand au toucher, lien actif vers RAWG ; **804 jeux** sur 1 090 cherchés (Virtual Boy et Switch 2 absents de RAWG) ; images servies par RAWG, rien de copié |
| Pull requests | 10 mergées (#218, #220 à #225, #227, #228), dont 3 de documents et 2 corrections de migration |
| Tests | 496 unitaires (+19), 12 pgTAP de plus, 4 e2e (images interceptées, captures de test dans la base jetable) |

| Mesure | Résultat |
|---|---|
| Étude (56 jeux) | 81 % au titre identique, 92 % avec « (année) », « (console) » et « The » ignorés, aucun faux rapprochement accepté |
| Relais (1 090 jeux, 2 045 appels, 26 min) | 854 trouvés, 818 avec captures |
| Planche | 103 « ≈ » regardés, 14 refusés (Golf, Tetris, Space Invaders… : autres versions que Nintendo) |
| Image réduite par RAWG | 31 Ko au lieu de 103 Ko |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| Clé RAWG dans l'adresse (`?key=`), que le formulaire de clés de la session ne sait pas remplir | Étude et relais impossibles depuis la session | Clé en secret GitHub, études et relais en tâches GitHub (ADR-18 point 1) |
| Bucket `gametdb` limité au XML et au JPEG | 1er relais arrêté au premier dépôt | Migration 0029 (test d'abord) ; aucun test ne déposait de JSON |
| Slug RAWG `kirby_squeak_squad` refusé par la contrainte de 0028 | Écriture arrêtée sur un jeu, 4 captures sans lien | Jeu écarté, les autres écrits ; migration 0030, puis jeu réécrit |
| Fiches RAWG « (1984) » regroupant plusieurs machines | Captures Atari ou arcade pour Golf, Tetris… | Planche des cas douteux avec 3 captures chacun ; 14 refusés |
| Image cassée avant l'hydratation (fiche préparée à l'avance) | `onError` jamais appelé, image cassée laissée | Trouvé par le test e2e ; contrôle `complete` et `naturalWidth` à l'arrivée |
| Mauvaise explication du premier échec e2e (« image hors écran ») | Un aller-retour de CI pour rien | Ne pousser une explication qu'après l'avoir vérifiée en local |
| Abonnement à la mauvaise PR, 2 fois encore (#219, #226) | Événements de PR étrangères | Règle ajoutée dans CLAUDE.md |
| Adresses de prévisualisation Vercel injoignables depuis la session | Rendu non vu sur la PR | Site lancé en local sur la base de production, en lecture seule |

Leçons ajoutées :

31. **Une règle de rapprochement se juge sur des images, pas sur des titres** : le titre « Tetris (1984) » était
    juste, les captures non ; la planche des cas douteux a évité 14 fausses fiches.
32. **Les contraintes de la base se testent avec les vraies données avant la migration** : deux migrations de
    correction (types du bucket, tiret bas) auraient été évitées par un passage à blanc sur le résultat du relais.
33. **Un test rouge se croit avant l'explication** : le test de l'image cassée avait raison deux fois de suite.

Pistes : refaire le relais pour les jeux ajoutés ensuite (`tous` à non : seuls les nouveaux) ; captures choisies à la
main dans l'administration si besoin ; Switch 2 quand RAWG l'aura.

## 16. Étape 29 : guides japonais (攻略本)

| | |
|---|---|
| Durée | trois jours (23 au 25/11/2026) |
| Méthode | Intention v1.6 puis v1.7 (3DS et Switch d'abord, guides seulement), 5 études en lecture seule (#238 à #244), SPEC US-27 + US-28 et maquettes (#245), ADR-19 et plan (#246), migration 0031 (#247), script et planche (#248 à #251), page du guide (#252, #254), fiche (#256), catalogue (#259, #261, #262), remplissage par planche validée |
| Livré | US-27 : guides dans le catalogue (coche « Guides »), page de chaque guide (couverture, jeux couverts, liens Amazon Japon et Suruga-ya), bloc « Guides » de la fiche ; US-28 : recherche NDL, planche numérotée, écriture des guides gardés et des numéros écartés |
| Pull requests | 20 mergées (#236 à #262, #273), dont 5 d'études, 3 de documents et 3 corrections du script |
| Tests | 563 unitaires, 18 pgTAP (`guides.test.sql`), 9 e2e (`guides.spec.ts`, guides de test dans la base jetable) |

| Mesure | Résultat |
|---|---|
| 3DS | 103 livres trouvés, 11 écartés sur la planche, **92 guides** pour 51 jeux |
| Switch | 76 livres trouvés, 8 écartés (livres-jeux, énigmes, jeu de rôle sur table, artbooks), **68 guides** pour 43 jeux |
| Total | **159 guides** (un guide commun aux deux consoles : Fire Emblem Warriors), 181 liens guide ↔ jeu |
| Couvertures Google Books | 114 sur 159 (72 % ; l'étude annonçait 26 sur 39) |
| Recherche NDL | un appel toutes les 6 s, refus 429 attendus ; environ 2 h par console |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| NDL refuse les appels rapprochés (429) | Recherche de plusieurs heures, coupée à 2 h par la session | Un appel toutes les 6 s, réponses gardées sur disque, reprise par la même commande (#250) |
| Livres qui ne sont pas des guides (artbooks, livres-jeux, encyclopédies) | Faux guides possibles | Règle `estGuide` + planche regardée par le propriétaire ; numéros écartés gardés dans `guides_exclus` (#251) |
| `--ecrire` relisait le premier `guides-*.json` du dossier | Numéros Switch appliqués à la 3DS le 25/11 (8 guides marqués écartés, 11 écartés réécrits) | Réparé aussitôt en base ; `--console` exigé et vérifié contre le fichier, test d'abord (#273) |
| Tests e2e d'administration instables (clic avant l'hydratation) | 3 CI sur 4 avec un premier essai rouge | Attente de l'hydratation avant de remplir le formulaire (#267) |

Leçons ajoutées :

34. **Un script qui écrit choisit sa cible par un argument, jamais par « le premier fichier trouvé »** : deux planches
    dans un même dossier ont suffi à écrire sur la mauvaise console.
35. **Relire le message de fin d'un script d'écriture avant la suite** : « 3ds : 95 guides écrits » au lieu de
    « switch : 68 » a permis de réparer en quelques minutes.
36. **Une source lente se travaille par tranches reprises** : cache disque + même commande relancée, plutôt qu'une
    seule longue course.

Pistes : autres consoles (Wii U, DS, Wii…) avec le même script ; guides à venir sur la bande « À venir » (étape 31) ;
couvertures manquantes (45) cherchées ailleurs si besoin.

## 17. Couvertures Amazon Japon des guides (reprise de l'étape 29)

| | |
|---|---|
| Durée | une journée (26/11/2026) |
| Méthode | Étude en lecture seule (Amazon par ISBN 10, une requête par seconde), planche, décisions par questions à choix, documents (#281), migration 0035 (#282), script (#285), affichage (#286), écriture après planche validée |
| Livré | US-27 révisée (SPEC v1.52, ADR-19 point 2) : couverture Amazon copiée dans le bucket public `guides`, mention « Couverture : Amazon.co.jp », Google Books en secours |
| Pull requests | 4 mergées (#281, #282, #285, #286) |
| Tests | 11 unitaires (`amazon.test.ts`, `couverture.test.ts`) et tests existants adaptés, 9 pgTAP (`couvertures_guides.test.sql`), e2e « À propos » mis à jour |

| Mesure | Résultat |
|---|---|
| Guides sans couverture Google Books | 45 → **0** |
| Couvertures Amazon trouvées | **159 sur 159** (≈ 350 × 500, contre 300 × 427 chez Google pour le même visuel) |
| Couvertures copiées | 159 WebP dans le bucket `guides`, aucune écartée sur la planche |

| Difficulté | Conséquence | Parade retenue |
|---|---|---|
| L'affichage lisait une colonne pas encore en production | Prévisualisation Vercel et e2e rouges sur #286 jusqu'au merge de #282 | Ordre de merge annoncé dans chaque PR ; `main` intégré après la migration |
| Plusieurs sessions modifient CLAUDE.md (arborescence) en même temps | 6 conflits à résoudre sur #281, #285 et #286 | Intégrer `main` juste avant chaque merge ; ne pas réécrire une ligne d'une autre PR |
| Nom de branche trop long | Lien de prévisualisation donné faux (Vercel le raccourcit avec une empreinte) | Prendre le lien dans le commentaire de vercel[bot] quand le nom dépasse ~45 caractères |
| Réseau de la session fermé à vercel.app | Affichage final vérifié seulement sur l'iPhone du propriétaire | Images vérifiées dans le bucket depuis la session, avant le merge |

Leçons ajoutées :

37. **Une PR d'affichage qui lit une nouvelle colonne dépend du merge de la migration** : le dire dans la PR et ne
    pas attendre une CI verte avant que la migration soit sur `main`.
38. **Comparer la source de secours sur les données déjà là** : l'étude des 45 manquantes a montré qu'Amazon faisait
    mieux aussi pour les 114 autres.
39. **Une condition d'usage douteuse se décide par écrit** : le risque (images Amazon hors programme Partenaires) est
    dans ADR-19 avec la marche arrière, pas seulement dans une conversation.

