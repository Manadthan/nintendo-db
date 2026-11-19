import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-11 — Corriger une fiche (#44). Base Supabase locale (CI) : jeux de départ (migration 0004).
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("le propriétaire corrige un code produit ; le champ est alors verrouillé contre l'import", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Jeux/ }).click();
  // Mario Kart 8 : les tests publics (parallèles, même base) ne lisent pas son code produit.
  await page.getByRole("link", { name: /Mario Kart 8/ }).click();
  await expect(
    page.getByRole("heading", { name: "Mario Kart 8" }),
  ).toBeVisible();

  const code = page.locator('input[name="PAL.code_produit"]');
  await code.fill("WUP-P-AMKP-TEST");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");

  await page.reload();
  await expect(code).toHaveValue("WUP-P-AMKP-TEST");
  await expect(
    page
      .locator("fieldset", { hasText: "Europe" })
      .getByTitle(/Corrigé à la main/),
  ).toBeVisible();
});

test("une version sortie sans titre est refusée", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/admin/jeux/wii-u/splatoon");
  await page.locator('input[name="US.titre"]').fill("");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "le titre est obligatoire" }),
  ).toBeVisible();
});

test("le propriétaire ajoute un jeu manquant, puis le supprime après confirmation", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/admin/jeux");
  await page.getByText("+ Ajouter un jeu").click();
  await page.getByLabel("Titre").fill("Jeu de test e2e");
  await page.getByLabel("PAL").check();
  await page.getByRole("button", { name: "Ajouter le jeu" }).click();

  await expect(page).toHaveURL("/admin/jeux/wii-u/jeu-de-test-e2e?nouveau=1");
  await expect(page.getByRole("status")).toContainText("Jeu ajouté");
  await expect(page.locator('input[name="PAL.titre"]')).toHaveValue(
    "Jeu de test e2e",
  );

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Supprimer ce jeu" }).click();
  await expect(page).toHaveURL(/\/admin\/jeux\?supprime=.*console=wii-u/);
  await expect(page.getByRole("status")).toContainText("a été supprimé");
  await expect(page.getByRole("link", { name: /Jeu de test e2e/ })).toHaveCount(
    0,
  );
});

test("la liste des jeux se choisit par console (étape 8)", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/admin/jeux");
  const consoles = page.getByRole("navigation", { name: "Console" });
  await expect(
    consoles.getByRole("link", { name: "Wii U", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await consoles.getByRole("link", { name: "Wii", exact: true }).click();
  await expect(page).toHaveURL("/admin/jeux?console=wii");
  // Base de test : la Wii existe (migration 0007) mais n'a pas encore de jeux.
  await expect(page.getByText("0 jeux Wii.")).toBeVisible();
  await page.getByText("+ Ajouter un jeu").click();
  await expect(page.getByText("Console : Wii", { exact: true })).toBeVisible();
});

test("note Metacritic saisie à la main : sur la fiche (avec lien) et en étiquette dans le catalogue (US-17)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/admin/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await page.locator('input[name="metacritic_note"]').fill("73");
  await page
    .locator('input[name="metacritic_url"]')
    .fill("https://www.metacritic.com/game/kirby-and-the-rainbow-curse/");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");

  await page.goto("/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await expect(
    page.getByRole("link", {
      name: "Metacritic : 73 sur 100 (page Metacritic)",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    "https://www.metacritic.com/game/kirby-and-the-rainbow-curse/",
  );
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Metacritic : 73 sur 100", exact: true }),
  ).toBeVisible();

  // Nettoyage : note effacée (le champ reste verrouillé, sans effet sur les autres tests).
  await page.goto("/admin/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await page.locator('input[name="metacritic_note"]').fill("");
  await page.locator('input[name="metacritic_url"]').fill("");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
});
