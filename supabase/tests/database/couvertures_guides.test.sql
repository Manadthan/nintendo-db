-- Migration 0035 (ADR-19 point 2 révisé) : couvertures des guides copiées dans le bucket public « guides », écrites par
-- le propriétaire seulement ; chemin de la copie dans guides.couverture.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_column('public', 'guides', 'couverture', 'colonne guides.couverture');
select ok((select public from storage.buckets where id = 'guides'), 'le bucket guides est public (lecture par URL)');
select is(
  (select allowed_mime_types from storage.buckets where id = 'guides'),
  array['image/webp'],
  'seules les images WebP sont acceptées'
);

select throws_ok(
  $$insert into public.guides (isbn, titre, couverture) values ('9784047336926', 'Chemin libre', 'amazon.jpg')$$,
  '23514', null, 'un chemin de couverture mal formé est refusé'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'collectionneur@test.local');
insert into public.profils (user_id, pseudo, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Patron', 'proprietaire'),
  ('00000000-0000-0000-0000-0000000000c1', 'Lea-64', 'collectionneur');
insert into public.guides (isbn, titre) values ('9784047336926', 'PIKMIN4パーフェクトガイド');

-- Le propriétaire dépose la couverture et l'enregistre sur le guide.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('guides', '9784047336926-1.webp')$$,
  'le propriétaire dépose une couverture'
);
select lives_ok(
  $$update public.guides set couverture = '9784047336926-1.webp' where isbn = '9784047336926'$$,
  'le propriétaire enregistre le chemin de la couverture'
);

-- Un collectionneur ne dépose rien.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('guides', '9784047336926-2.webp')$$,
  '42501', null, 'un collectionneur ne dépose pas de couverture'
);

-- Un visiteur lit le chemin mais ne dépose rien.
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(
  (select couverture from public.guides where isbn = '9784047336926'),
  '9784047336926-1.webp',
  'un visiteur lit le chemin de la couverture'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('guides', '9784047336926-3.webp')$$,
  '42501', null, 'un visiteur ne dépose pas de couverture'
);

select * from finish();
rollback;
