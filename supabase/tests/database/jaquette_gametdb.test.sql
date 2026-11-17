-- Source « gametdb » des jaquettes (#46, DESIGN v0.6 ADR-04) : scans de boîtes, source prioritaire.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select enum_has_labels(
  'public', 'jaquette_source', array['gametdb', 'igdb', 'photo', 'url'],
  'jaquette_source accepte gametdb, en tête des sources'
);
select lives_ok(
  $$ update public.releases set jaquette_source = 'gametdb' where false $$,
  'une sortie peut recevoir une jaquette de source gametdb'
);

select * from finish();
rollback;
