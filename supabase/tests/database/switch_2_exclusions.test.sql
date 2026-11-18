-- Étape 10 : console Switch 2 et exclusions de l'import (migration 0010).
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select results_eq(
  $$select nom, type::text, annee::int, wikipedia_liste from public.consoles where slug = 'switch-2'$$,
  $$values ('Switch 2', 'salon', 2025, 'https://en.wikipedia.org/wiki/List_of_Nintendo_Switch_2_games')$$,
  'la Switch 2 (2025) est lue depuis la liste Wikipédia'
);
select has_table('public', 'exclusions', 'table exclusions');

-- Le propriétaire note un jeu en téléchargement seul, une seule fois par console.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select lives_ok(
  $$insert into public.exclusions (console_id, slug, titre)
    select id, 'nintendo-switch-2-welcome-tour', 'Nintendo Switch 2 Welcome Tour' from public.consoles where slug = 'switch-2'$$,
  'le propriétaire exclut un jeu'
);
select throws_ok(
  $$insert into public.exclusions (console_id, slug, titre)
    select id, 'nintendo-switch-2-welcome-tour', 'Doublon' from public.consoles where slug = 'switch-2'$$,
  '23505', null, 'un jeu n''est exclu qu''une fois'
);

-- Un visiteur ne voit ni ne modifie les exclusions.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is_empty('select * from public.exclusions', 'un visiteur ne voit pas les exclusions');
select throws_ok(
  $$insert into public.exclusions (console_id, slug, titre) select id, 'intrus', 'Intrus' from public.consoles where slug = 'switch-2'$$,
  '42501', null, 'un visiteur ne peut pas exclure un jeu'
);

select * from finish();
rollback;
