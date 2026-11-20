-- Source « gametdb » des jaquettes (#46, DESIGN v0.6 ADR-04) : scans de boîtes, source prioritaire.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select enum_has_labels(
  -- « libretro » ajoutée par la migration 0014 (étape 14, N64 et GBA), « gamecartdb » par la 0019 (Switch 2),
  -- « nintendo » par la 0021 (boîtes européennes officielles).
  'public', 'jaquette_source', array['gametdb', 'igdb', 'libretro', 'gamecartdb', 'nintendo', 'photo', 'url'],
  'jaquette_source accepte gametdb, en tête des sources'
);
select lives_ok(
  $$ update public.releases set jaquette_source = 'gametdb' where false $$,
  'une sortie peut recevoir une jaquette de source gametdb'
);

select * from finish();
rollback;
