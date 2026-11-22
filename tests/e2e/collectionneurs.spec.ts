import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-19 — Page « Collectionneurs » (étape 27, PR 2a). Base Supabase locale (CI) : le collectionneur de test
// (global-setup) est inscrit ; l'invitation créée ici est annulée à la fin.
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("la page « Collectionneurs » est réservée au propriétaire", async ({
  page,
}) => {
  await page.goto("/admin/collectionneurs");
  await expect(page).toHaveURL("/admin/connexion");
});

test("le propriétaire invite par un lien à partager, puis annule l'invitation", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Collectionneurs/ }).click();
  await expect(page).toHaveURL("/admin/collectionneurs");

  // Le collectionneur de test est listé, avec son e-mail.
  const inscrits = page.getByRole("region", {
    name: "Collectionneurs inscrits",
  });
  await expect(
    inscrits.getByText("e2e-collectionneur", { exact: true }),
  ).toBeVisible();
  await expect(
    inscrits.getByText("e2e-collectionneur@exemple.fr"),
  ).toBeVisible();

  // Un nom vide est refusé.
  await page.getByRole("button", { name: "Créer une invitation" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Donnez un nom" }),
  ).toBeVisible();

  // Le lien à partager mène à la page Bienvenue du même site.
  await page.getByLabel(/Nom de l'invité/).fill("Invité e2e");
  await page.getByRole("button", { name: "Créer une invitation" }).click();
  const lien = page.getByLabel("Lien d'invitation pour Invité e2e");
  await expect(lien).toHaveValue(
    /^http:\/\/localhost:\d+\/bienvenue\/[A-Za-z0-9_-]{43}$/,
  );

  // L'invitation est en attente ; un nouveau lien remplace l'ancien.
  const enAttente = page
    .getByRole("region", { name: "Invitations en attente" })
    .getByRole("article")
    .filter({ hasText: "Invité e2e" });
  await expect(enAttente).toContainText("expire le");
  const ancien = await lien.inputValue();
  await enAttente
    .getByRole("button", { name: "Nouveau lien", exact: true })
    .click();
  const nouveau = enAttente.getByLabel("Lien d'invitation pour Invité e2e");
  await expect(nouveau).toHaveValue(/\/bienvenue\//);
  expect(await nouveau.inputValue()).not.toBe(ancien);

  // Annulée (après confirmation), elle disparaît.
  page.once("dialog", (d) => d.accept());
  await enAttente.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(enAttente).toHaveCount(0);
});
