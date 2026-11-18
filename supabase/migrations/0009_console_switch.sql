-- Étape 10 (SPEC v1.11, DESIGN v1.4) : Switch, importée depuis GameTDB seul. Ordre chronologique : après la Wii U.
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('switch', 'Switch', 'salon', 2017, 5, null, null)
on conflict (slug) do nothing;
