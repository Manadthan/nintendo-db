-- Guide de test (US-27) pour la base locale et jetable des tests e2e (jamais la production) : un guide fictif
-- (ISBN valide inventé) pour Mario Kart 8 (jeu de départ, migration 0004). La couverture est interceptée par
-- Playwright (guides.spec.ts). Chargé par la CI (ci.yml, job e2e) avant le build, qui prépare les pages à l'avance.
insert into public.guides (isbn, titre, editeur, date_parution, precision_date, pages, google_books_id, ndl_url)
values ('9784000000017', 'マリオカート8 パーフェクトガイド', 'エンターブレイン', '2014-06-01', 'mois', 160,
        'e2eCouverture1', 'https://ndlsearch.ndl.go.jp/books/e2e')
on conflict (isbn) do nothing;
insert into public.guides_jeux (guide_id, game_id)
select g.id, j.id from public.guides g, public.games j
where g.isbn = '9784000000017' and j.slug = 'mario-kart-8'
on conflict do nothing;
