// Hook PreToolUse (Bash) de Claude Code, configuré dans .claude/settings.json : avant un `git commit`, lance
// `npm run check` (CLAUDE.md : « à lancer avant chaque commit ») et refuse le commit (code 2) s'il échoue. Les autres
// commandes passent sans contrôle.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Vrai si la commande shell lance un `git commit`, seul ou enchaîné (`&&`, `;`, `|`), ou `git -C dossier commit`. */
export function estUnCommit(commande) {
  return /(^|[\s;&|(])git(\s+-C\s+\S+)?\s+commit(\s|$)/.test(commande);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { tool_input } = JSON.parse(readFileSync(0, "utf8"));
  if (estUnCommit(tool_input?.command ?? "")) {
    const check = spawnSync("npm", ["run", "check"], {
      cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
      encoding: "utf8",
    });
    if (check.status !== 0) {
      const fin = `${check.stdout}${check.stderr}`.trim().split("\n").slice(-40).join("\n");
      process.stderr.write(`npm run check a échoué : commit refusé. Corriger, puis recommencer.\n${fin}\n`);
      process.exit(2);
    }
  }
}
