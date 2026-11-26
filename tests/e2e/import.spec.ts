import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-10 — Aperçu de l'import (#34). L'analyse elle-même lit Wikipédia et le relais GameTDB : jamais lancée en test
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

test("l'import Wii s'ouvre depuis l'administration, avec GameTDB pour seule source", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Import Wii \(GameTDB\)/ }).click();
  await expect(page).toHaveURL("/admin/import?console=wii");
  await expect(
    page.getByRole("heading", { name: "Import Wii", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("base GameTDB seule")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyser la Wii", exact: true }),
  ).toBeEnabled();
});

test("les imports DS et 3DS s'ouvrent depuis l'administration (étape 9)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Import DS \(GameTDB\)/ }).click();
  await expect(page).toHaveURL("/admin/import?console=ds");
  await expect(
    page.getByRole("button", { name: "Analyser la DS", exact: true }),
  ).toBeEnabled();
  await page.goto("/admin/import?console=3ds");
  await expect(
    page.getByRole("heading", { name: "Import 3DS", exact: true }),
  ).toBeVisible();
});

test("l'import des annonces s'ouvre depuis l'administration (US-33)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Import des annonces/ }).click();
  await expect(page).toHaveURL("/admin/import/annonces");
  await expect(
    page.getByRole("heading", { name: "Import des annonces", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyser les annonces", exact: true }),
  ).toBeEnabled();
  // Base jetable : le relais n'y a rien déposé, l'analyse le dit (jamais Nintendo en direct dans les tests).
  await page
    .getByRole("button", { name: "Analyser les annonces", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Annonces absentes" }),
  ).toBeVisible();
});
