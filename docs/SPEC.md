# Spécifications — Nintendo DB

> Étape 2 du playbook : **quoi construire**, pas comment (les choix techniques vont dans `docs/DESIGN.md`).
> Source : `intent/intent.md` v1.0.
>
> Version 1.5 — 17/11/2026 — statut : **validée**
>
> | Version | Date | Changements |
> |---|---|---|
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

#### US-01 — Voir les consoles (S — dès la 2ᵉ console)
*En tant que visiteur, je vois toutes les consoles Nintendo pour choisir celle qui m'intéresse.*
- [ ] Tant qu'une seule console est disponible (v1 : Wii U), l'accueil **est** son catalogue (US-02).
- [ ] L'accueil liste les consoles par **ordre chronologique**, avec nom, année de sortie et nombre de jeux.
- [ ] Les consoles sont regroupées en **salon** et **portables** (Game & Watch, e-Reader, etc. classés en annexe/portables).
- [ ] Un tap ouvre le catalogue de la console.

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
- [ ] Filtres combinables : disponibilité (sorti dans la région affichée / dans les 3 régions / exclusif à une région),
      année, genre.
- [ ] Les filtres actifs sont visibles et effaçables en un tap.

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

### Administration (propriétaire)

#### US-09 — Se connecter (M)
- [ ] Une page de connexion (e-mail + mot de passe), atteinte par un lien discret « Administration » en pied du
      catalogue et des fiches (v1.5) ; une fois connecté, ce lien mène directement à l'administration.
- [ ] Les fonctions de modification n'apparaissent qu'une fois connecté ; un visiteur ne peut rien modifier,
      même en appelant directement le serveur.
- [ ] Un bouton permet de se déconnecter.

#### US-10 — Importer les jeux d'une console depuis Wikipédia, IGDB et GameTDB (M)
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
- [ ] Chaque jeu importé garde le lien vers sa fiche d'origine (Wikipédia, IGDB).
- [ ] Les **jaquettes de chaque région** sont récupérées et copiées chez nous : en priorité le **scan de la vraie
      boîte** (GameTDB), sinon l'image IGDB ; une région sans scan est signalée dans le résumé.
- [ ] Le **code produit** de chaque région est importé quand la source le connaît (ex. `WUP-P-ALZP`).

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
| Référencement | Chaque fiche a un titre et une description lisibles par les moteurs de recherche |
| Accessibilité | Contrastes suffisants, images avec texte alternatif, navigation possible au clavier |
| Tests | Import testé sur des **fixtures**, jamais sur la source en direct |

## 6. Consoles couvertes

**v1 : Wii U.** Puis, une à une :
**Salon** : Color TV-Game, NES / Famicom (+ Famicom Disk System), Super Nintendo / Super Famicom (+ Satellaview),
Nintendo 64 (+ 64DD), GameCube, Wii, Wii U, Switch, Switch 2.
**Portables** : Game & Watch, Game Boy, Game Boy Color, Virtual Boy, Game Boy Advance (+ e-Reader), Pokémon Mini,
DS, 3DS.

## 7. Hors périmètre (v1)

- Suivi de collection (jeux possédés, liste de souhaits) — étape ultérieure.
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
| 4 | Images | Jaquettes par région **copiées chez nous** : scans de boîtes GameTDB en priorité, IGDB en secours (v1.4) |
| 5 | Périmètre v1 | **Wii U seule** ; l'architecture reste multi-consoles |

## 9. Prochaine étape

Valider avec les maquettes v0.2 (2 écrans : catalogue, fiche) → issues de l'étape 1.
