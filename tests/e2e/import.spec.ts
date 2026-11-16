import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-10 — Aperçu de l'import (#34). L'analyse elle-même interroge Wikipédia et IGDB : jamais lancée en test
// (règle : fixtures seulement) ; sa logique est testée en unitaire sur les fixtures.
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("la page d'import est réservée au propriétaire", async ({ page }) => {
  await page.goto("/admin/import");
  await expect(page).toHaveURL("/admin/connexion");
});

test("depuis l'administration, le propriétaire ouvre l'aperçu de l'import", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Import Wii U/ }).click();
  await expect(page).toHaveURL("/admin/import");
  await expect(
    page.getByRole("heading", { name: "Import Wii U" }),
  ).toBeVisible();
  await expect(page.getByText("n'enregistre rien")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyser la Wii U" }),
  ).toBeEnabled();
});
