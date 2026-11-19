# Spécifications — Nintendo DB

> Étape 2 du playbook : **quoi construire**, pas comment (les choix techniques vont dans `docs/DESIGN.md`).
> Source : `intent/intent.md` v1.0.
>
> Version 1.15 — 19/11/2026 — statut : **à valider**
>
> | Version | Date | Changements |
> |---|---|---|
> | 1.15 | 19/11/2026 | US-09 : **icône de compte** en haut des pages publiques, à la place du lien « Administration » du pied de page ; Catalogue et À propos en icônes (demande du propriétaire) |
> | 1.14 | 19/11/2026 | **Ma collection** (étape 12) : US-16, versions régionales possédées, privée, propriétaire seul |
> | 1.13 | 18/11/2026 | **GameCube** (étape 11) : US-10 (disques du commerce, compilations Zelda Collector's Edition et Pac-Man Vs., petite image japonaise faute de scan) |
> | 1.12 | 18/11/2026 | US-06 : filtre **Développeur** (#89), divisions de Nintendo distinctes et entrée « Nintendo (first party) » |
> | 1.11 | 18/11/2026 | **Switch et Switch 2** (étape 10) : US-10 (cartouche mondiale, Switch 2 depuis Wikipédia, case « en boîte », jeux à venir cachés) ; **import des nouveautés** (US-10) |
> | 1.10 | 18/11/2026 | **DS et 3DS** (étape 9) : US-10 (règles des cartes, titres PAL anglais, scans de repli) ; jaquettes aux **proportions de chaque console** (US-02, US-04) |
> | 1.9 | 17/11/2026 | **Wii** (étape 8) : US-01 = un seul catalogue toutes consoles, filtre **Console** (US-06) ; US-10 : import Wii depuis **GameTDB seul**, jaquettes = face avant du scan complet |
> | 1.8 | 17/11/2026 | Référencement précisé (étape 7) : plan du site, robots sans l'administration, adresses canoniques, aperçu de partage avec la jaquette, données structurées |
> | 1.7 | 17/11/2026 | US-06 : filtre « sorti dans la région affichée » retiré (doublon du marché) ; genres = ceux de GameTDB, **tous traduits** en français |
> | 1.6 | 17/11/2026 | US-10 : **IGDB retiré** (#58), GameTDB donne aussi les titres japonais ; sans scan → vignette neutre |
> | 1.5 | 17/11/2026 | US-09 : lien discret « Administration » en pied de page (demande du propriétaire) |
> | 1.4 | 17/11/2026 | US-08 avancée, US-15 logo ; US-10 : **boîte Nintendo exigée**, sortie par région = en boîte dans la région, compilations ; jaquettes = **scans de boîtes** (GameTDB en priorité) et codes produit importés ; US-12 : page « Jaquettes » |
> | 1.3 | 16/11/2026 | Retour sur les maquettes (PR #3) : trame de gamecartdb ; région choisie **sur la fiche** (US-04) ; catalogue filtré par **marché** (US-03) ; recherche **dans le catalogue** (US-05) |
> | 1.2 | 16/11/2026 | **v1 = Wii U seule** ; US-01 en S ; US-10 depuis Wikipédia + IGDB ; US-12 : jaquettes copiées chez nous |
> | 1.1 | 16/11/2026 | US-12 : jaquette = **lien vers une image externe** (pas de copie, pas de photo en v1) |
> | 1.0 | 16/11/2026 | Validée (PR #1) |
> | 0.2 | 16/11/2026 | Questions 1 à 3 tranchées : titre JAP double, PAL par défaut, code produit complété à la main |
> | 0.1 | 16/11/2026 | Premier brouillon |

## 1. Contexte et objectif

Site public de référence des **jeux physiques édités par Nintendo**, sur **toutes les consoles Nintendo**
(**v1 : Wii U seule**, ≈ 50 jeux ; les autres consoles suivront avec la même structure),
avec une bascule **JAP / US / PAL** qui change le titre, la date, le code produit et la jaquette affichés.
Rendu dans l'esprit de gamecartdb.com, en français, pensé d'abord pour l'iPhone.

## 2. Utilisateurs et contexte d'usage

| Élément | Décision |
|---|---|
| Visiteurs | Tout le monde, **sans compte**, en lecture seule |
| Administrateur | Le propriétaire, seul à pouvoir modifier (compte créé à la main) |
| Appareil principal | iPhone 12 mini (375 × 812), Safari iOS ; utilisable aussi sur ordinateur |
| Langue | Interface en français ; titres des jeux tels que publiés dans chaque région ; titre JAP en **japonais + romanisé** en dessous |

## 3. Vocabulaire

- **Console** : Game & Watch, NES, Super Nintendo, Switch 2… (liste complète en §6).
- **Jeu** : une œuvre (ex. *Super Mario 64*) sur une console donnée.
- **Sortie** : la version d'un jeu dans une région (JAP, US ou PAL) : titre, date, code produit, jaquette.
- **Région affichée** : la région choisie avec le sélecteur ; elle s'applique à tout le site.

## 4. User stories et critères d'acceptation

Priorités : **M** = indispensable (v1), **S** = souhaitable, **C** = bonus.

### Consultation (visiteurs)

#### US-01 — Toutes les consoles dans un seul catalogue (S — dès la 2ᵉ console, SPEC v1.9)
*En tant que visiteur, je parcours les jeux de toutes les consoles au même endroit, et je n'en garde qu'une si je veux.*
- [ ] L'accueil **est** le catalogue de **toutes les consoles** (US-02) ; « Tous les jeux » compte les jeux de toutes.
- [ ] Chaque vignette (grille et liste) indique sa **console**.
- [ ] Le panneau Filtres (US-06) propose **Console** : « Toutes » (par défaut) puis les consoles par ordre
      chronologique, avec leur nombre de jeux ; le choix est gardé dans l'adresse (`?console=wii`).
- [ ] La fiche d'un jeu garde son adresse `/jeux/{console}/{jeu}` ; « Retour au catalogue » ramène à l'accueil.

#### US-02 — Parcourir le catalogue d'une console (M)
*En tant que visiteur, je parcours les jeux Nintendo d'une console, présentés comme sur gamecartdb.*
- [ ] En tête de page : le nom du site, un menu (Catalogue, À propos) et une phrase de présentation.
- [ ] Section « Tous les jeux » avec le **nombre total**, puis la barre d'outils : recherche (US-05), marché (US-03),
      tri, grille / liste, filtres (US-06), et « N jeux affichés sur M ».
- [ ] Les jeux s'affichent en **grille de jaquettes** (2 par ligne sur iPhone) ou en **liste** ; le dernier choix est retenu.
- [ ] Chaque jeu montre jaquette, titre, date et sa **disponibilité par région** (JAP · US · PAL, cochées si sorti).
- [ ] Tri : plus anciens d'abord (par défaut), plus récents d'abord, A → Z ; regroupement **par année** en tri par date.
- [ ] La page reste fluide avec 300 jeux (images chargées au fil du défilement).

#### US-03 — Filtrer le catalogue par marché (M)
*En tant que visiteur, je ne vois que les jeux sortis sur un marché, dans la version de ce marché.*
- [ ] Choix du marché : **Tous** (par défaut), **Europe**, **Amérique du Nord**, **Japon**.
- [ ] Avec un marché choisi : seuls les jeux sortis sur ce marché sont listés, avec **le titre, la date et la
      jaquette de ce marché**, sans recharger la page.
- [ ] Avec « Tous » : titre, date et jaquette **PAL**, sinon US, sinon JAP pour un jeu non sorti en Europe.
- [ ] Le marché choisi est conservé à la visite suivante.

#### US-04 — Voir la fiche d'un jeu (M)
*En tant que visiteur, j'ouvre un jeu et je bascule entre ses versions JAP / US / PAL.*
- [ ] Sous la jaquette, un sélecteur **JAP / US / PAL** change la **jaquette**, le titre, la date et le code produit
      affichés ; une région où le jeu n'est pas sorti est désactivée (« non sorti »).
- [ ] La région ouverte par défaut est celle du marché choisi dans le catalogue, sinon PAL.
- [ ] Un bloc **Disponibilité** liste les 3 régions : coché ou non, date, titre s'il diffère.
- [ ] Sont aussi affichés : console, éditeur, développeur, franchise, genre (si connus), lien « Retour au catalogue ».
- [ ] La **source** des données est citée (lien vers la fiche d'origine).
- [ ] Une donnée inconnue s'affiche « — », jamais vide ni inventée (fréquent pour le code produit au début, complété via US-11).
- [ ] La fiche a une adresse stable que l'on peut partager.

#### US-05 — Rechercher un jeu (M)
*En tant que visiteur, je trouve un jeu en tapant une partie de son titre, directement dans le catalogue.*
- [ ] Le champ de recherche est **dans la barre d'outils du catalogue** ; la liste se filtre **au fil de la frappe**.
- [ ] La recherche porte sur les titres des **3 régions**, l'éditeur et le développeur.
- [ ] Elle ignore majuscules, accents et ponctuation (« pokemon » trouve « Pokémon »).
- [ ] Aucun résultat → message clair et bouton pour effacer la recherche.

#### US-06 — Filtrer le catalogue (S)
- [ ] Filtres combinables : **console** (US-01), disponibilité (sorti dans les 3 régions / exclusif à une région :
      JAP, US ou PAL), année, genre. Le marché (US-03) filtre déjà sur « sorti dans cette région ».
- [ ] Les genres sont ceux de GameTDB, **tous traduits** en français ; un jeu peut en avoir plusieurs.
- [ ] Les filtres actifs sont visibles et effaçables en un tap.
- [ ] **Développeur** (SPEC v1.12, #89) : liste comme Genre, studios triés par nombre de jeux, avec ce nombre. Noms
      nettoyés à l'affichage, sans réimport (« LEVEL-5 », « Level 5 » → « Level-5 » ; « Inc. », « Ltd. » retirés) ;
      un jeu à plusieurs studios apparaît sous chacun. Les divisions de Nintendo (EAD, EPD, SPD…) restent distinctes,
      et une entrée **« Nintendo (first party) »** en tête regroupe les divisions et les filiales détenues par
      Nintendo (Retro Studios, Monolith Soft, NST, NDcube, 1-Up Studio, Next Level Games) ; HAL Laboratory,
      Intelligent Systems et Game Freak n'en font pas partie.

#### US-07 — Mentions et sources (M)
- [ ] Une page « À propos » indique que le site est un projet de fan **non affilié à Nintendo**, que les titres et
      visuels appartiennent à leurs propriétaires, et liste les sources de données avec leur licence.

#### US-08 — Thème clair / sombre (S, avancée à l'étape 5)
- [ ] Le site suit le réglage de l'iPhone ; un bouton permet de forcer clair ou sombre.
- [ ] Le choix forcé est retenu d'une visite à l'autre ; aucun éclair blanc au chargement en mode sombre.

#### US-15 — Logo du site (S)
- [ ] Un petit logo **cartouche** (grise, étiquette bleue « DB », sans texte ni logo Nintendo) figure dans l'en-tête,
      lisible en clair comme en sombre.
- [ ] Il sert d'icône d'onglet et d'icône d'écran d'accueil iPhone.

### Collection (propriétaire connecté)

#### US-16 — Cocher les versions que je possède (M, SPEC v1.14)
*En tant que propriétaire connecté, je note les versions régionales de mes jeux pour savoir ce qui me manque.*
- [ ] Sur la fiche d'un jeu, chaque région **sortie** (JAP, US, PAL) a une case « Je l'ai » ; un tap coche ou décoche,
      immédiatement enregistré. Une région non sortie n'a pas de case.
- [ ] Sur le catalogue, une vignette dont la version affichée est possédée porte une **coche verte**.
- [ ] Filtre **Collection** dans le panneau : Tous / Possédés / Manquants, selon la version du marché affiché (marché
      « Tous » : au moins une version possédée).
- [ ] Un **compteur par console** (« GameCube : 12 / 58 ») en tête du panneau Filtres.
- [ ] La collection est **privée** : un visiteur ne voit ni case, ni coche, ni filtre, ni compteur, et ne peut ni lire
      ni modifier la collection, même en appelant directement le serveur. Les pages publiques restent préparées à
      l'avance ; la collection s'ajoute dans le navigateur une fois connecté.
- [ ] Supprimer un jeu (US-11) retire aussi ses versions de la collection.

### Administration (propriétaire)

#### US-09 — Se connecter (M)
- [ ] Une page de connexion (e-mail + mot de passe), atteinte par l'**icône de compte** en haut de chaque page
      publique (v1.15, remplace le lien « Administration » du pied de page, retiré) : non connecté, elle ouvre la
      connexion ; connecté, elle est pleine et colorée et ouvre directement l'administration (le propriétaire est
      le seul compte ; des profils utilisateurs viendront plus tard). Pour lui faire place sur 375 px, « Catalogue »
      et « À propos » deviennent des **icônes** (nommées pour les lecteurs d'écran, page courante en couleur).
- [ ] Les fonctions de modification n'apparaissent qu'une fois connecté ; un visiteur ne peut rien modifier,
      même en appelant directement le serveur.
- [ ] Un bouton permet de se déconnecter.

#### US-10 — Importer les jeux d'une console depuis Wikipédia et GameTDB (M ; Wii : GameTDB seul)
*En tant que propriétaire, je remplis le catalogue d'une console sans tout saisir à la main.*
- [ ] Je choisis une console et lance l'import ; un **aperçu** montre les jeux trouvés avant d'enregistrer.
- [ ] Ne sont retenus que les jeux ayant **au moins une boîte éditée par Nintendo** (disque en boîte ; une boîte
      ne contenant qu'un code de téléchargement ne compte pas).
- [ ] Une région n'est affichée comme « sortie » que si le jeu y est sorti **en boîte** ; une sortie seulement en
      téléchargement compte comme non sortie.
- [ ] Un jeu vendu en boîte seulement dans une **compilation** (ex. NES Remix + NES Remix 2 → « NES Remix Pack »)
      a une fiche pour la compilation, pas pour chaque jeu.
- [ ] Un nouvel import **n'écrase pas** mes corrections manuelles ; il signale les différences.
- [ ] Un résumé indique : ajoutés, mis à jour, ignorés (avec la raison).
- [ ] Chaque jeu importé garde le lien vers sa fiche d'origine (Wikipédia).
- [ ] Le titre japonais (en japonais, avec sa forme romanisée) vient de GameTDB.
- [ ] Les **jaquettes de chaque région** sont récupérées et copiées chez nous : en priorité le **scan de la vraie
      boîte** (GameTDB) ; une région sans scan garde une vignette neutre, signalée dans le résumé.
- [ ] Le **code produit** de chaque région est importé quand la source le connaît (ex. `WUP-P-ALZP`).
- [ ] **Wii** (SPEC v1.9) : liste, titres par région, dates, développeurs, genres et titres japonais viennent de
      **GameTDB seul** (disques du commerce, identifiant en R ou S) ; la fiche cite GameTDB comme source. Même règle
      qu'en Wii U : au moins une boîte éditée par Nintendo, toutes les régions sorties en boîte listées. Un disque qui
      n'est pas un jeu (genre GameTDB « software », ex. Wii Startup Disc, #90) est écarté.
- [ ] Wii : code produit `RVL-` + 4 caractères (ex. `RVL-RMCP`) ; le suffixe de pays imprimé sur la boîte (`-UKV`,
      `-USA`…) n'est pas connu de la source, il se complète à la main.
- [ ] Wii : la jaquette est la **face avant** découpée dans le scan complet de la boîte (≈ 485 px de large, aucune
      source ouverte ne fait mieux) ; une photo (US-12) peut la remplacer.
- [ ] **DS et 3DS** (SPEC v1.10) : GameTDB seul, comme la Wii. Cartes du commerce seulement : ni démos, bornes ou
      téléchargements (DS : identifiants en Y, titres « (Demo) », « Download », « Kiosk »), ni logiciels (genre
      « software »), ni jeux Super Nintendo ou eShop de la 3DS (seuls les identifiants en A, B, C, E sont gardés).
- [ ] DS et 3DS : en Europe, le titre est celui de la carte anglaise quand il y en a plusieurs (pas « Professor Layton
      und… ») ; codes produit `NTR-` (DS), `CTR-P-` (3DS), `KTR-P-` (New 3DS).
- [ ] DS et 3DS : jaquette = scan de la face (haute définition, sinon scan moyen de 400 px si c'est tout ce qui existe).
- [ ] Les jaquettes gardent les **proportions de la boîte de leur console** : presque carrées pour DS et 3DS, en
      hauteur pour Wii et Wii U (vignettes, fiche, page « Jaquettes »).
- [ ] **Switch** (SPEC v1.11) : GameTDB seul. Une cartouche « ALL » (mondiale) vaut sortie dans les 3 régions, avec
      la **même date et le même code produit** (`HAC-P-` + identifiant, ex. `HAC-P-AAAAA`) ; une cartouche propre à une
      région la remplace dans cette région. Cartouches seulement chinoises ou coréennes ignorées ; packs et éditions
      spéciales (identifiant terminé par un chiffre) écartés ; une réédition avec extension (« + … Expansion ») cède
      la place à la cartouche d'origine.
- [ ] Switch : jaquette **propre à chaque région** : US (scan US), PAL (scan EN, sinon FR), JAP (scan japonais,
      352 × 570 px, le plus grand qui existe) ; proportions de la boîte Switch (en hauteur, ≈ 0,62).
- [ ] **Switch 2** (SPEC v1.11) : GameTDB n'a pas de base. Liste Wikipédia « List of Nintendo Switch 2 games » :
      jeux dont l'éditeur contient Nintendo ; titre, développeur et **une date commune aux 3 régions** ; pas de code
      produit ni de jaquette (vignette neutre, **photo ajoutée à la main**, US-12).
- [ ] Switch 2 : chaque nouveau jeu a une case **« en boîte »** dans l'aperçu ; un jeu décoché (téléchargement
      seul, ex. Welcome Tour) est **mémorisé** et n'est plus reproposé aux imports suivants (réactivable).
- [ ] Toutes consoles : un jeu **pas encore sorti** (toutes ses dates connues sont futures) n'est pas importé ; il est
      ignoré avec la raison « à venir » et arrivera avec un import suivant. Switch 2 : un jeu sans date au jour près
      (« 2027 », « Q2 2027 », « TBA ») est aussi « à venir ».
- [ ] **Import des nouveautés** (SPEC v1.11) : l'aperçu classe chaque jeu en **nouveau**, **modifié** (avec les champs
      qui changent) ou **inchangé** par rapport à la base ; par défaut seuls les nouveaux et modifiés sont enregistrés,
      et seules les jaquettes **manquantes** sont copiées. « Tout réenregistrer » reste possible.
- [ ] **GameCube** (SPEC v1.13) : GameTDB seul (base Wii avec les jeux GameCube), même règle « boîte Nintendo ».
      Disques du commerce (identifiant en G) ; écartés : démos (« Interactive Multi-Game Demo », « Gekkan Nintendo
      Tentou Demo »), disques bonus, Game Boy Player Start-Up Disc ; **gardés** comme jeux à part : The Legend of
      Zelda: Collector's Edition et Pac-Man Vs. (choix du propriétaire), et Pokémon Channel (que GameTDB classe à tort
      « logiciel »). Codes produit `DOL-` + 4 caractères (ex. `DOL-GALE`).
- [ ] GameCube : jaquette = face avant découpée dans le scan de la boîte dépliée, comme la Wii ; sans ce scan (surtout
      au Japon), la **petite image** de GameTDB (160 × 224 px), floue en grand, remplaçable par une photo (US-12).

#### US-11 — Corriger une fiche (M)
- [ ] Je modifie les champs du jeu et de chacune de ses 3 sorties (titre, date, code produit, éditeur, sorti oui/non).
- [ ] J'ajoute un jeu manquant à la main, ou je supprime un jeu (avec confirmation).
- [ ] Les champs obligatoires sont vérifiés (titre non vide, date valide).

#### US-12 — Ajouter une jaquette à une sortie (S)
- [ ] Je remplace la jaquette d'une région par une **photo** ou l'**adresse d'une image** ; elle est copiée chez nous.
- [ ] Les jaquettes sont affichées en **haute définition** (nettes sur l'écran Retina de l'iPhone), chargées au fil du défilement.
- [ ] Une page d'administration « Jaquettes » montre toutes les jaquettes côte à côte, avec leur source et un
      bouton **Remplacer** sur chacune, pour repérer d'un coup d'œil celles qui ne sont pas des scans de boîte.
- [ ] La source de la jaquette est mentionnée (ex. « Jaquette : GameTDB »).
- [ ] Sans jaquette, une vignette neutre affiche le titre et la console.

## 5. Exigences non fonctionnelles

| Sujet | Exigence |
|---|---|
| Mobile | Tout est utilisable à une main sur 375 px ; zones tactiles ≥ 44 px |
| Rapidité | Catalogue affiché en moins de 2 s en 4G ; pages publiques préparées à l'avance |
| Sécurité | Écriture réservée au propriétaire, vérifiée côté serveur ; aucun secret dans le dépôt |
| Données | Chaque jeu cite sa source ; licences respectées (attribution si exigée) |
| Référencement | Chaque fiche a un titre, une description, une **adresse canonique**, un **aperçu de partage** avec sa jaquette et des **données structurées** (schema.org `VideoGame`) ; **plan du site** (`sitemap.xml`) ; l'administration est exclue des moteurs (`robots.txt`) |
| Accessibilité | Contrastes suffisants, images avec texte alternatif, navigation possible au clavier |
| Tests | Import testé sur des **fixtures**, jamais sur la source en direct |

## 6. Consoles couvertes

**v1 : Wii U.** Puis **Wii** (étape 8), **DS + 3DS** (étape 9), **Switch + Switch 2** (étape 10), **GameCube** (étape 11),
puis les autres :
**Salon** : Color TV-Game, NES / Famicom (+ Famicom Disk System), Super Nintendo / Super Famicom (+ Satellaview),
Nintendo 64 (+ 64DD), GameCube, Wii, Wii U, Switch, Switch 2.
**Portables** : Game & Watch, Game Boy, Game Boy Color, Virtual Boy, Game Boy Advance (+ e-Reader), Pokémon Mini,
DS, 3DS.

## 7. Hors périmètre (v1)

- Suivi de collection au-delà de US-16 : comptes visiteurs, état des exemplaires (complet, sans notice…), liste de
  souhaits, page publique de collection — étapes ultérieures.
- Rééditions (Player's Choice, Nintendo Selects…) et variantes de pays au sein de PAL.
- Jeux dématérialisés uniquement (eShop, WiiWare, DSiWare…).
- Comptes visiteurs, commentaires, notes Metacritic, bandes-annonces.
- Régions hors JAP / US / PAL (Corée, Chine…).

## 8. Décisions

| # | Question | Décision |
|---|---|---|
| 1 | Titre japonais | Écriture **japonaise** avec la version **romanisée** en dessous |
| 2 | Région par défaut | **PAL** |
| 3 | Code produit | **Importé de GameTDB** (v1.4) ; sinon « — », complété à la main |
| 4 | Images | Jaquettes par région **copiées chez nous** : scans de boîtes GameTDB (v1.4) ; IGDB retiré (v1.6) |
| 5 | Périmètre v1 | **Wii U seule** ; l'architecture reste multi-consoles |
| 7 | DS et 3DS (v1.10) | Ensemble à l'étape 9, GameTDB seul ; Switch à l'étape 10 (régions, import automatique) |
| 8 | Switch, Switch 2, nouveautés (v1.11) | Switch : GameTDB, cartouche mondiale = mêmes date et code dans les 3 régions, jaquette par région ; Switch 2 : Wikipédia + photos à la main (IGDB écarté : illustrations, pas des boîtes ; gamecartdb : images sans source citée) ; case « en boîte » mémorisée ; jeux à venir cachés ; nouveautés par **bouton manuel** (pas d'import automatique) |
| 6 | Consoles suivantes (v1.9) | **Wii** ; un seul catalogue filtré par console ; règle « boîte Nintendo » inchangée (les 14 jeux Wii édités par Nintendo dans une seule région restent, toutes régions listées) |

## 9. Prochaine étape

Valider avec les maquettes v0.2 (2 écrans : catalogue, fiche) → issues de l'étape 1.
