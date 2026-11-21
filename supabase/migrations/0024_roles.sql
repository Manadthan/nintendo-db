-- Étape 27 (intention v1.5 décision 9, SPEC v1.39, DESIGN ADR-16 point 1) : le rôle du propriétaire passe dans la base.
-- Jusqu'ici, « connecté » voulait dire « propriétaire » (inscriptions fermées) : toutes les règles d'écriture étaient
-- `to authenticated using (true)`. Avant d'inviter des collectionneurs, l'écriture du catalogue, des jaquettes et des
-- exclusions, et la lecture du relais GameTDB, sont réservées au rôle « proprietaire ».

create extension if not exists citext with schema extensions;

create type public.role_compte as enum ('proprietaire', 'collectionneur');

-- Profil de chaque compte (US-22) ; créé par le serveur (clé secrète) à l'acceptation d'une invitation (PR suivante).
create table public.profils (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pseudo  extensions.citext not null unique
          check (pseudo::text ~ '^[A-Za-z0-9-]{3,20}$'),
  avatar  text not null default 'manette'
          check (avatar in ('manette', 'cartouche', 'champignon', 'etoile', 'envahisseur', 'trophee',
                            'fusee', 'tortue', 'eclair', 'diamant', 'flamme', 'de')),
  public  boolean not null default false,
  role    public.role_compte not null default 'collectionneur',
  cree_le timestamptz not null default now()
);

-- Vrai si le compte connecté est le propriétaire. `security definer` : lisible par les règles de toutes les tables
-- sans ouvrir `profils` ; `search_path` vide contre les détournements de schéma.
create function public.est_proprietaire()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profils
    where user_id = (select auth.uid()) and role = 'proprietaire'
  );
$$;
revoke execute on function public.est_proprietaire() from public;
grant execute on function public.est_proprietaire() to anon, authenticated;

-- Le compte existant (créé à la main, inscriptions fermées) est le propriétaire.
insert into public.profils (user_id, pseudo, role)
select id,
       case when row_number() over (order by created_at) = 1 then 'proprietaire'
            else 'proprietaire-' || row_number() over (order by created_at) end,
       'proprietaire'
from auth.users
on conflict (user_id) do nothing;

-- Profils : chacun lit le sien, le propriétaire les lit tous ; chacun modifie son pseudo, son avatar et la
-- visibilité, jamais son rôle. Création et suppression : par le serveur seulement (clé secrète).
alter table public.profils enable row level security;
create policy "profils : lecture du sien ou par le propriétaire" on public.profils
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.est_proprietaire()));
create policy "profils : modification du sien" on public.profils
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.profils from anon, authenticated;
grant update (pseudo, avatar, public) on public.profils to authenticated;

-- Catalogue : écriture réservée au propriétaire (au lieu de tout compte connecté).
drop policy "consoles : écriture propriétaire" on public.consoles;
create policy "consoles : écriture propriétaire" on public.consoles
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
drop policy "games : écriture propriétaire" on public.games;
create policy "games : écriture propriétaire" on public.games
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
drop policy "releases : écriture propriétaire" on public.releases;
create policy "releases : écriture propriétaire" on public.releases
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
drop policy "import_runs : propriétaire uniquement" on public.import_runs;
create policy "import_runs : propriétaire uniquement" on public.import_runs
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
drop policy "exclusions : propriétaire uniquement" on public.exclusions;
create policy "exclusions : propriétaire uniquement" on public.exclusions
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

-- Stockage : jaquettes (lecture par l'API et écriture) et relais GameTDB, réservés au propriétaire. Les visiteurs
-- voient toujours les jaquettes par leur adresse publique (bucket public, sans règle).
drop policy "jaquettes : lecture propriétaire" on storage.objects;
create policy "jaquettes : lecture propriétaire" on storage.objects
  for select to authenticated
  using (bucket_id = 'jaquettes' and (select public.est_proprietaire()));
drop policy "jaquettes : ajout propriétaire" on storage.objects;
create policy "jaquettes : ajout propriétaire" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'jaquettes' and (select public.est_proprietaire()));
drop policy "jaquettes : remplacement propriétaire" on storage.objects;
create policy "jaquettes : remplacement propriétaire" on storage.objects
  for update to authenticated
  using (bucket_id = 'jaquettes' and (select public.est_proprietaire()))
  with check (bucket_id = 'jaquettes' and (select public.est_proprietaire()));
drop policy "jaquettes : suppression propriétaire" on storage.objects;
create policy "jaquettes : suppression propriétaire" on storage.objects
  for delete to authenticated
  using (bucket_id = 'jaquettes' and (select public.est_proprietaire()));
drop policy "gametdb : lecture propriétaire" on storage.objects;
create policy "gametdb : lecture propriétaire" on storage.objects
  for select to authenticated
  using (bucket_id = 'gametdb' and (select public.est_proprietaire()));
