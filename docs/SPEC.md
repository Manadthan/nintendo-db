# Spécifications — Nintendo DB

> Étape 2 du playbook : **quoi construire**, pas comment (les choix techniques vont dans `docs/DESIGN.md`).
> Source : `intent/intent.md` v1.0.
>
> Version 1.1 — 16/11/2026 — statut : **validée** (1.0 validée au merge de la PR #1)
>
> | Version | Date | Changements |
> |---|---|---|
> | 1.1 | 16/11/2026 | US-12 : jaquette = **lien vers une image externe** (pas de copie, pas de photo en v1) |
> | 1.0 | 16/11/2026 | Validée (PR #1) |
> | 0.2 | 16/11/2026 | Questions 1 à 3 tranchées : titre JAP double, PAL par défaut, code produit complété à la main |
> | 0.1 | 16/11/2026 | Premier brouillon |

## 1. Contexte et objectif

Site public de référence des **jeux physiques édités par Nintendo**, sur **toutes les consoles Nintendo**,
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

#### US-01 — Voir les consoles (M)
*En tant que visiteur, je vois toutes les consoles Nintendo pour choisir celle qui m'intéresse.*
- [ ] L'accueil liste les consoles par **ordre chronologique**, avec nom, année de sortie et nombre de jeux.
- [ ] Les consoles sont regroupées en **salon** et **portables** (Game & Watch, e-Reader, etc. classés en annexe/portables).
- [ ] Un tap ouvre le catalogue de la console.

#### US-02 — Parcourir le catalogue d'une console (M)
*En tant que visiteur, je parcours les jeux Nintendo d'une console.*
- [ ] Les jeux s'affichent en **grille de jaquettes** (2 par ligne sur iPhone) ou en **liste** ; le dernier choix est retenu.
- [ ] Chaque jeu montre jaquette, titre et date **de la région affichée**.
- [ ] Tri : date de sortie (par défaut) ou A → Z ; regroupement **par année** en mode date.
- [ ] Le compteur indique le nombre de jeux affichés (ex. « 87 jeux »).
- [ ] La page reste fluide avec 300 jeux (images chargées au fil du défilement).

#### US-03 — Basculer entre JAP / US / PAL (M)
*En tant que visiteur, je choisis une région pour voir les versions de ce marché.*
- [ ] Un sélecteur **JAP / US / PAL** est accessible sur toutes les pages, à une main.
- [ ] Changer de région met à jour titres, dates, jaquettes et codes **sans recharger la page entière**.
- [ ] La région choisie est conservée à la visite suivante ; par défaut : **PAL**.
- [ ] Un jeu **non sorti** dans la région affichée apparaît grisé avec la mention « Non sorti en US » (par exemple),
      et un filtre permet de le masquer.

#### US-04 — Voir la fiche d'un jeu (M)
*En tant que visiteur, j'ouvre un jeu pour voir le détail de ses sorties.*
- [ ] La fiche montre la **jaquette** et, pour la région affichée : titre, date de sortie, code produit, éditeur.
- [ ] Un tableau récapitule les **3 régions** : sorti ou non, titre, date, code produit.
- [ ] Des onglets JAP / US / PAL sur la fiche permettent de comparer sans changer la région du site.
- [ ] Sont aussi affichés : console, développeur, franchise, genre (si connus).
- [ ] La **source** des données est citée (lien vers la fiche d'origine).
- [ ] Une donnée inconnue s'affiche « — », jamais vide ni inventée (fréquent pour le code produit au début, complété via US-11).
- [ ] La fiche a une adresse stable que l'on peut partager.

#### US-05 — Rechercher un jeu (M)
*En tant que visiteur, je trouve un jeu en tapant une partie de son titre.*
- [ ] La recherche porte sur les titres des **3 régions** et sur **toutes les consoles**.
- [ ] Elle ignore majuscules, accents et ponctuation (« pokemon » trouve « Pokémon »).
- [ ] Les résultats indiquent la console ; un tap ouvre la fiche.
- [ ] Aucun résultat → message clair.

#### US-06 — Filtrer le catalogue (S)
- [ ] Filtres combinables : disponibilité (sorti dans la région affichée / dans les 3 régions / exclusif à une région),
      année, genre.
- [ ] Les filtres actifs sont visibles et effaçables en un tap.

#### US-07 — Mentions et sources (M)
- [ ] Une page « À propos » indique que le site est un projet de fan **non affilié à Nintendo**, que les titres et
      visuels appartiennent à leurs propriétaires, et liste les sources de données avec leur licence.

#### US-08 — Thème clair / sombre (C)
- [ ] Le site suit le réglage de l'iPhone ; un bouton permet de forcer clair ou sombre.

### Administration (propriétaire)

#### US-09 — Se connecter (M)
- [ ] Une page de connexion (e-mail + mot de passe), sans lien visible pour les visiteurs.
- [ ] Les fonctions de modification n'apparaissent qu'une fois connecté ; un visiteur ne peut rien modifier,
      même en appelant directement le serveur.
- [ ] Un bouton permet de se déconnecter.

#### US-10 — Importer les jeux d'une console depuis la base ouverte (M)
*En tant que propriétaire, je remplis le catalogue d'une console sans tout saisir à la main.*
- [ ] Je choisis une console et lance l'import ; un **aperçu** montre les jeux trouvés avant d'enregistrer.
- [ ] Ne sont retenus que les jeux **physiques** dont Nintendo est **éditeur dans au moins une région**.
- [ ] Un nouvel import **n'écrase pas** mes corrections manuelles ; il signale les différences.
- [ ] Un résumé indique : ajoutés, mis à jour, ignorés (avec la raison).
- [ ] Chaque jeu importé garde le lien vers sa fiche d'origine.

#### US-11 — Corriger une fiche (M)
- [ ] Je modifie les champs du jeu et de chacune de ses 3 sorties (titre, date, code produit, éditeur, sorti oui/non).
- [ ] J'ajoute un jeu manquant à la main, ou je supprime un jeu (avec confirmation).
- [ ] Les champs obligatoires sont vérifiés (titre non vide, date valide).

#### US-12 — Ajouter une jaquette à une sortie (S)
- [ ] Je colle l'**adresse d'une image externe** (https) pour une région donnée ; elle remplace l'éventuelle adresse existante.
- [ ] L'image n'est **pas copiée** sur notre serveur : elle est affichée depuis son site, avec la mention de ce site.
- [ ] Sans jaquette, ou si l'image ne se charge plus, une vignette neutre affiche le titre et la console.

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
| 3 | Code produit | Souvent « — » après l'import, **complété à la main** ; une source complémentaire sera cherchée en conception |
| 4 | Images | **Liens vers des images externes**, saisis à la main, jamais copiés ; vignette neutre sinon (US-12) |

## 9. Prochaine étape

Valider cette spec → `docs/DESIGN.md` (modèle de données, import, images) et maquettes des 4 écrans :
accueil, catalogue, fiche, recherche.
