-- Étape 13 (SPEC v1.17 US-17, DESIGN v1.7 ADR-08) : note Metacritic du jeu, citée par Wikipédia ou saisie à la main.
-- Lecture publique et écriture propriétaire : celles de `games` (0002).
alter table public.games
  add column metacritic_note smallint check (metacritic_note between 0 and 100),
  add column metacritic_url text check (metacritic_url ~ '^https://www\.metacritic\.com/');
