-- Étape 30, PR 7b (SPEC US-30, DESIGN ADR-21 point 7) : le profil public montre aussi les amiibo possédés.
-- Remplace profil_public() (migration 0026) : mêmes clés, plus
--   'amiibo'         : nombre d'amiibo possédés ;
--   'ajouts_amiibo'  : les 6 derniers amiibo ajoutés (slug, nom, chemin de la photo, date d'ajout).
-- Toujours security definer, toujours seulement pour un profil public, jamais l'adresse e-mail ; les visiteurs ne
-- lisent toujours pas possessions_amiibo directement (RLS de la migration 0033 inchangée).

create or replace function public.profil_public(p_pseudo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'pseudo', p.pseudo::text,
    'avatar', p.avatar,
    'cree_le', p.cree_le,
    'versions', coalesce(
      (select jsonb_agg(jsonb_build_object('game_id', v.game_id, 'region', v.region))
       from public.possessions v where v.user_id = p.user_id),
      '[]'::jsonb),
    'ajouts', coalesce(
      (select jsonb_agg(a order by a.cree_le desc)
       from (
         select v.region, v.cree_le,
                jsonb_build_object(
                  'slug', g.slug,
                  'consoles', jsonb_build_object('slug', c.slug, 'nom', c.nom),
                  'releases', coalesce(
                    (select jsonb_agg(jsonb_build_object('region', r.region, 'titre', r.titre,
                                                         'jaquette_path', r.jaquette_path))
                     from public.releases r where r.game_id = g.id),
                    '[]'::jsonb)
                ) as games
         from public.possessions v
         join public.games g on g.id = v.game_id
         join public.consoles c on c.id = g.console_id
         where v.user_id = p.user_id
         order by v.cree_le desc
         limit 6
       ) a),
      '[]'::jsonb),
    'amiibo', (select count(*) from public.possessions_amiibo pa where pa.user_id = p.user_id),
    'ajouts_amiibo', coalesce(
      (select jsonb_agg(a order by a.cree_le desc)
       from (
         select pa.cree_le,
                jsonb_build_object('slug', am.slug, 'nom', am.nom, 'image_path', am.image_path) as amiibo
         from public.possessions_amiibo pa
         join public.amiibo am on am.id = pa.amiibo_id
         where pa.user_id = p.user_id
         order by pa.cree_le desc
         limit 6
       ) a),
      '[]'::jsonb)
  )
  from public.profils p
  where lower(p.pseudo::text) = lower(p_pseudo) and p.public;
$$;
revoke execute on function public.profil_public(text) from public;
grant execute on function public.profil_public(text) to anon, authenticated;
