-- Étape 19 : console Virtual Boy (migration 0017).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, annee::int from public.consoles where slug = 'vb'$$,
  $$values ('vb', 'Virtual Boy', 1995)$$,
  'le Virtual Boy (1995) est lu sur Wikipédia'
);
select results_eq(
  $$select slug from public.consoles where slug in ('gb', 'vb', 'n64') order by ordre$$,
  $$values ('gb'), ('vb'), ('n64')$$,
  'ordre chronologique : Game Boy, Virtual Boy, N64'
);

select * from finish();
rollback;
