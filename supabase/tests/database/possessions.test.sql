-- Étape 12 : collection privée (migration 0012). Deux comptes fictifs ; jeu de départ Splatoon (migration 0004).
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'autre@test.local');

-- Le propriétaire coche Splatoon PAL et JAP.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$insert into public.possessions (game_id, region) select id, 'PAL' from public.games where slug = 'splatoon'$$,
  'le propriétaire coche une version'
);
insert into public.possessions (game_id, region) select id, 'JAP' from public.games where slug = 'splatoon';
select is((select count(*)::int from public.possessions), 2, 'il voit ses 2 versions');
select throws_ok(
  $$insert into public.possessions (game_id, region) select id, 'PAL' from public.games where slug = 'splatoon'$$,
  '23505', null, 'une version ne se coche qu''une fois'
);
select throws_ok(
  $$insert into public.possessions (user_id, game_id, region)
    select '00000000-0000-0000-0000-0000000000b2', id, 'US' from public.games where slug = 'splatoon'$$,
  '42501', null, 'il ne peut pas écrire dans la collection d''un autre'
);

-- Un autre compte ne voit ni ne retire rien de la collection du propriétaire.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';
select is_empty('select * from public.possessions', 'un autre compte ne voit pas la collection');
select is_empty('delete from public.possessions returning game_id', 'un autre compte ne peut rien retirer');

-- Un visiteur ne voit rien.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is_empty('select * from public.possessions', 'un visiteur ne voit rien de la collection');

-- Supprimer le jeu retire ses versions de la collection (US-16).
reset role;
delete from public.games where slug = 'splatoon';
select is((select count(*)::int from public.possessions), 0, 'la collection suit la suppression du jeu');

select * from finish();
rollback;
