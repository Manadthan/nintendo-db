# Spécifications — Nintendo DB

> Étape 2 du playbook : **quoi construire**, pas comment (les choix techniques vont dans `docs/DESIGN.md`).
> Source : `intent/intent.md` v1.0.
>
> Version 1.41 — 22/11/2026 — statut : **à valider**
>
> | Version | Date | Changements |
> |---|---|---|
> | 1.41 | 22/11/2026 | US-02 : le catalogue affiche les **60 premiers jeux**, puis les suivants par lots de 60 **au défilement** (audit de performance, choix du propriétaire) ; compteurs inchangés ; « Précédent » depuis une fiche ramène à la même hauteur |
> | 1.40 | 22/11/2026 | US-19 : « copier à nouveau un lien » devient **« Nouveau lien »** (l'ancien lien cesse de marcher, 7 jours de plus) : la base ne garde que l'empreinte du jeton (ADR-16), le lien n'est donc montré qu'une fois |
> | 1.39 | 21/11/2026 | **Collectionneurs invités** (étape 27, intention v1.5) : US-19 à US-24 (invitation par lien à partager, compte, collection de chacun, profil, profil public, badges) ; US-16 reste valable pour le propriétaire |
> | 1.38 | 21/11/2026 | US-02 : vue **Frise** (demande du propriétaire, maquette validée `maquettes/frise.png`) : jeux en alternance de part et d'autre d'une ligne verticale, année seule au centre ; tris par date seulement |
> | 1.37 | 21/11/2026 | US-06 : filtre **Série** (demande du propriétaire) ; US-04 : séries sur la fiche ; US-11 : séries corrigées à la main, verrouillées. Un jeu peut appartenir à plusieurs séries (Dr. Mario : « Dr. Mario » et « Mario ») |
> | 1.36 | 20/11/2026 | **Ordinateur** (demande du propriétaire) : contenu centré et limité en largeur, catalogue de 2 à 6 colonnes selon l'écran, fiche en 2 colonnes (jaquette à gauche, informations à droite) ; administration inchangée (colonne centrée) |
> | 1.35 | 20/11/2026 | US-10 : l'**éditeur officiel de la région** l'emporte sur GameTDB (Switch, 3DS) ; cartes 3DS « 3DSWare » vendues en boîte selon Nintendo gardées (choix du propriétaire) |
> | 1.34 | 20/11/2026 | En-tête **toujours visible** pendant le défilement (comme gamecartdb) et bouton flottant **« Remonter en haut »** en bas à droite (demande du propriétaire) |
> | 1.33 | 20/11/2026 | US-10 : **jeux absents** (contrôle par les bases officielles de Nintendo) : DS, identifiants en Y et régions vides ; Switch et 3DS, éditeur repris de Nintendo Europe et Japon quand GameTDB n'en donne pas |
> | 1.32 | 20/11/2026 | US-18 : bascule **Tous / First party** en tête de la page Statistiques (demande du propriétaire) |
> | 1.31 | 20/11/2026 | US-02 : tri par défaut **plus récents d'abord** (demande du propriétaire ; avant : plus anciens d'abord) |
> | 1.30 | 20/11/2026 | US-17 : la note Metacritic du catalogue passe **en surimpression sur la jaquette** (coin en haut à droite, couleurs Metacritic), en grille et en liste, au lieu d'une étiquette (demande du propriétaire) |
> | 1.29 | 20/11/2026 | **Boîtes européennes officielles de Nintendo** (choix du propriétaire) : 39 jeux Wii U et Switch sans boîte française chez GameTDB reçoivent la boîte PEGI de nintendo.com, source citée ; boîtes JAP du site japonais écartées (illustrations carrées, pas des boîtes) |
> | 1.28 | 20/11/2026 | **Boîte PAL française d'abord** (Wii U, Switch ; choix du propriétaire) : l'anglaise de GameTDB est souvent un scan allemand (USK) ; jaquettes en place remplacées une fois |
> | 1.27 | 19/11/2026 | **NES** (étape 21) : US-10, 104 jeux ; boîte « (World) » jamais pour le Japon ; codes à la main |
> | 1.26 | 19/11/2026 | **Jaquettes Switch 2 de gamecartdb** (choix du propriétaire, revient sur v1.11) : boîtes américaine et européenne, source citée ; JAP à la main |
> | 1.25 | 19/11/2026 | **Super Nintendo** (étape 20) : US-10, 98 jeux ; boîtes japonaises par les titres japonais de Wikipédia ; codes à la main |
> | 1.24 | 19/11/2026 | **Virtual Boy** (étape 19) : US-10, 11 jeux, Japon et États-Unis seulement ; boîte « (Japan, USA) » réservée aux États-Unis |
> | 1.23 | 19/11/2026 | **Game Boy** (étape 18) : US-10, même recette que la Game Boy Color ; 91 jeux, codes à la main |
> | 1.22 | 19/11/2026 | **Game Boy Color** (étape 17) : US-10, même recette que N64 et GBA ; cartouches « Dual Mode » comprises ; codes DMG- / CGB- |
> | 1.21 | 19/11/2026 | US-02 : **tri par note Metacritic**, groupes par tranche, jeux sans note à la fin (demande du propriétaire) |
> | 1.20 | 19/11/2026 | **Statistiques** (étape 16) : US-18, page de l'administration (collection, régions, Metacritic, état du catalogue) ; compteurs de collection retirés du panneau Filtres (US-16) |
> | 1.19 | 19/11/2026 | **N64 et GBA complétées** (étape 15) : US-10, codes produit et boîtes japonaises retrouvés par le numéro de série No-Intro |
> | 1.18 | 19/11/2026 | **Nintendo 64 et Game Boy Advance** (étape 14) : US-10 (listes Wikipédia, boîtes libretro-thumbnails à leur forme réelle par région, codes à la main) |
> | 1.17 | 19/11/2026 | **Note Metacritic** (étape 13) : US-17, sur la fiche (note + lien) et en étiquette dans le catalogue ; Wikipédia + saisie à la main |
> | 1.16 | 19/11/2026 | US-16 : versions possédées en **étiquettes vertes** JAP / US / PAL, plus de coche sur la jaquette (demande du propriétaire) |
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
| Appareil principal | iPhone 12 mini (375 × 812), Safari iOS ; **ordinateur** pris en charge (navigateur de bureau, dès 1024 px de large) |
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
- [ ] Les **60 premiers jeux** s'affichent d'abord, puis les suivants par lots de 60, **tout seuls en approchant du bas**
      (SPEC v1.41) ; « N jeux affichés sur M » et le nombre de jeux par année comptent tous les jeux, pas seulement ceux
      déjà dessinés ; une nouvelle recherche, un filtre, le marché, le tri ou la vue repartent des 60 premiers.
- [ ] Chaque jeu montre jaquette, titre, date et sa **disponibilité par région** (JAP · US · PAL, cochées si sorti).
- [ ] Tri : plus récents d'abord (par défaut, v1.31), plus anciens d'abord, A → Z, **mieux notés** (note Metacritic, v1.21 : de la meilleure
      à la moins bonne, à égalité par titre, jeux sans note à la fin) ; regroupement **par année** en tri par date, **par
      tranche** en tri par note (« 90 et plus », « 75 à 89 », « 50 à 74 », « Moins de 50 », « Sans note »).
- [ ] **Frise** (v1.38) : 3e vue à côté de grille et liste (dernier choix retenu). Une ligne verticale au centre ;
      les jeux, dans l'ordre de leur date de sortie (version du marché choisi), sont placés **en alternance à gauche et
      à droite** ; chacun montre une **grande jaquette**, avec la note Metacritic, puis le **titre** et la **console**
      dessous (pas d'étiquettes de régions). Seule l'**année** est marquée, au centre de la ligne, et reste visible en
      haut pendant le défilement. La frise ne connaît que les tris par date : la choisir passe un tri A → Z ou par note
      en « plus récents », et le menu de tri ne propose alors que « plus récents » et « plus anciens ». Recherche,
      marché et filtres s'appliquent comme dans les autres vues ; un jeu sans date est rangé sous « Date inconnue ».
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
- [ ] Sont aussi affichés : console, éditeur, développeur, **séries** (v1.37, remplace « franchise »), genre (si connus),
      lien « Retour au catalogue ».
- [ ] La **source** des données est citée (lien vers la fiche d'origine).
- [ ] Une donnée inconnue s'affiche « — », jamais vide ni inventée (fréquent pour le code produit au début, complété via US-11).
- [ ] La fiche a une adresse stable que l'on peut partager.

#### US-17 — Voir la note Metacritic d'un jeu (S, SPEC v1.17)
*En tant que visiteur, je vois d'un coup d'œil comment un jeu a été reçu par la critique.*
- [ ] Sur la fiche, dans le bloc d'informations : « Metacritic » et la note seule (« 85 », sans « /100 ») aux **couleurs Metacritic** (vert ≥ 75, jaune
      50 à 74, rouge < 50), avec un **lien** vers la page Metacritic du jeu quand il est connu ; « — » sans note. La source
      est citée en pied de fiche (« note Metacritic via Wikipédia »).
- [ ] Dans le catalogue, une pastille **avec le seul chiffre** (« 85 ») **en surimpression dans le coin en haut à droite
      de la jaquette**, aux **couleurs Metacritic** comme sur la fiche, en grille comme en liste (v1.30, demande du
      propriétaire ; elle remplace l'étiquette de la ligne JAP / US / PAL). Un jeu sans note n'a pas de pastille.
- [ ] Une note par jeu (celle de sa console ; pas de note par région).

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
- [ ] **Série** (v1.37) : liste comme Développeur, « Toutes » puis les séries par **ordre alphabétique** avec leur
      nombre de jeux, puis **« Sans série »**. Un jeu peut appartenir à **plusieurs** séries, d'une série large à une
      sous-série (Dr. Mario : « Mario » et « Dr. Mario ») : il apparaît sous chacune. Noms de séries en français quand
      un nom français existe (« Professeur Layton »), sinon le nom anglais ; une même série a un seul nom.
- [ ] Les séries sont trouvées automatiquement (titre du jeu, puis Wikidata), pour les jeux existants comme pour les
      jeux importés ensuite ; un jeu sans série connue est « Sans série », jamais une série devinée au hasard.

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
- [ ] Sur le catalogue, les étiquettes **JAP / US / PAL** sous la jaquette passent en **vert** (texte, coche et contour)
      pour chaque version possédée (v1.16, demande du propriétaire : rien sur la jaquette).
- [ ] Filtre **Collection** dans le panneau : Tous / Possédés / Manquants, selon la version du marché affiché (marché
      « Tous » : au moins une version possédée).
- [ ] ~~Un compteur par console en tête du panneau Filtres~~ : déplacé dans la page **Statistiques** (US-18, v1.20).
- [ ] La collection est **privée** : un visiteur ne voit ni case, ni coche, ni filtre, ni compteur, et ne peut ni lire
      ni modifier la collection, même en appelant directement le serveur. Les pages publiques restent préparées à
      l'avance ; la collection s'ajoute dans le navigateur une fois connecté.
- [ ] Supprimer un jeu (US-11) retire aussi ses versions de la collection.

### Collectionneurs invités (étape 27, intention v1.5 décision 9)

Vocabulaire : un **collectionneur** est un compte invité par le propriétaire ; il a sa collection, son profil et ses
badges, et **ne modifie jamais le catalogue** (l'administration lui reste fermée). Le propriétaire est aussi un
collectionneur. Une **version** est un jeu dans une région (JAP, US ou PAL).

#### US-19 — Inviter un collectionneur (S, SPEC v1.39)
*En tant que propriétaire, j'invite un ami pour qu'il tienne sa collection sur le site.*
- [x] Une page de l'administration « Collectionneurs » : je crée une invitation (avec un nom pour m'en souvenir,
      par exemple « Léa ») et j'obtiens un **lien à partager**, valable 7 jours et utilisable une seule fois, que
      j'envoie moi-même (SMS, messagerie) ; bouton « Copier le lien » (choix du propriétaire : aucun e-mail envoyé par
      le site, donc aucun service d'e-mail à configurer). Pas d'inscription ouverte : sans lien valide, aucun compte
      ne peut être créé.
- [x] La page liste les collectionneurs (pseudo, adresse e-mail de connexion, inscrit le, nombre de jeux) et les
      invitations en attente ; je peux créer un **nouveau lien** (le lien n'est montré qu'une fois : l'ancien cesse de marcher et le délai
      repart pour 7 jours, SPEC v1.40), l'annuler, ou **supprimer un compte** (avec
      confirmation : sa collection et son profil sont effacés).

#### US-20 — Accepter une invitation (S, SPEC v1.39)
*En tant qu'invité, je crée mon compte depuis le lien reçu.*
- [x] Le lien ouvre une page « Bienvenue » : je saisis mon **adresse e-mail** (elle sert à me connecter), un **mot de
      passe** (8 caractères au moins), un **pseudo** (3 à 20 lettres, chiffres, tirets ; unique, sans distinction de
      majuscules) et un avatar, puis j'arrive sur mon profil, déjà connecté.
- [x] Un lien expiré ou déjà utilisé affiche un message clair (« demandez une nouvelle invitation »).
- [x] Je me connecte ensuite par la même page de connexion que le propriétaire ; l'icône de compte de l'en-tête mène
      à **mon profil** (au propriétaire : à l'administration, avec un lien vers son profil).

#### US-21 — Tenir ma collection (S, SPEC v1.39)
*En tant que collectionneur connecté, je coche les versions que je possède, comme le propriétaire.*
- [x] Mêmes cases « Je l'ai » sur la fiche, étiquettes vertes et filtre **Collection** dans le catalogue que US-16 ;
      chaque compte ne voit et ne modifie que **sa** collection, même en appelant directement le serveur.
- [x] La date d'ajout de chaque version est gardée (pour « derniers ajouts », US-22).

#### US-22 — Mon profil (M, SPEC v1.39)
*En tant que collectionneur, je vois ma collection résumée et mes badges.*
- [x] Page « Mon profil » : **pseudo**, **avatar** choisi parmi une douzaine d'icônes du site (manette, cartouche,
      étoile, champignon…, dessinées pour le site : aucune image de Nintendo ; pas d'envoi de photo), modifiables.
- [x] **Statistiques** : nombre de jeux et de versions possédés ; par console (jeux possédés / jeux du catalogue,
      en barre de progression) ; par région (JAP, US, PAL).
- [x] **Derniers ajouts** : les 6 dernières versions cochées (jaquette, titre, région), liens vers les fiches.
- [x] **Badges** gagnés (US-24), puis les prochains badges à gagner avec leur progression (« 18 / 25 jeux »).
- [x] Interrupteur **« Profil public »**, éteint par défaut (US-23), avec l'adresse à partager quand il est allumé.

#### US-23 — Profil public (S, SPEC v1.39)
*En tant que visiteur, j'ouvre le profil qu'un collectionneur a partagé.*
- [x] Adresse `/collectionneurs/{pseudo}` : pseudo, avatar, badges, statistiques, derniers ajouts, et la liste des
      jeux possédés (par console). Jamais l'adresse e-mail.
- [x] Un profil non public, ou un pseudo inconnu, donne la page « introuvable » : on ne peut pas savoir si le compte
      existe. Les profils ne sont pas proposés aux moteurs de recherche (`noindex`), ni listés nulle part.
- [x] Rendre le profil privé le retire aussitôt (au plus le temps de rafraîchissement des pages, 5 minutes).

#### US-24 — Gagner des badges (M, SPEC v1.39)
*En tant que collectionneur, je gagne des badges selon ma collection.*
- [x] Badges calculés à partir de la collection (un **jeu** compte s'il est possédé dans au moins une région) ; ils se
      perdent si les versions sont décochées. Chacun a un nom, une icône et une explication.
- [x] **Total** : 10, 25, 50, 100, 250, 500 jeux (« Débutant », « Amateur », « Passionné », « Collectionneur »,
      « Expert », « Légende »).
- [x] **Par console** (pour chaque console) : 10 jeux ; la moitié des jeux de la console au catalogue ; tous
      (« Complet »). Le catalogue évolue : un badge « Complet » se perd si un jeu est ajouté à la console.
- [x] **Par série** : tous les jeux d'une série d'au moins 3 jeux (étape 23), sur toutes les consoles (« Série
      complète : Metroid »).
- [x] **Par région** : 10 et 50 versions japonaises (« Importateur ») ; 10 et 50 versions américaines ; un même jeu
      possédé dans les **3 régions** (« Tour du monde »), puis 10 jeux dans les 3 régions.

### Administration (propriétaire)

#### US-09 — Se connecter (M)
- [ ] Une page de connexion (e-mail + mot de passe), atteinte par l'**icône de compte** en haut de chaque page
      publique (v1.15, remplace le lien « Administration » du pied de page, retiré) : non connecté, elle ouvre la
      connexion ; connecté, elle est pleine et colorée et ouvre directement l'administration (le propriétaire est
      le seul compte ; des profils utilisateurs viendront plus tard). Pour lui faire place sur 375 px, « Catalogue »
      et « À propos » deviennent des **icônes** (nommées pour les lecteurs d'écran, page courante en couleur).
- [ ] L'en-tête (logo, nom, icônes) **reste collé en haut de l'écran** pendant le défilement (v1.34) ; sur les pages
      publiques, un bouton rond **« Remonter en haut »** apparaît en bas à droite après un défilement et ramène en haut.
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
      téléchargements (DS : titres « (Demo) », « Download », « Kiosk » ; les identifiants en Y ne sont plus écartés
      depuis v1.33 : Kirby Super Star Ultra, Professeur Layton…), ni logiciels (genre « software »), ni jeux Super
      Nintendo ou eShop de la 3DS (seuls les identifiants en A, B, C, E sont gardés). DS : une carte sans région prend
      celle de son identifiant (Pokémon Noir et Blanc, v1.33).
- [ ] Switch et 3DS (v1.33) : quand GameTDB ne donne **pas d'éditeur**, le jeu compte comme édité par Nintendo si
      Nintendo Europe ou Nintendo Japon le disent (Fire Emblem: Three Houses, Pikmin 4…). Depuis v1.35, un éditeur
      renseigné par GameTDB cède devant l'éditeur officiel **de la région de la carte** : Nintendo Europe pour une carte
      européenne, Nintendo Japon pour une japonaise (Dragon Quest Builders : « Square Enix » chez GameTDB, Nintendo en
      Europe) ; une carte seulement américaine garde l'éditeur de GameTDB (pas de base officielle américaine).
- [ ] 3DS (v1.35) : une carte classée « 3DSWare » (téléchargement) par GameTDB compte comme une boîte si la base
      officielle de sa région la dit vendue en boîte par Nintendo (Fire Emblem Fates, Ever Oasis, Culdcept) ; une carte
      américaine suit l'Europe ou le Japon.
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
- [ ] Switch : jaquette **propre à chaque région** : US (scan US), PAL (scan FR, sinon EN, sinon DE : SPEC v1.28 ; sinon boîte européenne officielle de Nintendo quand elle existe, SPEC v1.29), JAP (scan japonais,
      352 × 570 px, le plus grand qui existe) ; proportions de la boîte Switch (en hauteur, ≈ 0,62).
- [ ] **Switch 2** (SPEC v1.11) : GameTDB n'a pas de base. Liste Wikipédia « List of Nintendo Switch 2 games » :
      jeux dont l'éditeur contient Nintendo ; titre, développeur et **une date commune aux 3 régions** ; pas de code
      produit. Jaquettes US et PAL copiées de **gamecartdb.com** (v1.26 : boîte américaine ESRB, européenne PEGI ;
      source « gamecartdb » citée sur la fiche et dans À propos ; jamais remplacées par un import) ; japonaise :
      vignette neutre, **photo ajoutée à la main** (US-12).
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
- [ ] **Nintendo 64 et Game Boy Advance** (SPEC v1.18) : GameTDB ne les couvre pas. Liste, éditeurs et dates par région
      viennent des listes **Wikipédia** (« List of Nintendo 64 games », « List of Game Boy Advance games ») : jeux édités
      par Nintendo dans au moins une région ; toutes les cartouches sont en boîte ; « Unreleased » = non sorti.
- [ ] N64 et GBA : jaquettes de **libretro-thumbnails** (scans de boîtes par région, 512 px), retrouvées par le titre et
      la région ; mention « Jaquette : libretro-thumbnails ». Chaque jaquette garde sa **forme réelle** (N64 en largeur
      aux États-Unis et en Europe, en hauteur au Japon ; GBA carrée ou en largeur), entière dans le cadre du catalogue.
      Boîte japonaise nommée en japonais (« Zelda no Densetsu ») : retrouvée par le **numéro de série** de la cartouche
      (v1.19), qui relie les versions JAP, US et PAL d'un même jeu ; sinon vignette neutre, photo à la main (US-12).
- [ ] N64 et GBA : **code produit** = préfixe de la console + numéro de série No-Intro de la région (`NUS-NZSE`,
      `AGB-AMKJ`), sans suffixe de pays (v1.19) ; série inconnue : « — », complété à la main (US-11), et un code saisi
      à la main n'est jamais remplacé. Titre japonais = titre anglais faute de source. Notes Metacritic manquantes :
      saisie à la main seulement (choix du propriétaire).
- [ ] **Game Boy Color** (v1.22) : même recette que la N64 et la GBA (liste Wikipédia « List of Game Boy Color games »,
      boîtes libretro-thumbnails, séries No-Intro). Les 45 jeux édités par Nintendo, **cartouches noires « Dual Mode »
      comprises** (jouables aussi sur Game Boy ; le Game Boy d'origine viendra à part). Code produit : **`DMG-`** pour
      une cartouche Dual Mode, **`CGB-`** pour une cartouche Game Boy Color seulement, suivi de la série No-Intro quand
      elle est connue (peu de jeux) ; sinon « — », saisi à la main (US-11). Boîtes US et Europe carrées, japonaises en
      hauteur (forme réelle).
- [ ] **Game Boy** (v1.23) : même recette (liste Wikipédia « List of Game Boy games », boîtes libretro-thumbnails, séries
      No-Intro). Les 91 jeux édités par Nintendo dans au moins une région, **dont 25 en Europe seulement** (jeux d'autres
      éditeurs que Nintendo distribuait en Europe : Mega Man II, Final Fantasy Adventure…). Code produit **`DMG-`** +
      série quand No-Intro la connaît (rare : les cartouches d'avant 1996 ne la portent pas) ; sinon « — », saisi à la
      main depuis la liste « sans code produit » (US-18). Boîtes carrées, japonaises presque carrées (forme réelle).
- [ ] **Virtual Boy** (v1.24) : même recette (liste « List of Virtual Boy games »). 11 jeux édités par Nintendo, sortis
      au **Japon et aux États-Unis seulement** (pas de version PAL). Une boîte libretro nommée « (Japan, USA) » est la
      boîte américaine : elle ne sert **qu'aux États-Unis**, la version japonaise garde la vignette neutre en attendant une
      photo (choix du propriétaire, règle valable pour toutes les consoles à cartouches). Code **`VUE-`** + série No-Intro
      de la région : la série japonaise est connue pour presque tous les jeux, l'américaine pour 5 ; sinon « — », à la
      main (US-11).
- [ ] **Super Nintendo** (v1.25) : même recette (liste « List of Super Nintendo Entertainment System games »). Les 98
      jeux édités par Nintendo dans au moins une région, dont 19 en Europe seulement. « Cancelled » = non sorti. Boîte
      japonaise (Super Famicom) cherchée aussi sous les **titres japonais** que Wikipédia cite dans la cellule du titre
      (« Super Mario World • Super Mario Bros. 4 ») ; règle valable pour toutes les consoles à cartouches. Codes produit
      (SHVC- au Japon, SNS- aux États-Unis, SNSP- en Europe) **à la main** : No-Intro ne les donne pas pour ces
      cartouches. Boîtes en largeur aux États-Unis et en Europe, en hauteur au Japon (forme réelle).
- [ ] **NES** (v1.27) : même recette (liste « List of Nintendo Entertainment System games »). Les 104 jeux édités par
      Nintendo dans au moins une région, dont 24 en Europe seulement. Une boîte libretro « (World) » montre la boîte
      américaine ou européenne : elle ne sert **jamais au Japon** (choix du propriétaire, règle valable pour toutes les
      consoles à cartouches), comme « (Japan, USA) » (v1.24). Codes produit (HVC- au Japon, NES- ailleurs) **à la
      main**. Boîtes en hauteur (forme réelle).

#### US-11 — Corriger une fiche (M)
- [ ] Je modifie les champs du jeu et de chacune de ses 3 sorties (titre, date, code produit, éditeur, sorti oui/non).
- [ ] J'ajoute un jeu manquant à la main, ou je supprime un jeu (avec confirmation).
- [ ] Les champs obligatoires sont vérifiés (titre non vide, date valide).
- [ ] Je saisis ou corrige la **note Metacritic** (0 à 100) et l'adresse de sa page ; une note saisie à la main est
      verrouillée contre la mise à jour automatique (SPEC v1.17).
- [ ] Je corrige les **séries** d'un jeu (ajout, retrait) ; des séries corrigées à la main sont verrouillées : ni
      l'import ni le remplissage automatique ne les changent (v1.37).
- [ ] Une page d'administration met à jour les **notes Metacritic** d'une console depuis Wikipédia (aperçu puis
      enregistrement, comme l'import) : notes trouvées, jeux sans article ou sans note, notes **ambiguës** (article couvrant
      plusieurs consoles sans note propre à celle du jeu) laissées vides et signalées, à saisir à la main.

#### US-12 — Ajouter une jaquette à une sortie (S)
- [ ] Je remplace la jaquette d'une région par une **photo** ou l'**adresse d'une image** ; elle est copiée chez nous.
- [ ] Les jaquettes sont affichées en **haute définition** (nettes sur l'écran Retina de l'iPhone), chargées au fil du défilement.
- [ ] Une page d'administration « Jaquettes » montre toutes les jaquettes côte à côte, avec leur source et un
      bouton **Remplacer** sur chacune, pour repérer d'un coup d'œil celles qui ne sont pas des scans de boîte.
- [ ] La source de la jaquette est mentionnée (ex. « Jaquette : GameTDB »).
- [ ] Sans jaquette, une vignette neutre affiche le titre et la console.

#### US-18 — Voir mes statistiques (M, SPEC v1.20)
*En tant que propriétaire connecté, je vois où en est ma collection et ce qui manque au catalogue, hors du catalogue
public (demande du propriétaire : rien dans le panneau Filtres).*
- [ ] Une page **Statistiques** dans l'administration, ouverte depuis un bouton en tête de son accueil ; maquette :
      `docs/maquettes/statistiques.png`. Privée comme toute l'administration.
- [ ] Une bascule **Tous / First party** en tête de page (v1.32, « Tous » par défaut, gardée dans l'adresse) : « First
      party » ne compte, dans Ma collection, Par région et Notes Metacritic, que les jeux développés par les studios
      internes de Nintendo (même règle que le filtre « Nintendo (first party) », US-06). L'État du catalogue compte
      toujours tous les jeux.
- [ ] **Ma collection** : jeux possédés / jeux du catalogue et pourcentage, au total puis par console (ordre
      chronologique), avec une barre de progression verte. Un jeu compte comme possédé dès **une** version possédée.
- [ ] **Par région** : nombre de versions possédées en JAP, US et PAL (un jeu possédé en JAP et PAL compte une fois
      dans « Ma collection », deux fois ici).
- [ ] **Notes Metacritic** : note moyenne des jeux possédés qui ont une note (aux couleurs Metacritic, US-17) ; les 3
      jeux possédés les mieux notés ; les 3 jeux les mieux notés qui ne sont pas possédés. Sans note : bloc
      « Aucune note ».
- [ ] **État du catalogue** : nombre de jeux ; pour les versions **sorties** : jaquettes manquantes (vignette neutre ou
      à remplacer), codes produit manquants ; jeux sans note Metacritic. Chaque ligne ouvre la **liste des jeux
      concernés** : page Jaquettes filtrée « à remplacer », liste Jeux filtrée « sans code produit » (nouveau filtre),
      page Notes Metacritic.
- [ ] Les chiffres sont toujours à jour (calculés à l'ouverture de la page, jamais stockés).

## 5. Exigences non fonctionnelles

| Sujet | Exigence |
|---|---|
| Mobile | Tout est utilisable à une main sur 375 px ; zones tactiles ≥ 44 px |
| Ordinateur | Pages publiques centrées, jamais plus larges que 1280 px ; catalogue en 2 colonnes (téléphone) jusqu'à 6 (grand écran) ; fiche en 2 colonnes dès 1024 px ; aucun défilement horizontal ; effet au survol des jeux |
| Rapidité | Catalogue affiché en moins de 2 s en 4G ; pages publiques préparées à l'avance |
| Sécurité | Écriture réservée au propriétaire, vérifiée côté serveur ; aucun secret dans le dépôt |
| Données | Chaque jeu cite sa source ; licences respectées (attribution si exigée) |
| Référencement | Chaque fiche a un titre, une description, une **adresse canonique**, un **aperçu de partage** avec sa jaquette et des **données structurées** (schema.org `VideoGame`) ; **plan du site** (`sitemap.xml`) ; l'administration est exclue des moteurs (`robots.txt`) |
| Accessibilité | Contrastes suffisants, images avec texte alternatif, navigation possible au clavier |
| Tests | Import testé sur des **fixtures**, jamais sur la source en direct |

## 6. Consoles couvertes

**v1 : Wii U.** Puis **Wii** (étape 8), **DS + 3DS** (étape 9), **Switch + Switch 2** (étape 10), **GameCube** (étape 11),
**Nintendo 64 + Game Boy Advance** (étape 14), puis les autres :
**Salon** : Color TV-Game, NES / Famicom (+ Famicom Disk System), Super Nintendo / Super Famicom (+ Satellaview),
Nintendo 64 (+ 64DD), GameCube, Wii, Wii U, Switch, Switch 2.
**Portables** : Game & Watch, Game Boy, Game Boy Color, Virtual Boy, Game Boy Advance (+ e-Reader), Pokémon Mini,
DS, 3DS.

## 7. Hors périmètre (v1)

- Suivi de collection au-delà de US-16 et US-19 à US-24 : inscription ouverte, état des exemplaires (complet, sans notice…), liste de
  souhaits, page publique de collection — étapes ultérieures.
- Rééditions (Player's Choice, Nintendo Selects…) et variantes de pays au sein de PAL.
- Jeux dématérialisés uniquement (eShop, WiiWare, DSiWare…).
- Inscription ouverte (comptes sur invitation seulement : US-19), commentaires, bandes-annonces ; note par région ou autres sites de critiques (OpenCritic…).
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
| 8 | Switch, Switch 2, nouveautés (v1.11) | Switch : GameTDB, cartouche mondiale = mêmes date et code dans les 3 régions, jaquette par région ; Switch 2 : Wikipédia + photos à la main (IGDB écarté : illustrations, pas des boîtes ; gamecartdb écarté en v1.11, retenu en v1.26 pour les boîtes US et PAL, source citée) ; case « en boîte » mémorisée ; jeux à venir cachés ; nouveautés par **bouton manuel** (pas d'import automatique) |
| 6 | Consoles suivantes (v1.9) | **Wii** ; un seul catalogue filtré par console ; règle « boîte Nintendo » inchangée (les 14 jeux Wii édités par Nintendo dans une seule région restent, toutes régions listées) |

## 9. Prochaine étape

Valider avec les maquettes v0.2 (2 écrans : catalogue, fiche) → issues de l'étape 1.
