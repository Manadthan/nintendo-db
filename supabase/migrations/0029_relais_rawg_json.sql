-- Étape 28 (ADR-18 point 5) : le relais RAWG dépose ses résultats en JSON dans le bucket privé « gametdb »
-- (rawg/{console}.json). Le bucket n'acceptait que le XML et le JPEG (0006) : premier relais du 23/11 refusé
-- (« mime type application/json is not supported »).
update storage.buckets
set allowed_mime_types = array['application/xml', 'image/jpeg', 'application/json']
where id = 'gametdb';
