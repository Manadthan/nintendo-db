-- Étape 28 (ADR-18 point 4) : certains slugs RAWG contiennent un tiret bas (Kirby: Squeak Squad :
-- « kirby_squeak_squad »). La contrainte de 0028 le refusait : écriture des captures du 23/11 arrêtée sur ce jeu.
alter table public.games drop constraint games_rawg_slug_check;
alter table public.games
  add constraint games_rawg_slug_check check (rawg_slug ~ '^[a-z0-9][a-z0-9_-]{0,199}$');
