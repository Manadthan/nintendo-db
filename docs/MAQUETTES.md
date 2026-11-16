# Maquettes

> Version 0.1 — 16/11/2026 — statut : **à valider**

Canevas interactif (bouton Play : la bascule JAP / US / PAL fonctionne, une vignette ouvre la fiche,
la loupe ouvre la recherche) :
https://claude.ai/artifact/7Eve51uAdaqgkkz4G9fRvZ

Format : iPhone 12 mini, 375 × 812. Données réelles de la Wii U (Wikipédia) ; les jaquettes sont des
emplacements, remplacés par les jaquettes IGDB de chaque région à l'import.

## Écrans de la v1

| # | Écran | Route | User stories |
|---|---|---|---|
| 1 | Catalogue Wii U : grille 2 colonnes, groupes par année, tri, filtres, grille/liste, jeux non sortis grisés en fin de liste | `/` → `/consoles/wii-u` | US-02, US-03, US-06 |
| 2 | Fiche d'un jeu : grande jaquette, titre de la région (+ titre international sous le japonais), date, « Les 3 régions », informations, sources | `/jeux/wii-u/[jeu]` | US-04, US-07 |
| 3 | Recherche : champ en haut, résultats avec vignette, titre de la région et année | `/recherche?q=` | US-05 |

## Choix visuels

- Polices **Inter** (texte) et **Space Grotesk** (titres) ; fond gris clair `#F4F5F7`, cartes blanches.
- Un seul accent : bleu `#2541B2` (liens, date de sortie, région active dans le tableau).
- **Sélecteur JAP / US / PAL** en haut de chaque écran, à portée de pouce, région active en blanc.
- **Les jaquettes priment** : proportions de boîte Wii U respectées (27 × 38), jamais recadrées, ombre douce sur la fiche.
- Mention de la source sous la jaquette (« Jaquette : IGDB ») et en bas de la fiche.
- Cibles tactiles ≥ 44 px ; champ de recherche en 16 px (évite le zoom automatique de Safari iOS).

## Écarts proposés par rapport à la spec

- **US-04, onglets de la fiche** : le tableau « Les 3 régions » compare déjà les régions sans changer celle
  du site ; les onglets feraient double emploi. Proposition : retirer ce critère (à valider).

## À faire après validation

- États complémentaires : vue liste, panneau des filtres, recherche sans résultat, connexion, import, correction.
