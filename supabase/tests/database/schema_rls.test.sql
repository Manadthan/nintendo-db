-- Tests du schéma et de la Row Level Security (#17, ADR-01), lancés par `npm run db:test`.
-- Tout se passe dans une transaction annulée à la fin : la base reste propre.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Structure
select has_table('public', 'consoles', 'table consoles');
select has_table('public', 'games', 'table games');
select has_table('public', 'releases', 'table releases');
select has_table('public', 'import_runs', 'table import_runs');
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.consoles'::regclass, 'public.games'::regclass,
                 'public.releases'::regclass, 'public.import_runs'::regclass)),
  'RLS active sur les 4 tables'
);
select results_eq(
  $$select slug, nom, type::text, annee::int, igdb_platform_id from public.consoles where slug = 'wii-u'$$,
  $$values ('wii-u', 'Wii U', 'salon', 2012, 41)$$,
  'la console Wii U est pré-remplie'
);

-- Le propriétaire, connecté, ajoute un jeu et ses 3 sorties.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

insert into public.games (id, console_id, slug, developpeur)
select '20000000-0000-0000-0000-000000000001', id, 'jeu-de-test', 'Studio de test'
from public.consoles where slug = 'wii-u';
insert into public.releases (game_id, region, sortie, titre, date_sortie, precision_date) values
  ('20000000-0000-0000-0000-000000000001', 'JAP', true, 'テストゲーム', '2014-05-29', 'jour'),
  ('20000000-0000-0000-0000-000000000001', 'US', true, 'Test Game', '2014-05-30', 'jour'),
  ('20000000-0000-0000-0000-000000000001', 'PAL', true, 'Jeu de test', '2014-05-30', 'jour');

select is((select count(*)::int from public.releases where game_id = '20000000-0000-0000-0000-000000000001'), 3, 'le propriétaire ajoute un jeu et ses 3 sorties');
select throws_ok(
  $$insert into public.releases (game_id, region, sortie, titre)
    values ('20000000-0000-0000-0000-000000000001', 'PAL', true, 'Doublon')$$,
  '23505', null, 'une seule sortie par jeu et par région'
);
select throws_ok(
  $$insert into public.releases (game_id, region) values ('20000000-0000-0000-0000-000000000001', 'KOR')$$,
  '22P02', null, 'seules les régions JAP, US et PAL existent'
);
select throws_ok(
  $$update public.releases set titre = null where game_id = '20000000-0000-0000-0000-000000000001' and region = 'US'$$,
  '23514', null, 'une sortie publiée a toujours un titre'
);
select throws_ok(
  $$insert into public.games (console_id, slug) select id, 'jeu-de-test' from public.consoles where slug = 'wii-u'$$,
  '23505', null, 'deux jeux d''une console ne partagent pas une adresse'
);
select throws_ok(
  $$insert into public.games (console_id, slug) select id, 'Mario Kart' from public.consoles where slug = 'wii-u'$$,
  '23514', null, 'l''adresse d''un jeu est en minuscules, chiffres et tirets'
);

select is(
  (select updated_at from public.games where slug = 'jeu-de-test'),
  now(),
  'updated_at est rempli à la création'
);
select lives_ok(
  $$update public.games set franchise = 'Test' where slug = 'jeu-de-test'$$,
  'le propriétaire modifie un jeu'
);
select lives_ok(
  $$insert into public.import_runs (console_id, resume) select id, '{"ajoutes": 1}' from public.consoles where slug = 'wii-u'$$,
  'le propriétaire enregistre un import'
);

-- Un visiteur non connecté lit tout, mais ne modifie rien.
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select is((select count(*)::int from public.consoles where slug in ('ds', 'wii', '3ds', 'wii-u')), 4, 'un visiteur voit les consoles (DS, Wii, 3DS, Wii U)');
select is((select count(*)::int from public.releases where game_id = '20000000-0000-0000-0000-000000000001'), 3, 'un visiteur voit les sorties');
select is_empty('select * from public.import_runs', 'un visiteur ne voit pas l''historique des imports');
select throws_ok(
  $$insert into public.games (console_id, slug) select id, 'intrus' from public.consoles where slug = 'wii-u'$$,
  '42501', null, 'un visiteur ne peut pas ajouter de jeu'
);
select is_empty(
  $$update public.releases set titre = 'Piraté' returning id$$,
  'un visiteur ne peut pas modifier une sortie'
);
select is_empty(
  $$delete from public.games returning id$$,
  'un visiteur ne peut pas supprimer un jeu'
);

-- Vérification sans RLS : rien n'a bougé.
reset role;
select is(
  (select count(*)::int from public.releases where titre = 'Piraté'),
  0,
  'les sorties sont intactes après les tentatives du visiteur'
);

select * from finish();
rollback;
