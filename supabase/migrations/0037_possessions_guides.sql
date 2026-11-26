-- Guides possédés, par compte (comme possessions et possessions_amiibo). Privé : chacun ne voit et ne modifie que ses
-- propres lignes ; un visiteur (anon) ne voit rien.
create table public.possessions_guides (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  guide_id uuid not null references public.guides (id) on delete cascade,
  cree_le  timestamptz not null default now(),
  primary key (user_id, guide_id)
);

alter table public.possessions_guides enable row level security;

create policy "possessions_guides : lecture de ses lignes" on public.possessions_guides
  for select to authenticated using (user_id = (select auth.uid()));
create policy "possessions_guides : ajout de ses lignes" on public.possessions_guides
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "possessions_guides : retrait de ses lignes" on public.possessions_guides
  for delete to authenticated using (user_id = (select auth.uid()));
