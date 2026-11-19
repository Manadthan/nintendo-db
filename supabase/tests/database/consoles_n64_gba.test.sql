-- Étape 14 : consoles N64 et GBA, source de jaquette libretro (migration 0014).
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug in ('n64', 'gba') order by ordre$$,
  $$values ('n64', 'Nintendo 64', 'salon', 1996), ('gba', 'Game Boy Advance', 'portable', 2001)$$,
  'la N64 (1996) et la GBA (2001) sont lues sur Wikipédia'
);
select ok(
  (select ordre from public.consoles where slug = 'gba') < (select ordre from public.consoles where slug = 'gamecube'),
  'ordre chronologique : N64, GBA, puis GameCube'
);
select ok('libretro' = any(enum_range(null::public.jaquette_source)::text[]), 'source de jaquette « libretro »');

select * from finish();
rollback;
