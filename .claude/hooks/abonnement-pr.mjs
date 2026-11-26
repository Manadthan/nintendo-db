// Hooks de Claude Code (.claude/settings.json) contre l'abonnement à la mauvaise PR (4 fois : #209, #219, #226, et
// #288 au lieu de #289 le 26/11/2026, où la création et l'abonnement étaient partis en parallèle). La création d'une
// PR est notée dans .claude/derniere-pr.json (hors Git) ; juste après, l'abonnement n'est accepté que pour ce numéro.
//   node abonnement-pr.mjs avant-creation   PreToolUse  mcp__github__create_pull_request : création en cours
//   node abonnement-pr.mjs apres-creation   PostToolUse mcp__github__create_pull_request : numéro lu dans l'adresse
//   node abonnement-pr.mjs avant-abonnement PreToolUse  mcp__claude-code-remote__subscribe_pr_activity : contrôle
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Après une création, l'abonnement qui suit doit viser cette PR pendant ce délai. */
export const DELAI_MS = 30 * 60 * 1000;

/** Numéro de PR lu dans l'adresse renvoyée par create_pull_request (« …/pull/289 ») ; null s'il n'y en a pas. */
export function numeroCree(reponse) {
  const texte =
    typeof reponse === "string" ? reponse : JSON.stringify(reponse ?? "");
  const trouve = /\/pull\/(\d+)/.exec(texte);
  return trouve ? Number(trouve[1]) : null;
}

/**
 * Refus (message) ou null : une création encore en cours (appels envoyés en parallèle) ou un numéro différent de la
 * PR créée il y a moins de 30 minutes. Sans création récente, tout abonnement passe (suivre une PR existante).
 */
export function refusAbonnement(etat, numero, maintenant) {
  if (!etat || maintenant - etat.le > DELAI_MS) return null;
  if (etat.enCours)
    return "Création de PR encore en cours : attendre son résultat, puis s'abonner au numéro lu dans l'adresse renvoyée (jamais deux appels en parallèle).";
  if (etat.numero && Number(numero) !== etat.numero)
    return `La PR qui vient d'être créée est la #${etat.numero} (adresse renvoyée par create_pull_request), pas la #${numero} : s'abonner à #${etat.numero}.`;
  return null;
}

const fichier = () =>
  join(
    process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
    ".claude",
    "derniere-pr.json",
  );

function lire() {
  try {
    return JSON.parse(readFileSync(fichier(), "utf8"));
  } catch {
    return null;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const evenement = JSON.parse(readFileSync(0, "utf8"));
  const maintenant = Date.now();
  const mode = process.argv[2];
  if (mode === "avant-creation") {
    writeFileSync(fichier(), JSON.stringify({ enCours: true, le: maintenant }));
  } else if (mode === "apres-creation") {
    const numero = numeroCree(evenement.tool_response);
    // Création ratée (pas d'adresse) : plus rien en cours, rien à imposer.
    writeFileSync(
      fichier(),
      JSON.stringify(numero ? { numero, le: maintenant } : { le: 0 }),
    );
  } else if (mode === "avant-abonnement") {
    const refus = refusAbonnement(
      lire(),
      evenement.tool_input?.pullNumber,
      maintenant,
    );
    if (refus) {
      process.stderr.write(`${refus}\n`);
      process.exit(2);
    }
  }
}
