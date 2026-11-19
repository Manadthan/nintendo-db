-- Étape 14 (SPEC v1.18, DESIGN v1.8 ADR-09) : Nintendo 64 et Game Boy Advance, importées des listes Wikipédia ;
-- jaquettes de libretro-thumbnails (nouvelle source). Ordre chronologique : N64 (1996), GBA (mars 2001), puis GameCube.
alter type public.jaquette_source add value if not exists 'libretro' after 'igdb';

insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values
  ('n64', 'Nintendo 64', 'salon', 1996, -2, 'https://en.wikipedia.org/wiki/List_of_Nintendo_64_games', null),
  ('gba', 'Game Boy Advance', 'portable', 2001, -1, 'https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games', null)
on conflict (slug) do nothing;
