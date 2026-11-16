-- Test de départ (#16) : la base locale démarre et pgTAP fonctionne.
-- Les tests du schéma et de la RLS arrivent avec #17, ceux du stockage avec #18.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select has_schema('public', 'le schéma public existe');
select has_schema('storage', 'le stockage Supabase est disponible (jaquettes, #18)');

select * from finish();
rollback;
