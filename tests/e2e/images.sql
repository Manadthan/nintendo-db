-- Images de test pour la base locale et jetable des tests e2e (jamais la production) : avec « Avec image uniquement »
-- cochée par défaut (SPEC v1.55), les 4 jeux de départ (migration 0004) et l'amiibo de test ont une image valide.
-- Source « igdb » pour les jeux : ils restent « à remplacer » sur /admin/jaquettes (US-12).
-- Les fichiers WebP correspondants sont déposés dans les buckets locaux par tests/e2e/global-setup.ts.
update public.releases
set jaquette_path = game_id::text || '/' || lower(region::text) || '-e2e',
    jaquette_source = 'igdb'
where sortie = true and jaquette_path is null;

update public.amiibo
set image_path = id::text || '/figurine-e2e'
where slug = 'inkling-e2e' and image_path is null;
