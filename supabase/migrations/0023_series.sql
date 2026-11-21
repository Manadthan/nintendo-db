-- Étape 23 (SPEC v1.37 US-06, DESIGN v1.21 ADR-15) : séries d'un jeu, plusieurs possibles (Dr. Mario : « Mario » et
-- « Dr. Mario »). Remplies par les règles sur le titre et Wikidata (scripts/series-wikidata.mjs), corrigées à la main
-- (verrou « series »). La colonne `franchise` (3 jeux de départ) est reprise puis n'est plus lue.
-- Lecture publique et écriture propriétaire : celles de `games` (0002).
alter table public.games
  add column series text[] not null default '{}';

update public.games set series = array[franchise] where franchise is not null;
