-- Étape 18 : console Game Boy (migration 0016).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug = 'gb'$$,
  $$values ('gb', 'Game Boy', 'portable', 1989)$$,
  'le Game Boy (1989) est lu sur Wikipédia'
);
select results_eq(
  $$select slug from public.consoles where slug in ('gb', 'n64', 'gbc', 'gba') order by ordre$$,
  $$values ('gb'), ('n64'), ('gbc'), ('gba')$$,
  'ordre chronologique : Game Boy, N64, GBC, GBA'
);

select * from finish();
rollback;
