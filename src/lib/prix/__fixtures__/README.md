# Fixtures des prix eBay (US-25, DESIGN ADR-17)

Les tests ne contactent jamais eBay ni la BCE.

| Fichier | Contenu |
|---|---|
| `browse-super-mario-galaxy-us.json` | Réponse **écrite à la main** au format de la Browse API (`item_summary/search`, champs utiles seulement), titres du genre de ceux relevés par l'étude du 22/11/2026 (DESIGN §1 quindecies) : 6 annonces pertinentes, 6 écartées (autre jeu, lot, guide, boîte vide, japonaise, PAL), 1 sans prix |
| `eurofxref-daily.xml` | Taux de référence de la BCE, au format de `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml` (valeurs arrondies, écrites à la main) |
