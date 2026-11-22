-- Étape 27, PR 2a (SPEC US-19, DESIGN ADR-16 point 2) : invitations de collectionneurs par lien à partager.
-- Le jeton (32 octets aléatoires) n'est montré qu'une fois au propriétaire ; la base n'en garde que l'empreinte
-- SHA-256 : une fuite de la table ne permet pas de créer un compte. Lue et écrite par le seul propriétaire ; la page
-- « Bienvenue » (PR 2b) la lira côté serveur avec la clé secrète.

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null check (char_length(nom) between 1 and 40),
  jeton_hache text not null unique check (jeton_hache ~ '^[0-9a-f]{64}$'),
  cree_le     timestamptz not null default now(),
  expire_le   timestamptz not null default now() + interval '7 days',
  utilisee_le timestamptz,
  user_id     uuid references auth.users (id) on delete set null
);

alter table public.invitations enable row level security;
create policy "invitations : propriétaire uniquement" on public.invitations
  for all to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
revoke all on public.invitations from anon;
