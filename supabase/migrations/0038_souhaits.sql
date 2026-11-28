-- Liste de souhaits privée par compte (jeux par région, amiibo, guides), mutuellement exclusive avec les possessions.
create table public.souhaits (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  region  public.region not null,
  cree_le timestamptz not null default now(),
  primary key (user_id, game_id, region)
);

alter table public.souhaits enable row level security;

create policy "souhaits : lecture de ses lignes" on public.souhaits
  for select to authenticated using (user_id = (select auth.uid()));
create policy "souhaits : ajout de ses lignes" on public.souhaits
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "souhaits : retrait de ses lignes" on public.souhaits
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.souhaits_amiibo (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amiibo_id uuid not null references public.amiibo (id) on delete cascade,
  cree_le   timestamptz not null default now(),
  primary key (user_id, amiibo_id)
);

alter table public.souhaits_amiibo enable row level security;

create policy "souhaits_amiibo : lecture de ses lignes" on public.souhaits_amiibo
  for select to authenticated using (user_id = (select auth.uid()));
create policy "souhaits_amiibo : ajout de ses lignes" on public.souhaits_amiibo
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "souhaits_amiibo : retrait de ses lignes" on public.souhaits_amiibo
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.souhaits_guides (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  guide_id uuid not null references public.guides (id) on delete cascade,
  cree_le  timestamptz not null default now(),
  primary key (user_id, guide_id)
);

alter table public.souhaits_guides enable row level security;

create policy "souhaits_guides : lecture de ses lignes" on public.souhaits_guides
  for select to authenticated using (user_id = (select auth.uid()));
create policy "souhaits_guides : ajout de ses lignes" on public.souhaits_guides
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "souhaits_guides : retrait de ses lignes" on public.souhaits_guides
  for delete to authenticated using (user_id = (select auth.uid()));

-- Exclusivité mutuelle : cocher « Je l'ai » retire de la liste de souhaits et réciproquement.
create or replace function public.retirer_souhait_si_possede()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.souhaits
  where user_id = new.user_id and game_id = new.game_id and region = new.region;
  return new;
end;
$$;

create or replace function public.retirer_possession_si_souhaite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.possessions
  where user_id = new.user_id and game_id = new.game_id and region = new.region;
  return new;
end;
$$;

create trigger possessions_retirer_souhait
  after insert on public.possessions
  for each row execute function public.retirer_souhait_si_possede();

create trigger souhaits_retirer_possession
  after insert on public.souhaits
  for each row execute function public.retirer_possession_si_souhaite();

create or replace function public.retirer_souhait_amiibo_si_possede()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.souhaits_amiibo
  where user_id = new.user_id and amiibo_id = new.amiibo_id;
  return new;
end;
$$;

create or replace function public.retirer_possession_amiibo_si_souhaite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.possessions_amiibo
  where user_id = new.user_id and amiibo_id = new.amiibo_id;
  return new;
end;
$$;

create trigger possessions_amiibo_retirer_souhait
  after insert on public.possessions_amiibo
  for each row execute function public.retirer_souhait_amiibo_si_possede();

create trigger souhaits_amiibo_retirer_possession
  after insert on public.souhaits_amiibo
  for each row execute function public.retirer_possession_amiibo_si_souhaite();

create or replace function public.retirer_souhait_guide_si_possede()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.souhaits_guides
  where user_id = new.user_id and guide_id = new.guide_id;
  return new;
end;
$$;

create or replace function public.retirer_possession_guide_si_souhaite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.possessions_guides
  where user_id = new.user_id and guide_id = new.guide_id;
  return new;
end;
$$;

create trigger possessions_guides_retirer_souhait
  after insert on public.possessions_guides
  for each row execute function public.retirer_souhait_guide_si_possede();

create trigger souhaits_guides_retirer_possession
  after insert on public.souhaits_guides
  for each row execute function public.retirer_possession_guide_si_souhaite();
