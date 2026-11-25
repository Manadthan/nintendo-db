-- Étape 30 (migration 0033, ADR-21 point 1) : amiibo lus par tous, écrits par le propriétaire ; sorties par région ;
-- jeux compatibles du catalogue ou hors catalogue ; amiibo écartés et possessions visibles par leur seul titulaire.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

select has_table('public', 'amiibo', 'table amiibo');
select has_table('public', 'amiibo_sorties', 'table amiibo_sorties');
select has_table('public', 'amiibo_jeux', 'table amiibo_jeux');
select has_table('public', 'amiibo_exclus', 'table amiibo_exclus');
select has_table('public', 'possessions_amiibo', 'table possessions_amiibo');
select enum_has_labels('public', 'amiibo_type', array['figurine', 'carte', 'peluche', 'bracelet', 'bloc'],
  'cinq types d''amiibo');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'collectionneur@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'autre@test.local');
insert into public.profils (user_id, pseudo, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Patron', 'proprietaire'),
  ('00000000-0000-0000-0000-0000000000c1', 'Lea-64', 'collectionneur'),
  ('00000000-0000-0000-0000-0000000000c2', 'Max-3ds', 'collectionneur');

select throws_ok(
  $$insert into public.amiibo (identifiant, slug, nom, type) values ('010A000004A40902', 'sidon', 'Sidon', 'figurine')$$,
  '23514', null, 'un identifiant en majuscules est refusé (toujours en minuscules)'
);
select throws_ok(
  $$insert into public.amiibo (identifiant, slug, nom, type) values ('010a000004a40902', 'Sidon TotK', 'Sidon', 'figurine')$$,
  '23514', null, 'un slug mal formé est refusé'
);

-- Le propriétaire connecté écrit.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$insert into public.amiibo (identifiant, slug, nom, nom_jap, type, serie_amiibo, serie_jeux, personnage)
    values ('010a000004a40902', 'sidon-tears-of-the-kingdom', 'Sidon', 'シドン', 'figurine',
            'The Legend of Zelda', 'The Legend of Zelda', 'Sidon')$$,
  'le propriétaire ajoute un amiibo AmiiboAPI'
);
select lives_ok(
  $$insert into public.amiibo (identifiant, slug, nom, type, serie_amiibo, editeur)
    values ('us:sword-kirby-and-dragoon-kirby-air-riders-series', 'sword-kirby-dragoon', 'Sword Kirby & Dragoon',
            'figurine', 'Kirby Air Riders', 'Nintendo')$$,
  'le propriétaire ajoute un amiibo de 2026 venu de Nintendo US'
);
select is((select editeur from public.amiibo where slug = 'sidon-tears-of-the-kingdom'), 'Nintendo',
  'éditeur « Nintendo » par défaut');
select throws_ok(
  $$insert into public.amiibo (identifiant, slug, nom, type) values ('010a000004a40902', 'autre', 'Doublon', 'figurine')$$,
  '23505', null, 'un identifiant = un amiibo'
);
select lives_ok(
  $$insert into public.amiibo_sorties (amiibo_id, region, date_sortie, precision_date)
    select id, r::public.region, '2025-06-05', 'jour' from public.amiibo, unnest(array['JAP', 'US', 'PAL']) r
    where slug = 'sidon-tears-of-the-kingdom'$$,
  'sorties dans les trois régions'
);
select throws_ok(
  $$insert into public.amiibo_sorties (amiibo_id, region, date_sortie)
    select id, 'US', '2026-11-12' from public.amiibo where slug = 'sword-kirby-dragoon'$$,
  '23514', null, 'une date sans précision est refusée'
);
select lives_ok(
  $$insert into public.amiibo_jeux (amiibo_id, game_id, titre_jeu, console, usage)
    select a.id, j.id, 'Splatoon', 'Wii U', 'Unlock a costume' from public.amiibo a, public.games j
    where a.slug = 'sidon-tears-of-the-kingdom' and j.slug = 'splatoon'$$,
  'un jeu compatible du catalogue'
);
select lives_ok(
  $$insert into public.amiibo_jeux (amiibo_id, titre_jeu, console, usage)
    select id, 'Conga Master Party!', 'Switch', 'Unlock a special costume' from public.amiibo
    where slug = 'sidon-tears-of-the-kingdom'$$,
  'un jeu compatible hors catalogue, sans lien'
);
select throws_ok(
  $$insert into public.amiibo_jeux (amiibo_id, titre_jeu, console)
    select id, 'Conga Master Party!', 'Switch' from public.amiibo where slug = 'sidon-tears-of-the-kingdom'$$,
  '23505', null, 'un même jeu n''est pas listé deux fois pour un amiibo'
);
select lives_ok(
  $$insert into public.amiibo_exclus (identifiant, raison) values ('0181000100440502', 'carte en double')$$,
  'le propriétaire écarte un amiibo'
);

-- Un collectionneur lit les amiibo, n'écrit pas le catalogue, coche les siens et ne voit pas ceux des autres.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';
select throws_ok(
  $$insert into public.amiibo (identifiant, slug, nom, type) values ('0109000004a30902', 'riju', 'Riju', 'figurine')$$,
  '42501', null, 'un collectionneur n''ajoute pas d''amiibo'
);
select is_empty(
  $$delete from public.amiibo_jeux returning id$$,
  'un collectionneur ne retire pas de jeu compatible'
);
select is((select count(*)::int from public.amiibo_exclus), 0, 'un collectionneur ne voit pas les amiibo écartés');
select lives_ok(
  $$insert into public.possessions_amiibo (amiibo_id) select id from public.amiibo where slug = 'sidon-tears-of-the-kingdom'$$,
  'un collectionneur coche « Je l''ai »'
);
select throws_ok(
  $$insert into public.possessions_amiibo (user_id, amiibo_id)
    select '00000000-0000-0000-0000-0000000000c2', id from public.amiibo where slug = 'sword-kirby-dragoon'$$,
  '42501', null, 'un collectionneur ne coche pas pour un autre'
);
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated"}';
select is((select count(*)::int from public.possessions_amiibo), 0, 'les amiibo cochés par un autre restent privés');

-- Un visiteur lit les amiibo, leurs sorties et leurs jeux, rien d'autre.
reset role;
set local role anon;
select is((select count(*)::int from public.amiibo), 2, 'un visiteur voit les amiibo');
select is((select count(*)::int from public.amiibo_sorties), 3, 'un visiteur voit les sorties');
select is((select count(*)::int from public.possessions_amiibo), 0, 'un visiteur ne voit aucune possession');

-- Un jeu supprimé emporte son lien ; un amiibo supprimé emporte sorties, jeux et possessions.
reset role;
delete from public.games where slug = 'splatoon';
select is((select count(*)::int from public.amiibo_jeux), 1, 'le lien part avec le jeu, le jeu hors catalogue reste');
delete from public.amiibo where slug = 'sidon-tears-of-the-kingdom';
select is(
  (select count(*)::int from public.amiibo_sorties) + (select count(*)::int from public.amiibo_jeux)
    + (select count(*)::int from public.possessions_amiibo),
  0, 'sorties, jeux et possessions partent avec l''amiibo'
);

select * from finish();
rollback;
