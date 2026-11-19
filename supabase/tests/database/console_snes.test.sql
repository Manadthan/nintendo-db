-- Étape 20 : console Super Nintendo (migration 0018).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug = 'snes'$$,
  $$values ('snes', 'Super Nintendo', 'salon', 1990)$$,
  'la Super Nintendo (1990) est lue sur Wikipédia'
);
select results_eq(
  $$select slug from public.consoles where slug in ('gb', 'snes', 'vb', 'n64') order by ordre$$,
  $$values ('gb'), ('snes'), ('vb'), ('n64')$$,
  'ordre chronologique : Game Boy, Super Nintendo, Virtual Boy, N64'
);

select * from finish();
rollback;
