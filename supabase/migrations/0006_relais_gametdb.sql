-- Relais GameTDB (#53) : GameTDB refuse les connexions des serveurs de Vercel. Une tâche GitHub (qui y accède)
-- dépose ici la base Wii U et les scans de boîtes ; l'import les lit au lieu d'appeler GameTDB.
-- Bucket privé : écrit par la tâche GitHub (clé secrète, hors RLS), lu par le propriétaire connecté (import).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gametdb', 'gametdb', false, 10485760, array['application/xml', 'image/jpeg'])  -- 10 Mo au plus
on conflict (id) do nothing;

create policy "gametdb : lecture propriétaire"
  on storage.objects for select to authenticated
  using (bucket_id = 'gametdb');
