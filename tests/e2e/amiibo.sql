-- Amiibo de test (US-29) pour la base locale et jetable des tests e2e (jamais la production) : un amiibo fictif
-- relié à Splatoon (jeu de départ, migration 0004) et à un jeu absent du catalogue ; sorti au Japon et en Europe
-- seulement (bascule US : « Non sorti dans cette région ») ; sans photo (vignette neutre : le bucket local est vide).
-- Chargé par la CI (ci.yml, job e2e) avant le build, qui prépare les fiches à l'avance.
insert into public.amiibo (identifiant, slug, nom, nom_jap, type, serie_amiibo, serie_jeux, personnage, editeur)
values ('0800000003380002', 'inkling-e2e', 'Inkling e2e', 'ガール e2e', 'figurine', 'Splatoon', 'Splatoon',
        'Inkling', 'Nintendo')
on conflict (identifiant) do nothing;
insert into public.amiibo_sorties (amiibo_id, region, date_sortie, precision_date)
select a.id, s.region::public.region, s.date_sortie::date, 'jour'
from public.amiibo a,
  (values ('JAP', '2015-05-28'), ('PAL', '2015-05-29')) as s (region, date_sortie)
where a.identifiant = '0800000003380002'
on conflict do nothing;
insert into public.amiibo_jeux (amiibo_id, game_id, titre_jeu, console, usage)
select a.id, j.id, 'Splatoon', 'Wii U', 'Unlock challenges and gear'
from public.amiibo a, public.games j
where a.identifiant = '0800000003380002' and j.slug = 'splatoon'
on conflict do nothing;
insert into public.amiibo_jeux (amiibo_id, game_id, titre_jeu, console, usage)
select a.id, null, 'Jeu hors catalogue e2e', 'Switch', 'Unlock a costume'
from public.amiibo a
where a.identifiant = '0800000003380002'
on conflict do nothing;
