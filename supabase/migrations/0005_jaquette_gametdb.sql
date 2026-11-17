-- Jaquettes : les scans de boîtes GameTDB deviennent la source prioritaire (DESIGN v0.6, ADR-04, #46).
alter type public.jaquette_source add value if not exists 'gametdb' before 'igdb';
