-- Étape 17 (SPEC v1.22, DESIGN v1.11 ADR-12) : Game Boy Color, importée de la liste Wikipédia ; boîtes
-- libretro-thumbnails et séries No-Intro (ADR-09, ADR-10). Ordre chronologique : N64 (1996), GBC (1998), GBA (2001).
update public.consoles set ordre = -3 where slug = 'n64';

insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('gbc', 'Game Boy Color', 'portable', 1998, -2, 'https://en.wikipedia.org/wiki/List_of_Game_Boy_Color_games', null)
on conflict (slug) do nothing;
