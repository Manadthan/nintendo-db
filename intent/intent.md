# Intention — Nintendo DB

> Étape 1 du playbook : **quoi et pourquoi**, pas encore comment.
> Version 0.1 — 16/11/2026 — statut : **brouillon, à valider par le propriétaire**

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
- Éventuellement d'autres visiteurs (voir question ouverte n° 4).

## Périmètre envisagé

Consoles de salon et portables Nintendo : Color TV-Game, Game & Watch, NES/Famicom, Game Boy (+ Color),
Virtual Boy, Super Nintendo, Nintendo 64 (+ 64DD), Game Boy Advance, GameCube, DS, Wii, 3DS, Wii U,
Switch, Switch 2 — à confirmer (question 2).

## Contraintes

- Interface en français, mobile d'abord.
- Données vérifiables : chaque fiche cite sa source.
- **Droits** : jaquettes et photos appartiennent à Nintendo ou aux photographes ; leur usage doit être
  compatible avec la source choisie.
- Le scraping éventuel se fait côté serveur, testé sur fixtures, en respectant les conditions des sites.

## Questions ouvertes (à trancher avant la spec)

1. **« Publiés par Nintendo »** : Nintendo **éditeur** dans au moins une région (ex. un jeu édité par un tiers
   au Japon mais par Nintendo en Europe compte-t-il) ? Inclure les jeux **dématérialisés uniquement**
   (eShop, WiiWare, DSiWare) ou seulement les sorties physiques ?
2. **Consoles** : la liste ci-dessus convient-elle ? Inclure les accessoires/périphériques à jeux
   (Satellaview, e-Reader, Pokémon Mini) ?
3. **Source des données** : saisie manuelle, import depuis des bases ouvertes (Wikipedia/Wikidata, autres
   bases), ou scraping d'un site ? Et pour les **images** (jaquettes, cartouches) ?
4. **Public ou personnel** : site public consultable par tous, ou privé comme le projet précédent ?
5. **Suivi de collection** : cocher les jeux possédés (par région) comme dans `mon-site-sdlc`, ou base de
   consultation seule pour la v1 ?
6. **Variantes** : rééditions (Player's Choice, Nintendo Selects…), variantes de pays au sein de PAL
   (FRA, UKV, NOE…) — v1 ou plus tard ?
7. **Stack** : réutiliser celle du projet précédent (Next.js, Supabase, Vercel), déjà maîtrisée ?
