-- Étape 30 (SPEC v1.49 US-29 à US-31, DESIGN v1.44 ADR-21 points 1 et 2) : amiibo (figurines, cartes, peluches,
-- bracelets, blocs). Tables à part : un amiibo n'a ni console ni jaquette par région.
-- amiibo_sorties : une ligne par région où l'amiibo est sorti (pas de ligne = pas sorti).
-- amiibo_jeux : jeux qui lisent l'amiibo ; game_id vide pour un jeu absent du catalogue (le titre de la source reste).
-- amiibo_exclus : un amiibo écarté sur la planche n'est jamais remis par le script.
-- possessions_amiibo : « Je l'ai », une case par amiibo, privée (mêmes règles que possessions, migration 0012).
-- Images copiées en WebP dans le bucket public `amiibo` (figurine et boîte US).
-- Lecture publique (sauf amiibo_exclus et possessions_amiibo) ; écriture du catalogue réservée au propriétaire
-- (est_proprietaire(), ADR-16) et à la clé secrète (script depuis la session).

create type public.amiibo_type as enum ('figurine', 'carte', 'peluche', 'bracelet', 'bloc');

create table public.amiibo (
  id           uuid primary key default gen_random_uuid(),
  -- 16 chiffres hexadécimaux (AmiiboAPI) ou « us:{slug Nintendo US} » pour un amiibo absent d'AmiiboAPI.
  identifiant  text not null unique check (identifiant ~ '^([0-9a-f]{16}|us:[a-z0-9-]{1,120})$'),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 140),
  nom          text not null check (length(nom) between 1 and 200),
  nom_jap      text check (length(nom_jap) <= 200),
  type         public.amiibo_type not null,
  serie_amiibo text check (length(serie_amiibo) <= 200),
  serie_jeux   text check (length(serie_jeux) <= 200),
  personnage   text check (length(personnage) <= 200),
  editeur      text not null default 'Nintendo' check (length(editeur) between 1 and 200),
  image_path   text check (length(image_path) <= 300),
  boite_path   text check (length(boite_path) <= 300),
  verrous      text[] not null default '{}',
  cree_le      timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger amiibo_updated_at before update on public.amiibo
  for each row execute function prive.maj_updated_at();

create table public.amiibo_sorties (
  amiibo_id      uuid not null references public.amiibo (id) on delete cascade,
  region         public.region not null,
  date_sortie    date,
  precision_date public.precision_date,
  primary key (amiibo_id, region),
  check ((date_sortie is null) = (precision_date is null))
);

create table public.amiibo_jeux (
  id        uuid primary key default gen_random_uuid(),
  amiibo_id uuid not null references public.amiibo (id) on delete cascade,
  game_id   uuid references public.games (id) on delete cascade,
  titre_jeu text not null check (length(titre_jeu) between 1 and 300),
  console   text not null check (length(console) between 1 and 40),
  usage     text check (length(usage) <= 1000),
  unique (amiibo_id, titre_jeu, console)
);
-- Bloc « Amiibo » de la fiche : les amiibo d'un jeu.
create index amiibo_jeux_game_id on public.amiibo_jeux (game_id);

create table public.amiibo_exclus (
  identifiant text primary key check (identifiant ~ '^([0-9a-f]{16}|us:[a-z0-9-]{1,120})$'),
  raison      text,
  cree_le     timestamptz not null default now()
);

create table public.possessions_amiibo (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amiibo_id uuid not null references public.amiibo (id) on delete cascade,
  cree_le   timestamptz not null default now(),
  primary key (user_id, amiibo_id)
);

alter table public.amiibo enable row level security;
create policy "amiibo : lecture publique" on public.amiibo
  for select to anon, authenticated using (true);
create policy "amiibo : écriture propriétaire" on public.amiibo
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

alter table public.amiibo_sorties enable row level security;
create policy "amiibo_sorties : lecture publique" on public.amiibo_sorties
  for select to anon, authenticated using (true);
create policy "amiibo_sorties : écriture propriétaire" on public.amiibo_sorties
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

alter table public.amiibo_jeux enable row level security;
create policy "amiibo_jeux : lecture publique" on public.amiibo_jeux
  for select to anon, authenticated using (true);
create policy "amiibo_jeux : écriture propriétaire" on public.amiibo_jeux
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

alter table public.amiibo_exclus enable row level security;
create policy "amiibo_exclus : propriétaire uniquement" on public.amiibo_exclus
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

-- Chacun ne voit et ne modifie que ses propres lignes ; un visiteur (anon) ne voit rien.
alter table public.possessions_amiibo enable row level security;
create policy "possessions_amiibo : lecture de ses lignes" on public.possessions_amiibo
  for select to authenticated using (user_id = (select auth.uid()));
create policy "possessions_amiibo : ajout de ses lignes" on public.possessions_amiibo
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "possessions_amiibo : retrait de ses lignes" on public.possessions_amiibo
  for delete to authenticated using (user_id = (select auth.uid()));

-- Images : bucket public (adresse publique pour les visiteurs), écriture réservée au propriétaire.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('amiibo', 'amiibo', true, 1048576, array['image/webp'])  -- WebP de 1 Mo au plus
on conflict (id) do nothing;

create policy "amiibo : lecture propriétaire" on storage.objects
  for select to authenticated
  using (bucket_id = 'amiibo' and (select public.est_proprietaire()));
create policy "amiibo : ajout propriétaire" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'amiibo' and (select public.est_proprietaire()));
create policy "amiibo : remplacement propriétaire" on storage.objects
  for update to authenticated
  using (bucket_id = 'amiibo' and (select public.est_proprietaire()))
  with check (bucket_id = 'amiibo' and (select public.est_proprietaire()));
create policy "amiibo : suppression propriétaire" on storage.objects
  for delete to authenticated
  using (bucket_id = 'amiibo' and (select public.est_proprietaire()));
