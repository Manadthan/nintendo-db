-- Étape 28 (migration 0028, ADR-18 point 4) : captures RAWG d'un jeu, lues par tous, écrites par le propriétaire.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public', 'captures', 'table captures');
select has_column('public', 'games', 'rawg_slug', 'slug RAWG du jeu');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'collectionneur@test.local');
insert into public.profils (user_id, pseudo, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Patron', 'proprietaire'),
  ('00000000-0000-0000-0000-0000000000c1', 'Lea-64', 'collectionneur');

select throws_ok(
  $$insert into public.captures (game_id, position, url)
    select id, 1, 'https://exemple.com/image.jpg' from public.games where slug = 'splatoon'$$,
  '23514', null, 'une image hors de media.rawg.io est refusée'
);
select throws_ok(
  $$insert into public.captures (game_id, position, url)
    select id, 7, 'https://media.rawg.io/media/screenshots/a/b.jpg' from public.games where slug = 'splatoon'$$,
  '23514', null, 'pas plus de 6 captures'
);
select throws_ok(
  $$update public.games set rawg_slug = 'Pas Un Slug' where slug = 'splatoon'$$,
  '23514', null, 'un slug RAWG mal formé est refusé'
);

-- Le propriétaire connecté écrit.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$insert into public.captures (game_id, position, url, largeur, hauteur)
    select id, 1, 'https://media.rawg.io/media/screenshots/a1/b2c3.jpg', 1280, 720 from public.games where slug = 'splatoon'$$,
  'le propriétaire ajoute une capture'
);
select lives_ok(
  $$update public.games set rawg_slug = 'splatoon' where slug = 'splatoon'$$,
  'le propriétaire renseigne le slug RAWG'
);

-- Un collectionneur lit mais n'écrit pas.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select throws_ok(
  $$insert into public.captures (game_id, position, url)
    select id, 2, 'https://media.rawg.io/media/screenshots/a1/x.jpg' from public.games where slug = 'splatoon'$$,
  '42501', null, 'un collectionneur n''ajoute pas de capture'
);
select is_empty(
  $$delete from public.captures returning position$$,
  'un collectionneur ne supprime pas de capture'
);

-- Un visiteur lit.
reset role;
set local role anon;
select is((select count(*)::int from public.captures), 1, 'un visiteur voit les captures');

-- Le jeu supprimé emporte ses captures.
reset role;
delete from public.games where slug = 'splatoon';
select is((select count(*)::int from public.captures), 0, 'les captures partent avec le jeu');

select * from finish();
rollback;
