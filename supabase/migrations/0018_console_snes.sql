-- Étape 20 (SPEC v1.25, DESIGN v1.14) : Super Nintendo, importée de la liste Wikipédia ; boîtes libretro-thumbnails.
-- Ordre chronologique : Game Boy (1989), Super Nintendo (1990), Virtual Boy (1995), N64 (1996).
update public.consoles set ordre = -6 where slug = 'gb';

insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('snes', 'Super Nintendo', 'salon', 1990, -5, 'https://en.wikipedia.org/wiki/List_of_Super_Nintendo_Entertainment_System_games', null)
on conflict (slug) do nothing;
