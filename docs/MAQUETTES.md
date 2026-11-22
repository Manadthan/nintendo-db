# Maquettes

> Version 0.10 — 22/11/2026 — statut : **à valider**
>
> | Version | Date | Changements |
> |---|---|---|
> | 0.10 | 22/11/2026 | **Prix eBay** (US-25, SPEC v1.42) : bloc de la fiche sous « Disponibilité », une ligne par région, version choisie surlignée, cas « pas assez d'annonces », « non sorti », chargement (`maquettes/prix-ebay.png`) |
> | 0.9 | 21/11/2026 | **Collectionneurs invités** (étape 27, SPEC v1.39) : mon profil, profil public, page « Collectionneurs » de l'administration, bienvenue ; validées (`maquettes/collectionneur-*.png`). Invitation par **lien à partager** (choisi après la maquette : le champ e-mail de la page Collectionneurs devient un nom, l'e-mail est saisi par l'invité sur la page Bienvenue) |
> | 0.8 | 21/11/2026 | **Frise** (US-02, SPEC v1.38) : 3e vue du catalogue, validée à la 3e version (`maquettes/frise.png`) : grandes jaquettes en alternance gauche / droite, titre et console dessous, année seule au centre |
> | 0.7 | 19/11/2026 | **Statistiques** (US-18) : page de l'administration en 4 blocs, validée sur maquette (`maquettes/statistiques.png`) |
> | 0.6 | 17/11/2026 | **Thème sombre** (anthracite doux, accent éclairci) et **logo cartouche** dans l'en-tête, validés sur captures (#49) |
> | 0.5 | 17/11/2026 | Fiche : grande jaquette **presque pleine largeur** (≈ 340 px sur iPhone 12 mini), en HD, comme gamecartdb |
> | 0.4 | 16/11/2026 | Jaquette = **scan de la vraie boîte**, bandeau Wii U compris ; aucun bandeau dessiné par le site (#40) |
> | 0.3 | 16/11/2026 | *(abandonnée)* Cadre de boîte Wii U : bandeau bleu « Wii U » au-dessus de chaque jaquette, réelle ou neutre (#40) |
> | 0.2 | 16/11/2026 | Retour du propriétaire (PR #3) : trame de gamecartdb, recherche dans le catalogue, région choisie sur la fiche ; écran de recherche séparé supprimé |
> | 0.1 | 16/11/2026 | 3 écrans : catalogue, fiche, recherche ; sélecteur de région global |

Canevas interactif (bouton Play : recherche au fil de la frappe, marché, tri ; une vignette ouvre la fiche,
où JAP / US / PAL change la jaquette) :
https://claude.ai/artifact/7Eve51uAdaqgkkz4G9fRvZ

Format : iPhone 12 mini, 375 × 812. Données réelles de la Wii U (Wikipédia) ; les jaquettes sont des
emplacements, remplacés par les scans de boîtes GameTDB de chaque région à l'import.

## Écrans de la v1

| # | Écran | Route | User stories |
|---|---|---|---|
| 1 | Catalogue Wii U, trame de gamecartdb : en-tête (Catalogue, À propos), présentation, « Tous les jeux N », recherche, marché (Tous / Europe / Amérique du Nord / Japon), tri, filtres, grille/liste, « N affichés sur M », groupes par année ; vignette = jaquette, titre, date, disponibilité JAP · US · PAL | `/` → `/consoles/wii-u` | US-02, US-03, US-05, US-06 |
| 2 | Fiche : retour au catalogue, grande jaquette avec **JAP / US / PAL dessous**, titre et date de la version choisie, informations, disponibilité des 3 régions, sources | `/jeux/wii-u/[jeu]` | US-04, US-07 |
| 5 | Mon profil : pseudo, avatar, profil public, collection, badges et prochains badges, derniers ajouts ; [`maquettes/collectionneur-profil.png`](maquettes/collectionneur-profil.png) | `/profil` | US-21, US-22, US-24 |
| 6 | Profil public : badges, collection, jeux possédés par console ; [`maquettes/collectionneur-public.png`](maquettes/collectionneur-public.png) | `/collectionneurs/[pseudo]` | US-23 |
| 7 | Collectionneurs (administration) : inviter, invitations en attente, comptes ; [`maquettes/collectionneur-invitation.png`](maquettes/collectionneur-invitation.png) | `/admin/collectionneurs` | US-19 |
| 8 | Bienvenue : pseudo, mot de passe, avatar ; [`maquettes/collectionneur-bienvenue.png`](maquettes/collectionneur-bienvenue.png) | `/bienvenue/[jeton]` | US-20 |
| 4 | Frise (vue du catalogue) : ligne verticale, jeux en alternance gauche / droite, année au centre ; image : [`maquettes/frise.png`](maquettes/frise.png) | `/` (bouton « Frise ») | US-02 |
| 9 | Fiche, bloc « Prix eBay » : prix demandé par région, nombre d'annonces, lien vers les ventes eBay ; [`maquettes/prix-ebay.png`](maquettes/prix-ebay.png) | `/jeux/[console]/[jeu]` | US-25 |
| 3 | Statistiques (administration) : ma collection par console, par région, notes Metacritic, état du catalogue avec liens vers les listes ; image : [`maquettes/statistiques.png`](maquettes/statistiques.png) | `/admin/statistiques` | US-18 |

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
  sans scan de boîte est **à remplacer** par un scan, photo ou adresse (US-12).
- **Thème sombre** (v0.6, US-08) : fond anthracite `#1C1F26`, cartes `#252931`, accent éclairci `#8EA2FF` (lisible
  sur fond sombre) ; bouton ◐ dans l'en-tête : automatique → clair → sombre.
- **Logo** (v0.6, US-15) : cartouche grise, étiquette bleue « DB », touche jaune, à gauche du nom ; icône d'onglet
  (silhouette) et d'écran d'accueil (sur carré bleu).
- Cibles tactiles ≥ 44 px ; champ de recherche en 16 px (évite le zoom automatique de Safari iOS).

## À faire après validation

- États complémentaires : vue liste, panneau des filtres, connexion, import, correction.
