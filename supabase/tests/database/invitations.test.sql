-- Étape 27 (migration 0025, ADR-16 point 2) : seules les empreintes de jetons sont gardées, et seul le propriétaire
-- lit ou crée une invitation.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a2', 'proprietaire@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'collectionneur@test.local');
insert into public.profils (user_id, pseudo, role) values
  ('00000000-0000-0000-0000-0000000000a2', 'Patron', 'proprietaire'),
  ('00000000-0000-0000-0000-0000000000c2', 'Lea-64', 'collectionneur');

select throws_ok(
  $$insert into public.invitations (nom, jeton_hache) values ('Léa', 'jeton-en-clair')$$,
  '23514', null, 'un jeton en clair (pas une empreinte SHA-256) est refusé'
);

-- Le propriétaire connecté.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';
select lives_ok(
  $$insert into public.invitations (nom, jeton_hache) values ('Léa', repeat('a', 64))$$,
  'le propriétaire crée une invitation'
);
select ok(
  (select expire_le between now() + interval '7 days' - interval '1 minute' and now() + interval '7 days'
   from public.invitations where nom = 'Léa'),
  'elle expire 7 jours après sa création'
);

-- Un collectionneur connecté.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated"}';
select is_empty($$select nom from public.invitations$$, 'un collectionneur ne lit pas les invitations');
select throws_ok(
  $$insert into public.invitations (nom, jeton_hache) values ('Pirate', repeat('b', 64))$$,
  '42501', null, 'un collectionneur ne crée pas d''invitation'
);
select is_empty(
  $$update public.invitations set expire_le = now() + interval '1 year' returning nom$$,
  'un collectionneur ne prolonge pas une invitation'
);

-- Un visiteur.
set local role anon;
select throws_ok($$select nom from public.invitations$$, '42501', null, 'un visiteur ne lit pas les invitations');

select * from finish();
rollback;
