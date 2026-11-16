import { expect, type Page } from "@playwright/test";

/** Compte fictif, créé uniquement sur la base Supabase locale et jetable des tests. */
export const PROPRIETAIRE_TEST = {
  email: "e2e@exemple.fr",
  password: "Mot-de-passe-e2e-42",
} as const;

/** Les tests de connexion ont besoin d'une base Supabase locale (toujours présente en CI). */
export const BASE_LOCALE_DISPONIBLE = Boolean(process.env.E2E_SUPABASE_SECRET_KEY);

export async function seConnecter(page: Page) {
  await page.goto("/admin/connexion");
  await page.getByLabel("E-mail").fill(PROPRIETAIRE_TEST.email);
  await page.getByLabel("Mot de passe").fill(PROPRIETAIRE_TEST.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/admin");
}
