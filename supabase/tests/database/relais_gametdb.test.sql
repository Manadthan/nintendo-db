-- Relais GameTDB (#53) : bucket privé, lu par le propriétaire, jamais écrit ni lu par un visiteur.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select ok(not (select public from storage.buckets where id = 'gametdb'), 'le bucket gametdb est privé');
select is(
  (select allowed_mime_types from storage.buckets where id = 'gametdb'),
  array['application/xml', 'image/jpeg', 'application/json'],
  'seuls la base XML, les scans JPEG et les résultats JSON du relais RAWG (migration 0029) sont acceptés'
);
select policies_are(
  'storage', 'objects',
  array(
    select policyname::text from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname not like 'gametdb%'
  ) || array['gametdb : lecture propriétaire'],
  'une seule politique pour gametdb : la lecture par le propriétaire'
);

select * from finish();
rollback;
