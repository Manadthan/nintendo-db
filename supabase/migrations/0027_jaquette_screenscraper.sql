-- Étape 26 (DESIGN §11, 22/11/2026) : boîtes de ScreenScraper pour les versions sans jaquette (accord du site pour
-- l'hébergement avec mention de la source) ; source citée sur la fiche, gardée par l'import comme un ajout à la main.
alter type public.jaquette_source add value if not exists 'screenscraper' after 'nintendo';
