-- Étape 23 : séries d'un jeu (migration 0023).
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select has_column('public', 'games', 'series', 'la colonne series existe');
select is(
  (select series from public.games where slug = 'splatoon'), array['Splatoon'],
  'la franchise des jeux de départ est reprise'
);
select lives_ok(
  $$update public.games set series = array['Mario', 'Dr. Mario'] where slug = 'splatoon'$$,
  'un jeu peut avoir plusieurs séries'
);
set local role anon;
select is(
  (select cardinality(series) from public.games where slug = 'splatoon'), 2,
  'un visiteur lit les séries'
);

select * from finish();
rollback;
