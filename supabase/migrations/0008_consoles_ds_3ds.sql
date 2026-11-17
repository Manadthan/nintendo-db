-- Étape 9 (SPEC v1.10, DESIGN v1.3) : DS et 3DS, importées depuis GameTDB seul. Ordre chronologique des consoles :
-- DS (2004), Wii (2006), 3DS (2011), Wii U (2012).
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values
  ('ds', 'DS', 'portable', 2004, 1, null, null),
  ('3ds', '3DS', 'portable', 2011, 3, null, null)
on conflict (slug) do nothing;

update public.consoles set ordre = 2 where slug = 'wii';
update public.consoles set ordre = 4 where slug = 'wii-u';
