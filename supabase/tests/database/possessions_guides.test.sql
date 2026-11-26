-- Guides possédés (migration 0037) : collection privée par compte, RLS et suppression en cascade.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'autre@test.local');

insert into public.guides (isbn, titre) values
  ('9784047336926', 'PIKMIN4パーフェクトガイド');

-- Le propriétaire coche le guide.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$insert into public.possessions_guides (guide_id) select id from public.guides where isbn = '9784047336926'$$,
  'le propriétaire coche un guide'
);
select is((select count(*)::int from public.possessions_guides), 1, 'il voit son guide possédé');
select throws_ok(
  $$insert into public.possessions_guides (guide_id) select id from public.guides where isbn = '9784047336926'$$,
  '23505', null, 'un guide ne se coche qu''une fois'
);
select throws_ok(
  $$insert into public.possessions_guides (user_id, guide_id)
    select '00000000-0000-0000-0000-0000000000b2', id from public.guides where isbn = '9784047336926'$$,
  '42501', null, 'il ne peut pas écrire dans la collection d''un autre'
);

-- Un autre compte ne voit ni ne retire rien de la collection du propriétaire.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';
select is_empty('select * from public.possessions_guides', 'un autre compte ne voit pas la collection de guides');
select is_empty('delete from public.possessions_guides returning guide_id', 'un autre compte ne peut rien retirer');

-- Un visiteur ne voit rien.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is_empty('select * from public.possessions_guides', 'un visiteur ne voit rien de la collection de guides');

-- Supprimer le guide retire sa possession en cascade.
reset role;
delete from public.guides where isbn = '9784047336926';
select is((select count(*)::int from public.possessions_guides), 0, 'la possession suit la suppression du guide');

select * from finish();
rollback;
