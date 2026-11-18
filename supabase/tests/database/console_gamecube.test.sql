-- Étape 11 : console GameCube (migration 0011).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug = 'gamecube'$$,
  $$values ('gamecube', 'GameCube', 'salon', 2001)$$,
  'la GameCube (2001) est une console de salon'
);
select ok(
  (select ordre from public.consoles where slug = 'gamecube') < (select ordre from public.consoles where slug = 'ds'),
  'la GameCube vient avant la DS'
);

select * from finish();
rollback;
