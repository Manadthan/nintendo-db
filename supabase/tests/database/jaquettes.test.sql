-- Tests du stockage des jaquettes (#18, ADR-04) : bucket public, écriture réservée au propriétaire.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select ok((select public from storage.buckets where id = 'jaquettes'), 'le bucket jaquettes est public (lecture par URL)');
select is(
  (select allowed_mime_types from storage.buckets where id = 'jaquettes'),
  array['image/webp'],
  'seules les images WebP sont acceptées'
);
select is(
  (select file_size_limit from storage.buckets where id = 'jaquettes'),
  1048576::bigint,
  'une jaquette pèse 1 Mo au plus'
);

-- Étape 27 (migration 0024) : l'écriture est réservée au compte de rôle « proprietaire ».
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'proprietaire@test.local');
insert into public.profils (user_id, pseudo, role)
  values ('00000000-0000-0000-0000-00000000000a', 'proprietaire-test', 'proprietaire');
-- Le propriétaire, connecté, dépose une jaquette.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('jaquettes', '20000000-0000-0000-0000-000000000001/pal-600.webp')$$,
  'le propriétaire dépose une jaquette'
);

-- Un visiteur non connecté ne dépose ni ne modifie rien.
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('jaquettes', '20000000-0000-0000-0000-000000000001/us-600.webp')$$,
  '42501', null, 'un visiteur ne peut pas déposer de jaquette'
);
-- (La suppression directe en SQL est interdite par Supabase : elle sera testée via l'API avec l'import.)
select is_empty(
  $$update storage.objects set name = '20000000-0000-0000-0000-000000000001/vol.webp'
    where bucket_id = 'jaquettes' returning name$$,
  'un visiteur ne peut pas remplacer une jaquette'
);

select * from finish();
rollback;
