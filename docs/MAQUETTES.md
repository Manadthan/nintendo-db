# Maquettes

> Version 0.3 — 16/11/2026 — statut : **validée** (#40, retour après l'import réel)
>
> | Version | Date | Changements |
> |---|---|---|
> | 0.3 | 16/11/2026 | Cadre de boîte Wii U : bandeau bleu « Wii U » au-dessus de chaque jaquette, réelle ou neutre (#40) |
> | 0.2 | 16/11/2026 | Retour du propriétaire (PR #3) : trame de gamecartdb, recherche dans le catalogue, région choisie sur la fiche ; écran de recherche séparé supprimé |
> | 0.1 | 16/11/2026 | 3 écrans : catalogue, fiche, recherche ; sélecteur de région global |

Canevas interactif (bouton Play : recherche au fil de la frappe, marché, tri ; une vignette ouvre la fiche,
où JAP / US / PAL change la jaquette) :
https://claude.ai/artifact/7Eve51uAdaqgkkz4G9fRvZ

Format : iPhone 12 mini, 375 × 812. Données réelles de la Wii U (Wikipédia) ; les jaquettes sont des
emplacements, remplacés par les jaquettes IGDB de chaque région à l'import.

## Écrans de la v1

| # | Écran | Route | User stories |
|---|---|---|---|
| 1 | Catalogue Wii U, trame de gamecartdb : en-tête (Catalogue, À propos), présentation, « Tous les jeux N », recherche, marché (Tous / Europe / Amérique du Nord / Japon), tri, filtres, grille/liste, « N affichés sur M », groupes par année ; vignette = jaquette, titre, date, disponibilité JAP · US · PAL | `/` → `/consoles/wii-u` | US-02, US-03, US-05, US-06 |
| 2 | Fiche : retour au catalogue, grande jaquette avec **JAP / US / PAL dessous**, titre et date de la version choisie, informations, disponibilité des 3 régions, sources | `/jeux/wii-u/[jeu]` | US-04, US-07 |

## Repris de gamecartdb (trame) et adapté

| gamecartdb | Nintendo DB |
|---|---|
| En-tête : Catalog, My library, Account | Catalogue, À propos (collection plus tard) |
| Bandeau « For physical collectors » | « Pour les collectionneurs » + phrase sur la Wii U |
| « Coming up », « Recently updated » | Non repris en v1 (catalogue figé, pas de sorties à venir) |
| « All releases 166 » + recherche, Market, Sort, Grid/List, Filters, « Showing N of M » | Identique, en français ; marché = filtre **et** version affichée |
| Groupes par mois | Groupes par année (la Wii U couvre 2012–2017) |
| Fiche : jaquette, bascule North America / Europe, détails, disponibilité ✓ | Identique avec **JAP / US / PAL** |

## Choix visuels

- Polices **Inter** (texte) et **Space Grotesk** (titres) ; fond gris clair `#F4F5F7`, cartes blanches.
- Un seul accent : bleu `#2541B2`.
- **Les jaquettes priment** : proportions de boîte Wii U (27 × 38), jamais recadrées, ombre douce sur la fiche.
- **Cadre de boîte** (v0.3) : bandeau **bleu `#0096D6`** en haut, « Wii U » en blanc à gauche (texte simple, pas le logo
  officiel), puis la jaquette dessous. Les jaquettes IGDB n'ont pas ce bandeau et sont un peu moins hautes qu'une boîte :
  bandeau + jaquette retrouvent la forme de la boîte. Même cadre pour la vignette neutre ; en liste, bandeau fin sans texte.
- Cibles tactiles ≥ 44 px ; champ de recherche en 16 px (évite le zoom automatique de Safari iOS).

## À faire après validation

- États complémentaires : vue liste, panneau des filtres, connexion, import, correction.
