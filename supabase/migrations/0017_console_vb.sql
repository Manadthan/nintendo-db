-- Étape 19 (SPEC v1.24, DESIGN v1.13) : Virtual Boy, importé de la liste Wikipédia ; boîtes libretro-thumbnails et
-- séries No-Intro. Japon et États-Unis seulement. Ordre chronologique : Game Boy (1989), Virtual Boy (1995), N64 (1996).
update public.consoles set ordre = -5 where slug = 'gb';

insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('vb', 'Virtual Boy', 'portable', 1995, -4, 'https://en.wikipedia.org/wiki/List_of_Virtual_Boy_games', null)
on conflict (slug) do nothing;
