---
name: script-prod
description: Lancer un script de données sur la base de production de nintendo-db depuis la session Claude (relais GameTDB, lot de jaquettes, retrait ou correction de jeux, contrôle), puis vérifier le résultat. À charger avant tout `npm run relais`, `npm run session` ou toute écriture dans Supabase en dehors de l'application.
---

# Script de données sur la production

Pourquoi tant de soin : la base et le stockage n'existent qu'en un exemplaire (les prévisualisations Vercel les
partagent), et une erreur se voit aussitôt sur le site.

## Quel outil

- **Relais GameTDB** : `npm run relais` (≈ 10 min). GameTDB bloque Vercel et GitHub, la session l'atteint. Le relais
  dépose les bases et les scans dans le bucket privé `gametdb` ; le catalogue ne change qu'avec l'**import**, que le
  propriétaire lance dans l'administration (il faut sa connexion). Lui donner les étapes et les chiffres attendus.
- **Correction ponctuelle** impossible depuis l'administration (lot de jaquettes, jeux retirés…) : un script dans
  `scripts/`, lancé par `npm run session -- scripts/xxx.mjs`.
- Correction qui doit valoir aussi pour une base neuve (CI, base locale) : une **migration**, pas un script
  (exemple : `supabase/migrations/0022_*`).

## Configuration

L'environnement cloud « nintendo-db » la fournit : `npm ci` au démarrage ; `SUPABASE_URL` et la fausse clé
`SUPABASE_SECRET_KEY=sb_secret_proxy-injected` en variables ; la vraie clé est injectée par le réseau dans l'en-tête
`apikey`, jamais vue.

- `npm run session` ajoute `NODE_USE_ENV_PROXY=1` : sans lui, Supabase répond `fetch failed`.
- Variables absentes (autre environnement, session plus ancienne) : les passer sur la ligne de commande ;
  ne **jamais** demander la vraie clé.
- Hôte refusé par le réseau : lire `read_documentation` (environment.network), proposer l'ajout ; aucun contournement.
- Script de contrôle hors du dépôt (scratchpad) : importer supabase-js par son chemin absolu
  (`/home/user/nintendo-db/node_modules/@supabase/supabase-js/dist/index.mjs`).
- `console.log` : jamais de `%` dans le premier argument (format printf : `"%fire…"` affiche `NaN`).

## Écrire le script

Modèles : `scripts/jaquettes-sans-usk.mjs` (jaquettes), `scripts/retirer-jeux.mjs` (retraits).

- En tête : date, décision du propriétaire, ce qui est visé, commande pour le lancer.
- **Lire avant d'écrire** ; sauter et lister ce qui ne correspond pas (version absente…). Une jaquette de source
  `photo` ou `url` a été ajoutée à la main : **jamais touchée**.
- Jaquettes : même conversion que l'application, WebP 300 / 600 / 768 (sharp), chemin versionné
  `{game_id}/{région}-{version}-{taille}.webp` (ADR-04) ; mettre à jour la ligne, puis supprimer l'ancienne version.
- Retrait d'un jeu : ses jaquettes du stockage, puis le jeu, puis une ligne `exclusions` (sinon l'import le remet).
- Sites externes : une requête par seconde.
- Fin : un résumé chiffré (« N copiée(s) ; M ignorée(s) » et la liste des ignorées).

## Lancer

- Dire au propriétaire ce qui sera écrit, et avoir son accord, avant la première écriture.
- Long (relais) : en arrière-plan, journal dans le scratchpad, suivi des lignes « base déposée » et des erreurs.

## Vérifier, avant de dire « fait »

1. **Base** : relire les lignes touchées (source, chemin de jaquette), les jeux ajoutés ou retirés, les exclusions.
2. **Images** : télécharger la 768 du stockage public `jaquettes`, la convertir en PNG et la **regarder**.
3. **Site** : `curl https://nintendo-db.vercel.app/jeux/{console}/{jeu}` contient le nouveau chemin ; les pages se
   renouvellent en 5 min au plus (`revalidate = 300`).
4. **Relais** : télécharger la base déposée et y chercher les jeux attendus ; après l'import du propriétaire,
   lister les jeux créés depuis et les comparer à l'attendu.

## Garder la trace

Le script reste dans `scripts/`, cité dans l'arborescence de CLAUDE.md ; il arrive par une PR (skill `steward`),
avec l'Avancement mis à jour.
