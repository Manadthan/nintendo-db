import { defineConfig } from "vitest/config";

export default defineConfig({
  // Alias « @/… » lus dans tsconfig.json (pris en charge nativement par Vite).
  resolve: { tsconfigPaths: true },
  test: {
    // Tests unitaires dans src/ et le hook de Claude Code (.claude/hooks/) ; les tests e2e (tests/e2e) sont lancés par Playwright (#6).
    include: ["src/**/*.test.ts", ".claude/hooks/**/*.test.mjs"],
    environment: "node",
  },
});
