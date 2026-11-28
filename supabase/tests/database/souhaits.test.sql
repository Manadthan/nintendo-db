-- Liste de souhaits (migration 0038) : jeux, amiibo et guides, RLS privée, exclusivité mutuelle et cascades.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'autre@test.local');

insert into public.amiibo (identifiant, slug, nom, type) values
  ('0102030405060708', 'mario-souhait-test', 'Mario Test', 'figurine');

insert into public.guides (isbn, titre) values
  ('9784047336926', 'PIKMIN4パーフェクトガイド');

-- Compte propriétaire : jeux, amiibo et guides en liste de souhaits.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';

-- 1. Jeux : ajout, doublon, exclusivité mutuelle avec possessions.
select lives_ok(
  $$insert into public.souhaits (game_id, region) select id, 'PAL'::public.region from public.games where slug = 'splatoon'$$,
  'ajoute une version de jeu en liste de souhaits'
);
select throws_ok(
  $$insert into public.souhaits (game_id, region) select id, 'PAL'::public.region from public.games where slug = 'splatoon'$$,
  '23505', null, 'une version de jeu ne se souhaite qu''une fois'
);
select lives_ok(
  $$insert into public.possessions (game_id, region) select id, 'PAL'::public.region from public.games where slug = 'splatoon'$$,
  'cocher « Je l''ai » fonctionne sur un jeu souhaité'
);
select is_empty('select * from public.souhaits', 'cocher « Je l''ai » retire le jeu de la liste de souhaits');
select lives_ok(
  $$insert into public.souhaits (game_id, region) select id, 'PAL'::public.region from public.games where slug = 'splatoon'$$,
  're-souhaiter un jeu possédé fonctionne'
);
select is_empty('select * from public.possessions', 'souhaiter un jeu possédé retire sa possession');
select throws_ok(
  $$insert into public.souhaits (user_id, game_id, region)
    select '00000000-0000-0000-0000-0000000000b2', id, 'PAL'::public.region from public.games where slug = 'splatoon'$$,
  '42501', null, 'impossible d''écrire dans la liste de souhaits d''un autre'
);

-- 2. Amiibo : ajout, exclusivité mutuelle avec possessions_amiibo.
select lives_ok(
  $$insert into public.souhaits_amiibo (amiibo_id) select id from public.amiibo where slug = 'mario-souhait-test'$$,
  'ajoute un amiibo en liste de souhaits'
);
select lives_ok(
  $$insert into public.possessions_amiibo (amiibo_id) select id from public.amiibo where slug = 'mario-souhait-test'$$,
  'cocher « Je l''ai » fonctionne sur un amiibo souhaité'
);
select is_empty('select * from public.souhaits_amiibo', 'cocher « Je l''ai » retire l''amiibo de la liste de souhaits');
select lives_ok(
  $$insert into public.souhaits_amiibo (amiibo_id) select id from public.amiibo where slug = 'mario-souhait-test'$$,
  'souhaiter un amiibo possédé fonctionne'
);
select is_empty('select * from public.possessions_amiibo', 'souhaiter un amiibo possédé retire sa possession');

-- 3. Guides : ajout, exclusivité mutuelle avec possessions_guides.
select lives_ok(
  $$insert into public.souhaits_guides (guide_id) select id from public.guides where isbn = '9784047336926'$$,
  'ajoute un guide en liste de souhaits'
);
select lives_ok(
  $$insert into public.possessions_guides (guide_id) select id from public.guides where isbn = '9784047336926'$$,
  'cocher « Je l''ai » fonctionne sur un guide souhaité'
);
select is_empty('select * from public.souhaits_guides', 'cocher « Je l''ai » retire le guide de la liste de souhaits');
select lives_ok(
  $$insert into public.souhaits_guides (guide_id) select id from public.guides where isbn = '9784047336926'$$,
  'souhaiter un guide possédé fonctionne'
);
select is_empty('select * from public.possessions_guides', 'souhaiter un guide possédé retire sa possession');

-- 4. Isolation RLS : un autre compte ne voit rien.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';
select is_empty('select * from public.souhaits', 'un autre compte ne voit pas les jeux souhaités');
select is_empty('select * from public.souhaits_amiibo', 'un autre compte ne voit pas les amiibo souhaités');
select is_empty('select * from public.souhaits_guides', 'un autre compte ne voit pas les guides souhaités');

-- 5. Visiteur (anon) : ne voit rien.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is_empty('select * from public.souhaits', 'un visiteur ne voit pas les souhaits');

-- 6. Cascade à la suppression.
reset role;
delete from public.guides where isbn = '9784047336926';
select is((select count(*)::int from public.souhaits_guides), 0, 'le souhait suit la suppression du guide');

select * from finish();
rollback;
