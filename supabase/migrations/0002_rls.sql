-- Row Level Security (ADR-01) : site public en lecture, écriture réservée au propriétaire.
-- Les inscriptions sont désactivées (config.toml, réglage Supabase) : le seul compte « authenticated »
-- est celui du propriétaire, créé à la main.

alter table public.consoles enable row level security;
alter table public.games enable row level security;
alter table public.releases enable row level security;
alter table public.import_runs enable row level security;

-- Lecture : tout le monde, connecté ou non.
create policy "consoles : lecture publique" on public.consoles
  for select to anon, authenticated using (true);
create policy "games : lecture publique" on public.games
  for select to anon, authenticated using (true);
create policy "releases : lecture publique" on public.releases
  for select to anon, authenticated using (true);

-- Écriture : propriétaire connecté uniquement.
create policy "consoles : écriture propriétaire" on public.consoles
  for all to authenticated using (true) with check (true);
create policy "games : écriture propriétaire" on public.games
  for all to authenticated using (true) with check (true);
create policy "releases : écriture propriétaire" on public.releases
  for all to authenticated using (true) with check (true);

-- L'historique des imports n'intéresse que le propriétaire : ni lecture ni écriture publiques.
create policy "import_runs : propriétaire uniquement" on public.import_runs
  for all to authenticated using (true) with check (true);
