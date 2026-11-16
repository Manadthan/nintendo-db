-- Schéma initial (docs/DESIGN.md §5) : consoles, jeux, sorties par région, historique des imports.
-- Un jeu = une œuvre sur une console ; ses 3 sorties (JAP, US, PAL) portent ce qui change d'une région à l'autre.

create type public.console_type as enum ('salon', 'portable');
create type public.region as enum ('JAP', 'US', 'PAL');
create type public.precision_date as enum ('jour', 'mois', 'annee');
create type public.jaquette_source as enum ('igdb', 'photo', 'url');

create table public.consoles (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom              text not null check (char_length(btrim(nom)) between 1 and 100),
  type             public.console_type not null,
  annee            smallint not null check (annee between 1970 and 2100),
  ordre            smallint not null,
  wikipedia_liste  text,     -- page « List of … games » lue par l'import (ADR-03)
  igdb_platform_id integer   -- identifiant de la plateforme dans IGDB
);

create table public.games (
  id            uuid primary key default gen_random_uuid(),
  console_id    uuid not null references public.consoles (id) on delete restrict,
  -- Adresse stable /jeux/{console}/{slug}, figée à la création (ADR-06).
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  igdb_id       integer,
  wikipedia_url text,
  developpeur   text,
  franchise     text,
  genre         text,
  physique      boolean not null default true,
  -- Champs corrigés à la main : l'import ne les remplace jamais (ADR-03, US-10).
  verrous       text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint games_console_slug_unique unique (console_id, slug)
);

create table public.releases (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references public.games (id) on delete cascade,
  region          public.region not null,
  sortie          boolean not null default false,
  titre           text check (char_length(btrim(titre)) between 1 and 300),
  titre_romanise  text,     -- sous le titre japonais (SPEC décision 1)
  date_sortie     date,
  precision_date  public.precision_date,  -- certaines sources ne donnent que le mois ou l'année
  code_produit    text,
  editeur         text,
  jaquette_path   text,     -- chemin dans le stockage des jaquettes (ADR-04), NULL si aucune
  jaquette_source public.jaquette_source,
  verrous         text[] not null default '{}',
  updated_at      timestamptz not null default now(),
  -- Une seule sortie par jeu et par région.
  constraint releases_game_region_unique unique (game_id, region),
  -- Un jeu sorti dans une région a forcément un titre dans cette région.
  constraint releases_titre_si_sortie check (not sortie or titre is not null)
);

create table public.import_runs (
  id         uuid primary key default gen_random_uuid(),
  console_id uuid not null references public.consoles (id) on delete cascade,
  lance_le   timestamptz not null default now(),
  resume     jsonb not null default '{}'  -- ajoutés / modifiés / ignorés (US-10)
);

create index games_console_id_idx on public.games (console_id);
create index import_runs_console_id_idx on public.import_runs (console_id);

-- updated_at tenu à jour à chaque modification. Fonction hors du schéma public : non exposée par l'API.
create schema if not exists prive;

create function prive.maj_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger games_updated_at before update on public.games
  for each row execute function prive.maj_updated_at();
create trigger releases_updated_at before update on public.releases
  for each row execute function prive.maj_updated_at();

-- Console de la v1 (SPEC §6). IGDB : plateforme 41 = Wii U.
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('wii-u', 'Wii U', 'salon', 2012, 1, 'https://en.wikipedia.org/wiki/List_of_Wii_U_games', 41);
