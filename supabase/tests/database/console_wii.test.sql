-- Étape 8 : console Wii (migration 0007).
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select results_eq(
  $$select nom, type::text, annee::int, wikipedia_liste from public.consoles where slug = 'wii'$$,
  $$values ('Wii', 'salon', 2006, null::text)$$,
  'la Wii est une console de salon de 2006, importée sans liste Wikipédia'
);
select results_eq(
  $$select slug from public.consoles order by ordre$$,
  $$values ('wii'), ('wii-u')$$,
  'les consoles sont rangées par ordre chronologique'
);

select * from finish();
rollback;
