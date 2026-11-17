-- Étape 9 : consoles DS et 3DS (migration 0008).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug in ('ds', '3ds') order by annee$$,
  $$values ('ds', 'DS', 'portable', 2004), ('3ds', '3DS', 'portable', 2011)$$,
  'la DS (2004) et la 3DS (2011) sont des portables'
);
select results_eq(
  $$select slug from public.consoles order by ordre$$,
  $$values ('ds'), ('wii'), ('3ds'), ('wii-u')$$,
  'les consoles sont rangées par ordre chronologique'
);

select * from finish();
rollback;
