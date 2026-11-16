-- Tests des données de départ (#24) : 4 jeux Wii U, chacun avec ses 3 sorties.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is(
  (select count(*)::int from public.games g join public.consoles c on c.id = g.console_id where c.slug = 'wii-u'),
  4, '4 jeux Wii U de départ'
);
select is((select count(*)::int from public.releases), 12, 'chaque jeu a ses 3 sorties (JAP, US, PAL)');
select results_eq(
  $$select r.sortie, r.titre from public.releases r join public.games g on g.id = r.game_id
    where g.slug = 'wii-karaoke-u' and r.region = 'US'$$,
  $$values (false, null::text)$$,
  'Wii Karaoke U n''est pas sorti en Amérique du Nord'
);
select results_eq(
  $$select r.region::text, r.titre from public.releases r join public.games g on g.id = r.game_id
    where g.slug = 'kirby-and-the-rainbow-paintbrush' and r.region in ('US', 'PAL') order by r.region$$,
  $$values ('US', 'Kirby and the Rainbow Curse'), ('PAL', 'Kirby and the Rainbow Paintbrush')$$,
  'le titre de Kirby change selon la région'
);

select * from finish();
rollback;
