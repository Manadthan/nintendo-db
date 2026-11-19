-- Étape 13 : note Metacritic (migration 0013).
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select lives_ok(
  $$update public.games set metacritic_note = 81, metacritic_url = 'https://www.metacritic.com/game/splatoon/'
    where slug = 'splatoon'$$,
  'une note de 0 à 100 et une adresse Metacritic sont acceptées'
);
select throws_ok(
  $$update public.games set metacritic_note = 101 where slug = 'splatoon'$$,
  '23514', null, 'une note au-delà de 100 est refusée'
);
select throws_ok(
  $$update public.games set metacritic_url = 'https://exemple.fr/splatoon' where slug = 'splatoon'$$,
  '23514', null, 'une adresse qui n''est pas sur metacritic.com est refusée'
);
set local role anon;
select is(
  (select metacritic_note::int from public.games where slug = 'splatoon'), 81,
  'un visiteur lit la note'
);

select * from finish();
rollback;
