-- Étape 10 : console Switch (migration 0009).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug = 'switch'$$,
  $$values ('switch', 'Switch', 'salon', 2017)$$,
  'la Switch (2017) est une console de salon'
);
select ok(
  (select ordre from public.consoles where slug = 'switch') > (select ordre from public.consoles where slug = 'wii-u'),
  'la Switch vient après la Wii U'
);

select * from finish();
rollback;
