-- Couvertures des guides copiées depuis Amazon Japon (SPEC v1.52 US-27, DESIGN v1.45 ADR-19 point 2 révisé, choix du
-- propriétaire du 26/11/2026). La base garde le chemin de la copie dans le bucket public `guides`
-- ({isbn}-{version}.webp : une nouvelle image change l'adresse, ADR-04) ; `null` = pas de copie, la couverture Google
-- Books (google_books_id) sert alors de secours.

alter table public.guides
  add column couverture text check (couverture ~ '^97[89][0-9]{10}-[0-9]{1,4}\.webp$');

comment on column public.guides.couverture is
  'Chemin de la couverture copiée (Amazon Japon) dans le bucket public guides ; null = Google Books ou vignette neutre.';

-- Images : bucket public (adresse publique pour les visiteurs), écriture réservée au propriétaire et à la clé secrète.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guides', 'guides', true, 1048576, array['image/webp'])  -- WebP de 1 Mo au plus
on conflict (id) do nothing;

create policy "guides : lecture propriétaire" on storage.objects
  for select to authenticated
  using (bucket_id = 'guides' and (select public.est_proprietaire()));
create policy "guides : ajout propriétaire" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'guides' and (select public.est_proprietaire()));
create policy "guides : remplacement propriétaire" on storage.objects
  for update to authenticated
  using (bucket_id = 'guides' and (select public.est_proprietaire()))
  with check (bucket_id = 'guides' and (select public.est_proprietaire()));
create policy "guides : suppression propriétaire" on storage.objects
  for delete to authenticated
  using (bucket_id = 'guides' and (select public.est_proprietaire()));
