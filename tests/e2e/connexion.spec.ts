import { expect, test } from "@playwright/test";
import {
  BASE_LOCALE_DISPONIBLE,
  COLLECTIONNEUR_TEST,
  PROPRIETAIRE_TEST,
  seConnecter,
} from "./utilisateur";

// US-09 — Se connecter (docs/SPEC.md)
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("le site public n'a qu'un accès à l'administration : l'icône de compte de l'en-tête (SPEC v1.15)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(1);
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Se connecter", exact: true }),
  ).toHaveAttribute("href", "/admin/connexion");
});

test("connecté, l'icône de compte est pleine et mène directement à l'administration", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/");
  const compte = page
    .getByRole("banner")
    .getByRole("link", { name: "Mon compte (connecté)", exact: true });
  await expect(compte).toHaveAttribute("href", "/admin");
  await compte.click();
  await expect(page).toHaveURL("/admin");
});

test("sans être connecté, l'administration renvoie vers la connexion", async ({
  page,
}) => {
  for (const chemin of ["/admin", "/admin/import"]) {
    await page.goto(chemin);
    await expect(page).toHaveURL("/admin/connexion");
  }
  await expect(
    page.getByRole("heading", { name: "Administration" }),
  ).toBeVisible();
});

test("un mauvais mot de passe affiche une erreur qui ne dit pas quel champ est faux", async ({
  page,
}) => {
  await page.goto("/admin/connexion");
  await page.getByLabel("E-mail").fill(PROPRIETAIRE_TEST.email);
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "E-mail ou mot de passe incorrect.",
  );
  await expect(page).toHaveURL("/admin/connexion");
  await expect(page.getByLabel("E-mail")).toHaveValue(PROPRIETAIRE_TEST.email);

  // Même message pour un e-mail inconnu.
  await page.getByLabel("E-mail").fill("inconnu@exemple.fr");
  await page.getByLabel("Mot de passe").fill(PROPRIETAIRE_TEST.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "E-mail ou mot de passe incorrect.",
  );
});

test("le propriétaire se connecte, puis se déconnecte", async ({ page }) => {
  await seConnecter(page);
  await expect(
    page.getByText(`Connecté en tant que ${PROPRIETAIRE_TEST.email}.`),
  ).toBeVisible();

  // Déjà connecté : la page de connexion renvoie vers l'administration.
  await page.goto("/admin/connexion");
  await expect(page).toHaveURL("/admin");

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/admin");
  await expect(page).toHaveURL("/admin/connexion");
});

test("un collectionneur invité se connecte, arrive sur son profil, et l'administration lui reste fermée (ADR-16, US-22)", async ({
  page,
}) => {
  await page.goto("/admin/connexion");
  await page.getByLabel("E-mail").fill(COLLECTIONNEUR_TEST.email);
  await page.getByLabel("Mot de passe").fill(COLLECTIONNEUR_TEST.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/profil");
  for (const chemin of ["/admin", "/admin/jeux", "/admin/connexion"]) {
    await page.goto(chemin);
    await expect(page).toHaveURL("/profil");
  }

  // L'icône de compte de l'en-tête mène à son profil (US-22).
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Mon compte (connecté)", exact: true })
    .click();
  await expect(page).toHaveURL("/profil");
});
