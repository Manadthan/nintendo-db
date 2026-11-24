-- Étape 29 (SPEC v1.47 US-27 et US-28, DESIGN v1.40 ADR-19 point 1) : guides de jeu japonais (攻略本).
-- Tables à part : un guide n'a ni régions ni jaquettes, et peut couvrir plusieurs jeux (guides_jeux).
-- La couverture n'est jamais copiée : la base garde l'identifiant Google Books, le navigateur charge l'image chez Google.
-- Un guide écarté sur la planche ou supprimé est noté dans guides_exclus et n'est jamais remis par le script.
-- Lecture publique (sauf guides_exclus) ; écriture réservée au propriétaire (est_proprietaire(), ADR-16) et à la clé
-- secrète (script depuis la session).

create table public.guides (
  id              uuid primary key default gen_random_uuid(),
  isbn            text not null unique check (isbn ~ '^97[89][0-9]{10}$'),
  titre           text not null check (length(titre) between 1 and 300),
  editeur         text check (length(editeur) <= 200),
  date_parution   date,
  precision_date  public.precision_date,
  pages           smallint check (pages > 0),
  google_books_id text check (google_books_id ~ '^[A-Za-z0-9_-]{8,20}$'),
  ndl_url         text check (ndl_url ~ '^https://ndlsearch\.ndl\.go\.jp/'),
  verrous         text[] not null default '{}',
  cree_le         timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check ((date_parution is null) = (precision_date is null))
);

create trigger guides_updated_at before update on public.guides
  for each row execute function prive.maj_updated_at();

create table public.guides_jeux (
  guide_id uuid not null references public.guides (id) on delete cascade,
  game_id  uuid not null references public.games (id) on delete cascade,
  primary key (guide_id, game_id)
);
-- Bloc « Guides » de la fiche : les guides d'un jeu.
create index guides_jeux_game_id on public.guides_jeux (game_id);

create table public.guides_exclus (
  isbn    text primary key check (isbn ~ '^97[89][0-9]{10}$'),
  raison  text,
  cree_le timestamptz not null default now()
);

alter table public.guides enable row level security;
create policy "guides : lecture publique" on public.guides
  for select to anon, authenticated using (true);
create policy "guides : écriture propriétaire" on public.guides
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

alter table public.guides_jeux enable row level security;
create policy "guides_jeux : lecture publique" on public.guides_jeux
  for select to anon, authenticated using (true);
create policy "guides_jeux : écriture propriétaire" on public.guides_jeux
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

alter table public.guides_exclus enable row level security;
create policy "guides_exclus : propriétaire uniquement" on public.guides_exclus
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
