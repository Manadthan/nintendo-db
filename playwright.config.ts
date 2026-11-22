import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// iPhone 12 mini (docs/SPEC.md §2) : écran 375 × 812, tactile, agent Safari iOS.
const iphone12Mini = {
  ...devices["iPhone 12 Mini"],
  viewport: { width: 375, height: 812 },
};

// En local, les variables viennent de .env.local (base Supabase locale, voir README).
try {
  process.loadEnvFile(".env.local");
} catch {
  // Pas de .env.local (CI, ou environnement sans base) : variables déjà dans l'environnement, ou absentes.
}

const NAVIGATEURS = [
  {
    name: "iphone-12-mini",
    use: { ...iphone12Mini, browserName: "chromium" as const },
  },
  // WebKit = moteur de Safari, le navigateur de l'iPhone. Lancé seulement en CI (#7) :
  // il n'est pas installé dans l'environnement de Claude.
  ...(process.env.CI
    ? [
        {
          name: "iphone-12-mini-webkit",
          use: { ...iphone12Mini, browserName: "webkit" as const },
        },
      ]
    : []),
];

// Tests connectés en propriétaire (ils écrivent dans la base).
const ADMINISTRATION = /(collection|collectionneurs|connexion|correction|import|jaquettes)\.spec\.ts$/;

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
    // Pages publiques : lisent seulement les jeux de départ, en parallèle.
    ...NAVIGATEURS.map((n) => ({ ...n, testIgnore: ADMINISTRATION })),
    // Administration : ces tests ÉCRIVENT dans la base partagée (jeu ajouté puis supprimé, fiche corrigée…).
    // Ils passent après tous les tests publics, un navigateur après l'autre, pour que personne ne lise une
    // donnée de test en cours d'écriture (ex. un 5ᵉ jeu « Date inconnue » dans le catalogue).
    ...NAVIGATEURS.map((n, i) => ({
      name: `${n.name}-admin`,
      use: n.use,
      testMatch: ADMINISTRATION,
      dependencies: [
        ...NAVIGATEURS.map((m) => m.name),
        ...(i > 0 ? [`${NAVIGATEURS[i - 1]!.name}-admin`] : []),
      ],
    })),
  ],
  // Teste le build de production, comme sur Vercel.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
