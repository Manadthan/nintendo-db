-- Étape 21 : console NES (migration 0020).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select slug, nom, type::text, annee::int from public.consoles where slug = 'nes'$$,
  $$values ('nes', 'NES', 'salon', 1983)$$,
  'la NES (1983) est lue sur Wikipédia'
);
select results_eq(
  $$select slug from public.consoles where slug in ('nes', 'gb', 'snes') order by ordre$$,
  $$values ('nes'), ('gb'), ('snes')$$,
  'ordre chronologique : NES, Game Boy, Super Nintendo'
);

select * from finish();
rollback;
