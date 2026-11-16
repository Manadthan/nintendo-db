# CLAUDE.md — Nintendo DB

Lu par Claude au début de chaque session. Court par principe : les détails sont dans les documents.

## Objectif

Site de référence des **jeux publiés par Nintendo**, sur **toutes les consoles Nintendo**, avec
bascule entre les versions **JAP / US / PAL** (titre, date, code produit, visuels propres à chaque région).
Inspiration : gamecartdb.com, limité à Nintendo éditeur.

**Projet d'apprentissage** du SDLC avec Claude : explique brièvement *pourquoi* tu fais chaque choix et
fais valider les décisions importantes (questions à choix). Le propriétaire travaille surtout depuis
l'app Claude sur **iPhone 12 mini** : réponses courtes, pas de commandes à taper sur son ordinateur.
Interface en **français**.

## Méthode

Suivre **`PLAYBOOK.md`** : intention → spec → design/maquettes → plan → PR → revue → déploiement → bilan.

## Documents de référence

| Fichier | Contenu | Statut |
|---|---|---|
| `PLAYBOOK.md` | Méthode SDLC appliquée au projet | v1.0 à valider |
| `intent/intent.md` | Problème, résultat attendu, contraintes, décisions | v1.0 validée |
| `docs/SPEC.md` | User stories + critères d'acceptation (= définition de « terminé ») | v0.1 brouillon |
| `docs/DESIGN.md` | Stack, ADR, modèle de données, sources de données, tests, risques | à faire |

## Règles de travail

- **Jamais de commit direct sur `main`.** Une issue → une branche → une PR → revue du propriétaire → merge.
- Branches : `feat/us-xx-…`, `fix/…`, `docs/…`, `chore/…`. Commits **Conventional Commits**.
- PR petites (< 300 lignes), décrivent les critères couverts **et ce qui n'a pas été vérifié**.
- **Plan validé avant de coder** chaque étape.
- Toute fonctionnalité arrive avec ses tests ; CI verte avant merge ; montrer la sortie des tests.
- Bug : d'abord un test qui échoue, puis la correction sans modifier le test.
- Données de jeux testées sur des **fixtures**, jamais sur des sites en direct.
- Aucun secret dans le dépôt.
- Une demande qui contredit SPEC ou DESIGN : le signaler, mettre le document à jour d'abord.
- Claude fait tout jusqu'au merge sur `main`, **jamais le merge lui-même**.
- Même erreur commise deux fois → ajouter la règle ici.

## Commandes

Stack retenue : Next.js, Tailwind, Supabase, Vercel. Commandes à définir dans DESIGN.md.

## Avancement

- [x] Phase 1 — Intention : `intent/intent.md` validée
- [ ] Phase 2 — Spec, design, maquettes validés
- [ ] Phase 3 — Issues et milestones de la première étape
- [ ] Phase 4+ — Développement par étapes
- [ ] Phase finale — Bilan

## Erreurs récurrentes

(vide pour l'instant)
