-- Étape 29 (migration 0031, ADR-19 point 1) : guides japonais, lus par tous, écrits par le propriétaire ; un guide peut
-- couvrir plusieurs jeux ; les guides écartés ne sont lisibles que par le propriétaire.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public', 'guides', 'table guides');
select has_table('public', 'guides_jeux', 'table guides_jeux');
select has_table('public', 'guides_exclus', 'table guides_exclus');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'collectionneur@test.local');
insert into public.profils (user_id, pseudo, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Patron', 'proprietaire'),
  ('00000000-0000-0000-0000-0000000000c1', 'Lea-64', 'collectionneur');

select throws_ok(
  $$insert into public.guides (isbn, titre) values ('4047336926', 'ISBN à 10 chiffres')$$,
  '23514', null, 'un ISBN à 10 chiffres est refusé (toujours 13)'
);
select throws_ok(
  $$insert into public.guides (isbn, titre, date_parution) values ('9784047336926', 'Sans précision', '2023-11-01')$$,
  '23514', null, 'une date sans précision est refusée'
);
select throws_ok(
  $$insert into public.guides (isbn, titre, google_books_id) values ('9784047336926', 'Mauvais id', 'pas un id!')$$,
  '23514', null, 'un identifiant Google Books mal formé est refusé'
);

-- Le propriétaire connecté écrit.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$insert into public.guides (isbn, titre, editeur, date_parution, precision_date, pages, google_books_id)
    values ('9784047336926', 'PIKMIN4パーフェクトガイド', 'KADOKAWA Game Linkage', '2023-11-01', 'mois', 367, 'W6E70AEACAAJ')$$,
  'le propriétaire ajoute un guide'
);
select throws_ok(
  $$insert into public.guides (isbn, titre) values ('9784047336926', 'Doublon')$$,
  '23505', null, 'un ISBN = un guide'
);
select lives_ok(
  $$insert into public.guides_jeux (guide_id, game_id)
    select g.id, j.id from public.guides g, public.games j
    where g.isbn = '9784047336926' and j.slug in ('splatoon', 'mario-kart-8')$$,
  'un guide couvre plusieurs jeux'
);
select lives_ok(
  $$insert into public.guides_exclus (isbn, raison) values ('9784047335379', 'artbook')$$,
  'le propriétaire écarte un guide'
);

-- Un collectionneur lit les guides mais n'écrit pas, et ne voit pas les guides écartés.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select throws_ok(
  $$insert into public.guides (isbn, titre) values ('9784091064868', 'Pas le propriétaire')$$,
  '42501', null, 'un collectionneur n''ajoute pas de guide'
);
select is_empty(
  $$delete from public.guides_jeux returning game_id$$,
  'un collectionneur ne retire pas de lien guide ↔ jeu'
);
select is((select count(*)::int from public.guides_exclus), 0, 'un collectionneur ne voit pas les guides écartés');

-- Un visiteur lit les guides et leurs jeux.
reset role;
set local role anon;
select is((select count(*)::int from public.guides), 1, 'un visiteur voit les guides');
select is((select count(*)::int from public.guides_jeux), 2, 'un visiteur voit les jeux couverts');
select throws_ok(
  $$insert into public.guides_exclus (isbn) values ('9784091064868')$$,
  '42501', null, 'un visiteur n''écarte pas de guide'
);

-- Un jeu supprimé emporte son lien, pas le guide ; un guide supprimé emporte ses liens.
reset role;
delete from public.games where slug = 'splatoon';
select is((select count(*)::int from public.guides_jeux), 1, 'le lien part avec le jeu, le guide reste');
delete from public.guides where isbn = '9784047336926';
select is((select count(*)::int from public.guides_jeux), 0, 'les liens partent avec le guide');

select * from finish();
rollback;
