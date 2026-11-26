-- Étape 30 (migration 0036, ADR-21 point 7) : le profil public compte les amiibo possédés et liste les derniers
-- ajoutés ; un profil privé ne renvoie toujours rien, et un visiteur ne lit toujours pas possessions_amiibo.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'amiibo@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'cache@test.local');
insert into public.profils (user_id, pseudo, avatar, public) values
  ('00000000-0000-0000-0000-0000000000d1', 'Fan-Amiibo', 'tortue', true),
  ('00000000-0000-0000-0000-0000000000d2', 'Cache-Amiibo', 'de', false);
insert into public.amiibo (id, identifiant, slug, nom, type) values
  ('00000000-0000-0000-0000-0000000000a1', '0000000000000001', 'test-a', 'Test A', 'figurine'),
  ('00000000-0000-0000-0000-0000000000a2', '0000000000000002', 'test-b', 'Test B', 'carte');
insert into public.possessions_amiibo (user_id, amiibo_id, cree_le) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a2', now()),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a1', now());

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is((public.profil_public('fan-amiibo') ->> 'amiibo')::int, 2, 'nombre d''amiibo possédés');
select is(
  public.profil_public('Fan-Amiibo') #>> '{ajouts_amiibo,0,amiibo,slug}', 'test-b',
  'derniers amiibo ajoutés, le plus récent d''abord'
);
select is(jsonb_array_length(public.profil_public('Fan-Amiibo') -> 'ajouts_amiibo'), 2, 'tous les ajouts (6 au plus)');
select ok(public.profil_public('Fan-Amiibo')::text !~ 'test\.local', 'jamais l''adresse e-mail');
select is(public.profil_public('Cache-Amiibo'), null, 'un profil privé ne renvoie rien');
select is_empty($$select amiibo_id from public.possessions_amiibo$$, 'un visiteur ne lit toujours pas les amiibo possédés');

select * from finish();
rollback;
