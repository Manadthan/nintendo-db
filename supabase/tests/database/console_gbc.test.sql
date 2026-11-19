-- Étape 17 : console Game Boy Color (migration 0015).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug = 'gbc'$$,
  $$values ('gbc', 'Game Boy Color', 'portable', 1998)$$,
  'la Game Boy Color (1998) est lue sur Wikipédia'
);
select results_eq(
  $$select slug from public.consoles where slug in ('n64', 'gbc', 'gba', 'gamecube') order by ordre$$,
  $$values ('n64'), ('gbc'), ('gba'), ('gamecube')$$,
  'ordre chronologique : N64, GBC, GBA, GameCube'
);

select * from finish();
rollback;
