-- Étape 8 (SPEC v1.9, DESIGN v1.2) : la Wii, importée depuis GameTDB seul (pas de liste Wikipédia ni d'IGDB).
-- Ordre chronologique des consoles : Wii (2006), puis Wii U (2012).
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('wii', 'Wii', 'salon', 2006, 1, null, null)
on conflict (slug) do nothing;

update public.consoles set ordre = 2 where slug = 'wii-u';
