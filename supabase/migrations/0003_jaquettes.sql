-- Stockage des jaquettes (ADR-04) : copiées depuis IGDB (ou ajoutées à la main), ré-encodées en WebP.
-- Bucket public : les jaquettes s'affichent par simple URL, pour tous les visiteurs.
-- Seule l'écriture est protégée : réservée au propriétaire (inscriptions désactivées, ADR-01).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jaquettes', 'jaquettes', true, 1048576, array['image/webp'])  -- WebP de 1 Mo au plus
on conflict (id) do nothing;

-- La lecture par l'API (nécessaire pour remplacer une image) est réservée au propriétaire ;
-- les visiteurs passent par l'URL publique, qui ne dépend d'aucune politique.
create policy "jaquettes : lecture propriétaire"
  on storage.objects for select to authenticated
  using (bucket_id = 'jaquettes');

create policy "jaquettes : ajout propriétaire"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'jaquettes');

create policy "jaquettes : remplacement propriétaire"
  on storage.objects for update to authenticated
  using (bucket_id = 'jaquettes')
  with check (bucket_id = 'jaquettes');

create policy "jaquettes : suppression propriétaire"
  on storage.objects for delete to authenticated
  using (bucket_id = 'jaquettes');
