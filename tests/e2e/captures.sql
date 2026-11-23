-- Captures de test (US-26) pour la base locale et jetable des tests e2e (jamais la production) : 3 captures RAWG
-- pour Mario Kart 8 (jeu de départ, migration 0004). Les images sont interceptées par Playwright (captures.spec.ts).
-- Chargé par la CI (ci.yml, job e2e) avant le build, qui prépare les fiches à l'avance.
update public.games set rawg_slug = 'mario-kart-8' where slug = 'mario-kart-8';
insert into public.captures (game_id, position, url, largeur, hauteur)
select id, p, format('https://media.rawg.io/media/screenshots/e2e/capture-%s.jpg', p), 1280, 720
from public.games, generate_series(1, 3) as p
where slug = 'mario-kart-8'
on conflict (game_id, position) do nothing;
