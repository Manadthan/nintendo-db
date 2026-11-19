-- Étape 12 (SPEC v1.14 US-16, DESIGN v1.6 ADR-07) : versions régionales possédées, par compte. Privé : chacun ne voit
-- et ne modifie que ses propres lignes ; un visiteur (anon) ne voit rien.
create table public.possessions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  region  public.region not null,
  cree_le timestamptz not null default now(),
  primary key (user_id, game_id, region)
);

alter table public.possessions enable row level security;

create policy "possessions : lecture de ses lignes" on public.possessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "possessions : ajout de ses lignes" on public.possessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "possessions : retrait de ses lignes" on public.possessions
  for delete to authenticated using (user_id = (select auth.uid()));
