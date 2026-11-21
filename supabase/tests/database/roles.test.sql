-- Étape 27 (migration 0024, ADR-16 point 1) : seul le rôle « proprietaire » écrit le catalogue, les jaquettes et les
-- exclusions, et lit le relais ; un collectionneur ne garde que sa collection et son profil.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'collectionneur@test.local');
insert into public.profils (user_id, pseudo, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Patron', 'proprietaire'),
  ('00000000-0000-0000-0000-0000000000c1', 'Lea-64', 'collectionneur');

select throws_ok(
  $$insert into public.profils (user_id, pseudo) values ('00000000-0000-0000-0000-0000000000a1', 'a b')$$,
  '23514', null, 'un pseudo hors lettres, chiffres et tirets est refusé'
);
select throws_ok(
  $$update public.profils set pseudo = 'patron' where pseudo = 'Lea-64'$$,
  '23505', null, 'un pseudo est unique sans distinction de majuscules'
);

-- Un collectionneur connecté.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select ok(not public.est_proprietaire(), 'un collectionneur n''est pas propriétaire');
select throws_ok(
  $$insert into public.games (console_id, slug) select id, 'jeu-pirate' from public.consoles where slug = 'wii-u'$$,
  '42501', null, 'un collectionneur ne crée pas de jeu'
);
select is_empty(
  $$update public.games set developpeur = 'Pirate' where slug = 'splatoon' returning slug$$,
  'un collectionneur ne modifie pas un jeu'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('jaquettes', 'pirate/pal-600.webp')$$,
  '42501', null, 'un collectionneur ne dépose pas de jaquette'
);
select is_empty(
  $$select name from storage.objects where bucket_id = 'gametdb'$$,
  'un collectionneur ne lit pas le relais GameTDB'
);
select results_eq(
  $$select pseudo::text from public.profils$$, $$values ('Lea-64')$$,
  'un collectionneur ne lit que son profil'
);
select lives_ok(
  $$update public.profils set pseudo = 'Lea', avatar = 'etoile', public = true where pseudo = 'Lea-64'$$,
  'il modifie son pseudo, son avatar et la visibilité'
);
select throws_ok(
  $$update public.profils set role = 'proprietaire' where pseudo = 'Lea'$$,
  '42501', null, 'il ne peut pas se donner le rôle de propriétaire'
);
select lives_ok(
  $$insert into public.possessions (game_id, region) select id, 'PAL' from public.games where slug = 'splatoon'$$,
  'il tient sa collection'
);

-- Le propriétaire connecté.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select ok(public.est_proprietaire(), 'le propriétaire est reconnu');
select is((select count(*)::int from public.profils), 2, 'le propriétaire lit tous les profils');

select * from finish();
rollback;
