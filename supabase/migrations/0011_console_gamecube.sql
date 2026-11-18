-- Étape 11 (SPEC v1.13, DESIGN v1.5) : GameCube, importée depuis GameTDB seul (base Wii avec la GameCube). Ordre
-- chronologique : avant la DS (2004), première console du catalogue.
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('gamecube', 'GameCube', 'salon', 2001, 0, null, null)
on conflict (slug) do nothing;
