import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-11 — Corriger une fiche (#44). Base Supabase locale (CI) : jeux de départ (migration 0004).
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("le propriétaire corrige un code produit ; le champ est alors verrouillé contre l'import", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Jeux/ }).click();
  await page.getByRole("link", { name: /Splatoon/ }).click();
  await expect(page.getByRole("heading", { name: "Splatoon" })).toBeVisible();

  const code = page.locator('input[name="PAL.code_produit"]');
  await code.fill("WUP-P-AGMP-TEST");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");

  await page.reload();
  await expect(code).toHaveValue("WUP-P-AGMP-TEST");
  await expect(
    page
      .locator("fieldset", { hasText: "Europe" })
      .getByTitle(/Corrigé à la main/),
  ).toBeVisible();
});

test("une version sortie sans titre est refusée", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/admin/jeux/splatoon");
  await page.locator('input[name="US.titre"]').fill("");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "le titre est obligatoire" }),
  ).toBeVisible();
});
