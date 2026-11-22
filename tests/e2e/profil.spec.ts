import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, COLLECTIONNEUR_TEST } from "./utilisateur";

// US-22 — Mon profil (étape 27, PR 3a). Base Supabase locale (CI) : le collectionneur de test (global-setup).
// Le pseudo n'est pas modifié pour de bon (d'autres tests le lisent) : seuls les refus sont vérifiés.
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("sans connexion, Mon profil renvoie vers la connexion", async ({
  page,
}) => {
  await page.goto("/profil");
  await expect(page).toHaveURL("/admin/connexion");
});

test("un collectionneur change d'avatar, rend son profil public, puis se déconnecte", async ({
  page,
}) => {
  await page.goto("/admin/connexion");
  await page.getByLabel("E-mail").fill(COLLECTIONNEUR_TEST.email);
  await page.getByLabel("Mot de passe").fill(COLLECTIONNEUR_TEST.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/profil");
  await expect(
    page.getByRole("heading", { name: "e2e-collectionneur" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(
    0,
  );

  // Pseudo déjà pris (sans distinction de majuscules), puis pseudo invalide : refusés.
  await page.getByText("Modifier mon pseudo ou mon avatar").click();
  const pseudo = page.getByLabel(/^Pseudo/);
  await pseudo.fill("E2E-Proprietaire");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "déjà pris" }),
  ).toBeVisible();
  await page.getByLabel(/^Pseudo/).fill("é");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "3 à 20 lettres" }),
  ).toBeVisible();

  // Avatar : la tortue, gardée après rechargement.
  await page.getByLabel(/^Pseudo/).fill("e2e-collectionneur");
  await page.getByRole("radio", { name: "Tortue", exact: true }).check();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Profil enregistré" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("img", { name: "Avatar : Tortue" }),
  ).toBeVisible();

  // Profil public, gardé après rechargement, puis remis en privé.
  const interrupteur = page.getByRole("switch", { name: "Profil public" });
  await expect(interrupteur).not.toBeChecked();
  await interrupteur.check();
  await expect(page.getByText(/pourra être vu/)).toBeVisible();
  await page.reload();
  await expect(interrupteur).toBeChecked();
  await interrupteur.uncheck();
  await expect(page.getByText(/vous seul voyez/)).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/");
});
