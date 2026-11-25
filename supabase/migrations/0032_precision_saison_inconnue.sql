-- Étape 31 (ADR-20 point 3, SPEC v1.50) : dates annoncées des jeux à venir. Une date peut être connue à la saison
-- (« Printemps 2027 » : date_sortie = 1er jour de la saison) ou pas encore connue (« Date à venir » : date_sortie =
-- 31/12 de l'année annoncée, ou vide). Les lignes existantes ne changent pas.
alter type public.precision_date add value if not exists 'saison' after 'mois';
alter type public.precision_date add value if not exists 'inconnue' after 'annee';
