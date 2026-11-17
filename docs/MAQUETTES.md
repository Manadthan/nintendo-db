# Maquettes

> Version 0.5 — 17/11/2026 — statut : **validée**
>
> | Version | Date | Changements |
> |---|---|---|
> | 0.5 | 17/11/2026 | Fiche : grande jaquette **presque pleine largeur** (≈ 340 px sur iPhone 12 mini), en HD, comme gamecartdb |
> | 0.4 | 16/11/2026 | Jaquette = **scan de la vraie boîte**, bandeau Wii U compris ; aucun bandeau dessiné par le site (#40) |
> | 0.3 | 16/11/2026 | *(abandonnée)* Cadre de boîte Wii U : bandeau bleu « Wii U » au-dessus de chaque jaquette, réelle ou neutre (#40) |
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
- **Les jaquettes priment** : proportions de boîte Wii U (27 × 38), jamais recadrées, ombre douce sur la fiche ; sur la fiche, jaquette **presque pleine largeur** (marges de 16 px) et nette sur écran ×3 (v0.5).
- **Jaquette = scan de la vraie boîte** (v0.4) : bandeau Wii U, logo, PEGI/ESRB/CERO compris, tels qu'imprimés.
  Le site **ne dessine aucun bandeau** (essai v0.3 abandonné : un bandeau imité ne ressemble pas au vrai). Une image
  IGDB qui n'est qu'une illustration (sans bandeau) est **à remplacer** par un scan, photo ou adresse (US-12).
- Cibles tactiles ≥ 44 px ; champ de recherche en 16 px (évite le zoom automatique de Safari iOS).

## À faire après validation

- États complémentaires : vue liste, panneau des filtres, connexion, import, correction.
