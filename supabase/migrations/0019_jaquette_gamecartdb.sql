-- Jaquettes Switch 2 copiées de gamecartdb.com (choix du propriétaire, 19/11/2026) : boîtes américaine et européenne,
-- citées comme source sur la fiche et dans « À propos ».
alter type public.jaquette_source add value if not exists 'gamecartdb' after 'libretro';
