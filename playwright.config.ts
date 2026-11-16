import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// iPhone 12 mini (docs/SPEC.md §2) : écran 375 × 812, tactile, agent Safari iOS.
const iphone12Mini = { ...devices["iPhone 12 Mini"], viewport: { width: 375, height: 812 } };

// En local, les variables viennent de .env.local (base Supabase locale, voir README).
try {
  process.loadEnvFile(".env.local");
} catch {
  // Pas de .env.local (CI, ou environnement sans base) : variables déjà dans l'environnement, ou absentes.
}

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Pas de trace par défaut (coûteux) ; seulement pour rejouer un test qui a échoué en CI.
    trace: process.env.CI ? "on-first-retry" : "off",
  },
  projects: [
    {
      name: "iphone-12-mini",
      use: { ...iphone12Mini, browserName: "chromium" },
    },
    // WebKit = moteur de Safari, le navigateur de l'iPhone. Lancé seulement en CI (#7) :
    // il n'est pas installé dans l'environnement de Claude.
    ...(process.env.CI
      ? [{ name: "iphone-12-mini-webkit", use: { ...iphone12Mini, browserName: "webkit" as const } }]
      : []),
  ],
  // Teste le build de production, comme sur Vercel.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
