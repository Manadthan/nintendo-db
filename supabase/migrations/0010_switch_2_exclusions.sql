-- Étape 10 (SPEC v1.11, DESIGN v1.4 ADR-03 point 7) : Switch 2, importée de la liste Wikipédia (GameTDB n'a pas de
-- base Switch 2) ; jaquettes ajoutées à la main.
insert into public.consoles (slug, nom, type, annee, ordre, wikipedia_liste, igdb_platform_id)
values ('switch-2', 'Switch 2', 'salon', 2025, 6, 'https://en.wikipedia.org/wiki/List_of_Nintendo_Switch_2_games', null)
on conflict (slug) do nothing;

-- Jeux que le propriétaire a décochés « en boîte » dans l'aperçu de l'import (téléchargement seul : Welcome Tour…) :
-- l'import ne les propose plus. Réactivables depuis la page d'import.
create table public.exclusions (
  console_id uuid not null references public.consoles (id) on delete cascade,
  slug       text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titre      text not null check (char_length(btrim(titre)) between 1 and 300),
  raison     text not null default 'téléchargement seulement',
  cree_le    timestamptz not null default now(),
  primary key (console_id, slug)
);

-- Comme l'historique des imports : réservé au propriétaire, ni lecture ni écriture publiques.
alter table public.exclusions enable row level security;
create policy "exclusions : propriétaire uniquement" on public.exclusions
  for all to authenticated using (true) with check (true);
