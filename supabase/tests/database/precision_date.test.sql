-- Étape 31 (migration 0032, ADR-20 point 3) : précisions « saison » et « inconnue » des dates annoncées.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select enum_has_labels(
  'public', 'precision_date', array['jour', 'mois', 'saison', 'annee', 'inconnue'],
  'précisions de date : jour, mois, saison, année, inconnue (dans cet ordre)'
);

insert into public.games (id, console_id, slug)
select '00000000-0000-0000-0000-00000000a032', id, 'jeu-a-venir-0032' from public.consoles where slug = 'switch-2';

select lives_ok(
  $$insert into public.releases (game_id, region, sortie, titre, date_sortie, precision_date)
    values ('00000000-0000-0000-0000-00000000a032', 'JAP', true, '星のカービィ', '2027-03-01', 'saison')$$,
  'une date à la saison est acceptée (printemps 2027)'
);
select lives_ok(
  $$insert into public.releases (game_id, region, sortie, titre, date_sortie, precision_date)
    values ('00000000-0000-0000-0000-00000000a032', 'PAL', true, 'Kirby', null, 'inconnue')$$,
  'une date pas encore connue est acceptée (« Date à venir »)'
);

select * from finish();
rollback;
