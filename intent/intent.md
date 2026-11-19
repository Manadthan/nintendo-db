# Intention — Nintendo DB

> Étape 1 du playbook : **quoi et pourquoi**, pas encore comment.
> Version 1.4 — 19/11/2026 — statut : **validée** (1.1 : v1 limitée à la Wii U, sources et images revues ; 1.2 : Wii, catalogue toutes consoles ; 1.3 : Switch, Switch 2, nouveautés ; 1.4 : premier pas du suivi de collection)

## Problème

Il n'existe pas de base simple, en français et lisible sur iPhone, qui recense **tous les jeux édités par
Nintendo** sur l'ensemble de ses consoles, en montrant les **différences entre les versions japonaise,
américaine et européenne (PAL)** : titre, date de sortie, code produit, jaquette et cartouche/disque.
Les sites existants (ex. gamecartdb.com) couvrent tous les éditeurs ou ne comparent pas les régions.

## Résultat attendu

- Parcourir les jeux **par console**, puis par jeu.
- Un sélecteur **JAP / US / PAL** change l'affichage (titre, visuels, date, code) ; mention claire quand
  un jeu n'est pas sorti dans une région.
- Rechercher un jeu par son titre, quelle que soit la région.

## Utilisateurs

- Le propriétaire (collectionneur), principalement sur **iPhone 12 mini / Safari**.
- **Site public en lecture** : tout le monde consulte, seul le propriétaire modifie.

## Périmètre envisagé

Consoles de salon et portables Nintendo : Color TV-Game, Game & Watch, NES/Famicom, Game Boy (+ Color),
Virtual Boy, Super Nintendo, Nintendo 64 (+ 64DD), Game Boy Advance, GameCube, DS, Wii, 3DS, Wii U,
Switch, Switch 2, ainsi que Satellaview, e-Reader et Pokémon Mini.

## Contraintes

- Interface en français, mobile d'abord.
- Données vérifiables : chaque fiche cite sa source.
- **Droits** : jaquettes et photos appartiennent à Nintendo ou aux photographes ; leur usage doit être
  compatible avec la source choisie.
- Le scraping éventuel se fait côté serveur, testé sur fixtures, en respectant les conditions des sites.

## Référence observée : gamecartdb.com (16/11/2026)

- Uniquement **Switch 2**, tous éditeurs, en anglais ; 166 sorties.
- Catalogue groupé par mois, en grille ou liste ; filtre **marché** (Europe, Amérique du Nord, Japon, Asie),
  tri (date, A–Z, Metacritic), filtres par type (édition limitée, import…).
- Fiche : jaquette **par région** (bascule NA / Europe), date, éditeur, développeur, franchise, note
  Metacritic, disponibilité par région (✓), résumé, genres, modes de jeu, bande-annonce, notes.
- Compte : bibliothèque et liste de souhaits.
- Mention : projet de fan, non affilié à Nintendo ; titres et jaquettes propriété de leurs détenteurs.

Ce que Nintendo DB reprend : catalogue + fiche avec bascule de région. Ce qui diffère : toutes les consoles,
Nintendo éditeur seulement, en français, région JAP incluse.

## Décisions prises (16/11/2026)

| # | Question | Décision |
|---|---|---|
| 1 | Quels jeux | Sorties **physiques** dont Nintendo est **éditeur** dans au moins une région ; pas de dématérialisé en v1 |
| 2 | Consoles | **Toutes** à terme, y compris Satellaview, e-Reader et Pokémon Mini ; **v1 limitée à la Wii U** (hypothèse simplificatrice du propriétaire) ; **Wii** ensuite (étape 8, v1.2) ; un **seul catalogue** pour toutes les consoles, filtré par plateforme |
| 3 | Source des données | **Wikipédia** (liste, dates par région, jeux en boîte) + **GameTDB** (boîtes, scans, titres japonais, codes produit ; remplace IGDB, voir DESIGN v0.8), puis corrections à la main ; Wikidata et MobyGames écartés (voir DESIGN §1). **Wii : GameTDB seul** (étude du 17/11, DESIGN §1 bis) ; **Switch 2 : Wikipédia + photos à la main** (pas de base GameTDB, DESIGN §1 quater) |
| 4 | Accès | **Public en lecture**, modification réservée au propriétaire |
| 5 | Suivi de collection | **Premier pas (19/11, étape 12)** : le propriétaire seul coche les versions régionales qu'il possède ; collection **privée** ; ni état des exemplaires, ni comptes visiteurs. Le modèle de données prévoit plusieurs comptes pour plus tard. Restent à étudier : comptes visiteurs (inscription ou invitation), état des exemplaires, page publique, tableau de complétion détaillé, note Metacritic, valeur estimée |
| 6 | Variantes | **Plus tard** : rééditions et variantes de pays PAL hors v1 |
| 8 | Nouveautés (v1.3) | Les consoles encore vivantes (Switch 2) reçoivent des jeux chaque mois : un import « nouveautés seulement », lancé par le propriétaire, ajoute les nouveaux jeux sans tout réimporter |
| 7 | Stack | **Même stack** que `mon-site-sdlc` : Next.js, Tailwind, Supabase, Vercel — rendu dans l'esprit de gamecartdb (gamecartdb utilise lui-même Next.js) |

## Images

- Jaquettes **par région**, en haute définition, **copiées chez nous** depuis GameTDB (scans de boîtes, avec mention),
  comme le fait gamecartdb. L'aspect visuel est une priorité du propriétaire.
