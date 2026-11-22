-- Étape 28 (SPEC v1.43 US-26, DESIGN v1.35 ADR-18 point 4) : captures de jeu venues de RAWG. La base garde les
-- adresses des images (servies par media.rawg.io, jamais copiées) et le slug RAWG du jeu (lien « Captures : RAWG »).
-- Lecture publique ; écriture réservée au propriétaire (est_proprietaire(), ADR-16) et à la clé secrète (script).

alter table public.games
  add column rawg_slug text check (rawg_slug ~ '^[a-z0-9][a-z0-9-]{0,199}$');

create table public.captures (
  game_id  uuid not null references public.games (id) on delete cascade,
  position smallint not null check (position between 1 and 6),
  url      text not null check (url ~ '^https://media\.rawg\.io/media/[A-Za-z0-9/_.-]+$'),
  largeur  integer check (largeur > 0),
  hauteur  integer check (hauteur > 0),
  primary key (game_id, position)
);

alter table public.captures enable row level security;
create policy "captures : lecture publique" on public.captures
  for select to anon, authenticated using (true);
create policy "captures : écriture propriétaire" on public.captures
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
