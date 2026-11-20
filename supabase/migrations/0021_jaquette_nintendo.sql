-- SPEC v1.29 : boîtes européennes officielles (nintendo.com/eu, PEGI) pour les jeux Wii U et Switch sans boîte
-- française chez GameTDB ; source citée sur la fiche, gardée par l'import comme un ajout à la main.
alter type public.jaquette_source add value if not exists 'nintendo' after 'gamecartdb';
