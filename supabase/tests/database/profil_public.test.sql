-- Étape 27 (migration 0026, ADR-16 point 4) : un visiteur ne voit un profil que s'il est public, sans e-mail, et ne
-- lit toujours ni les profils ni les collections directement.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c3', 'lea@test.local'),
  ('00000000-0000-0000-0000-0000000000c4', 'secret@test.local');
insert into public.profils (user_id, pseudo, avatar, public) values
  ('00000000-0000-0000-0000-0000000000c3', 'Lea-64', 'tortue', true),
  ('00000000-0000-0000-0000-0000000000c4', 'Discret', 'de', false);
insert into public.possessions (user_id, game_id, region)
select '00000000-0000-0000-0000-0000000000c3', id, 'PAL' from public.games where slug = 'splatoon';
insert into public.possessions (user_id, game_id, region)
select '00000000-0000-0000-0000-0000000000c4', id, 'JAP' from public.games where slug = 'splatoon';

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(public.profil_public('lea-64') ->> 'pseudo', 'Lea-64', 'profil public trouvé, sans distinction de majuscules');
select is(public.profil_public('Lea-64') ->> 'avatar', 'tortue', 'avec son avatar');
select is(jsonb_array_length(public.profil_public('Lea-64') -> 'versions'), 1, 'avec ses versions possédées');
select is(
  public.profil_public('Lea-64') #>> '{ajouts,0,games,slug}', 'splatoon',
  'avec ses derniers ajouts (jeu, console, titres et jaquettes)'
);
select ok(public.profil_public('Lea-64')::text !~ 'test\.local', 'jamais l''adresse e-mail');
select is(public.profil_public('Discret'), null, 'un profil privé ne renvoie rien');
select is(public.profil_public('inconnu'), null, 'un pseudo inconnu ne renvoie rien');
select is_empty($$select game_id from public.possessions$$, 'un visiteur ne lit toujours pas les collections');

select * from finish();
rollback;
