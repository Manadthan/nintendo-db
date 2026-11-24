# pstack — skills reprises dans ce projet

Source : [backnotprop/pstack](https://github.com/backnotprop/pstack) (miroir de `cursor/plugins/pstack`, Lauren Tan),
commit `9dd3408` du 23/11/2026. Choix du propriétaire (24/11/2026) : **copie** d'une **sélection**, utilisée **par
défaut** quand elle s'applique (pas seulement sur demande).

| Skill | Quand Claude l'utilise |
|---|---|
| `tdd` | chaque bug : test qui échoue d'abord, puis la correction (règle de CLAUDE.md) |
| `typescript-best-practices` + `principle-type-system-discipline`, `principle-boundary-discipline` | écriture de code `.ts`/`.tsx` (nouveau ou touché) |
| `blast-radius` | avant d'ouvrir une PR risquée : ce que le changement peut casser ailleurs, prouvé par un script |
| `how` / `why` | comprendre une partie du code avant de la modifier / retrouver la raison d'un choix (commits, PR, ADR) |
| `correct` | une erreur répétée deux fois : la rendre impossible (architecture, types, test) avant de l'écrire dans CLAUDE.md |
| `reflect` | fin d'étape ou de bilan : leçons durables → modification d'une skill, par PR |

Adaptations au projet (le reste est la version d'origine, en anglais) :
- `disable-model-invocation` retiré : Claude peut les charger seul.
- `tdd` : obligatoire pour chaque bug (CLAUDE.md), au lieu de « seulement sur demande ».
- `typescript-best-practices` : les ADR de DESIGN.md l'emportent ; pas de réécriture de code non touché.
- `blast-radius`, `reflect`, `correct` : renvois vers `arena`, `unslop`, `poteto-mode` (non repris) remplacés ;
  modifications par PR, « Erreurs récurrentes » de CLAUDE.md comme table des règles.
- Fichiers `agents/openai.yaml` (Codex) non repris.

Non repris : `poteto-mode` et ses 22 playbooks (PLAYBOOK.md reste la méthode), `arena`, `swarm`, `interrogate`
(plusieurs modèles), `unslop` (règles pour l'anglais), les autres `principle-*` et skills d'outillage Cursor.

## Licence

```
MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
