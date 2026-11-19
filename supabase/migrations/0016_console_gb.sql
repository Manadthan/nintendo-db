-- Étape 18 (SPEC v1.23, DESIGN v1.12) : Game Boy, importé de la liste Wikipédia ; boîtes libretro-thumbnails et
-- séries No-Intro (ADR-09, ADR-10). Ordre chronologique : Game Boy (1989) en tête, avant la N64 (1996).
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('gb', 'Game Boy', 'portable', 1989, -4, 'https://en.wikipedia.org/wiki/List_of_Game_Boy_games', null)
on conflict (slug) do nothing;
