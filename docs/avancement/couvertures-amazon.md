# Avancement — Couvertures Amazon Japon des guides (reprise de l'étape 29)

> Fichier propre à ce chantier : jamais de détail dans l'Avancement de CLAUDE.md (conflits du 25/11/2026).

- étude du 26/11 (lecture seule) : 45 guides sans Google Books → 45 couvertures Amazon ; les 114 autres comparés :
  Amazon ≈ 350 × 500 contre 300 × 427 chez Google, même visuel, pour les 114
- décidé le 26/11 : Amazon pour les 159 guides, copiées dans notre stockage, mention « Couverture : Amazon.co.jp »,
  pas de programme Partenaires (risque des conditions d'Amazon accepté) ; planche des 45 : toutes gardées
- SPEC v1.52 (US-27) et DESIGN v1.46 (ADR-19 point 2) #281 ; migration 0035 #282
- script `couvertures-amazon.mjs` #285 : planche des 159 le 26/11 (159 couvertures, toutes gardées) ; écriture du
  26/11 : 159 couvertures copiées (WebP ≈ 352 × 500, bucket `guides`, `guides.couverture` = `{isbn}-1.webp`)
- à faire : affichage #286, bilan
