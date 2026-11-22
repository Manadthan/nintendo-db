-- Étape 27, PR 5 (SPEC US-23, DESIGN ADR-16 point 4) : profil public d'un collectionneur.
-- Les visiteurs ne lisent jamais `profils` ni `possessions` (RLS inchangée) : cette fonction `security definer` ne
-- renvoie que ce qui est public — pseudo, avatar, date d'inscription, versions possédées et 6 derniers ajouts —
-- et seulement si le profil est public. Jamais l'adresse e-mail. Profil privé ou pseudo inconnu : null (on ne peut
-- pas savoir si le compte existe). Pseudo comparé sans distinction de majuscules (citext).

create function public.profil_public(p_pseudo text)
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
      '[]'::jsonb)
  )
  from public.profils p
  where p.pseudo = p_pseudo::extensions.citext and p.public;
$$;
revoke execute on function public.profil_public(text) from public;
grant execute on function public.profil_public(text) to anon, authenticated;
