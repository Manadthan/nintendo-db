-- Données de départ (#24) : 4 jeux Wii U réels, pour voir et tester le catalogue avant l'import (étape 4).
-- Dates : Wikipédia, « List of Wii U games » (colonnes Japan / North America / Europe), copie du 16/11/2026.
-- Titres japonais à confirmer par IGDB à l'import, qui complétera ces jeux sans les dupliquer (même slug).
-- Choisis pour couvrir les cas du catalogue : titres différents selon la région (Kirby),
-- jeu non sorti dans une région (Wii Karaoke U, jamais sorti en Amérique du Nord).

with wii_u as (select id from public.consoles where slug = 'wii-u'),
jeux as (
  insert into public.games (console_id, slug, developpeur, franchise, wikipedia_url)
  select wii_u.id, j.slug, j.developpeur, j.franchise, j.wikipedia_url
  from wii_u, (values
    ('mario-kart-8', 'Nintendo EAD, Bandai Namco Studios', 'Mario Kart', 'https://en.wikipedia.org/wiki/Mario_Kart_8'),
    ('splatoon', 'Nintendo EAD', 'Splatoon', 'https://en.wikipedia.org/wiki/Splatoon_(video_game)'),
    ('kirby-and-the-rainbow-paintbrush', 'HAL Laboratory, Nintendo SPD', 'Kirby', 'https://en.wikipedia.org/wiki/Kirby_and_the_Rainbow_Curse'),
    ('wii-karaoke-u', 'Xing', null, 'https://en.wikipedia.org/wiki/Wii_Karaoke_U')
  ) as j (slug, developpeur, franchise, wikipedia_url)
  on conflict (console_id, slug) do nothing
  returning id, slug
)
insert into public.releases (game_id, region, sortie, titre, titre_romanise, date_sortie, precision_date, editeur)
select jeux.id, s.region::public.region, s.sortie, s.titre, s.titre_romanise, s.date_sortie::date,
       case when s.date_sortie is null then null else 'jour'::public.precision_date end,
       case when s.sortie then 'Nintendo' end
from jeux
join (values
  ('mario-kart-8', 'JAP', true, 'マリオカート8', 'Mario Kart 8', '2014-05-29'),
  ('mario-kart-8', 'US', true, 'Mario Kart 8', null, '2014-05-30'),
  ('mario-kart-8', 'PAL', true, 'Mario Kart 8', null, '2014-05-30'),
  ('splatoon', 'JAP', true, 'スプラトゥーン', 'Splatoon', '2015-05-28'),
  ('splatoon', 'US', true, 'Splatoon', null, '2015-05-29'),
  ('splatoon', 'PAL', true, 'Splatoon', null, '2015-05-29'),
  ('kirby-and-the-rainbow-paintbrush', 'JAP', true, 'タッチ! カービィ スーパーレインボー', 'Touch! Kirby Super Rainbow', '2015-01-22'),
  ('kirby-and-the-rainbow-paintbrush', 'US', true, 'Kirby and the Rainbow Curse', null, '2015-02-20'),
  ('kirby-and-the-rainbow-paintbrush', 'PAL', true, 'Kirby and the Rainbow Paintbrush', null, '2015-05-08'),
  ('wii-karaoke-u', 'JAP', true, 'Wii カラオケ U', 'Wii Karaoke U', '2012-12-08'),
  ('wii-karaoke-u', 'US', false, null, null, null),
  ('wii-karaoke-u', 'PAL', true, 'Wii Karaoke U', null, '2013-10-04')
) as s (slug, region, sortie, titre, titre_romanise, date_sortie) on s.slug = jeux.slug;
