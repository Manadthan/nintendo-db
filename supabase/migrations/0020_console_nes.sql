-- Étape 21 (SPEC v1.27, DESIGN v1.15) : NES, importée de la liste Wikipédia ; boîtes libretro-thumbnails.
-- Ordre chronologique : NES (Famicom, 1983) en tête, avant le Game Boy (1989).
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('nes', 'NES', 'salon', 1983, -7, 'https://en.wikipedia.org/wiki/List_of_Nintendo_Entertainment_System_games', null)
on conflict (slug) do nothing;
