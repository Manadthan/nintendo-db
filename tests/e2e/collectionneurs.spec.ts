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

test("un lien d'invitation inconnu affiche un message clair (US-20)", async ({
  page,
}) => {
  await page.goto(`/bienvenue/${"x".repeat(43)}`);
  await expect(
    page.getByText("Ce lien d'invitation n'est plus valable."),
  ).toBeVisible();
  await page.goto("/bienvenue/pas-un-jeton");
  await expect(
    page.getByText(/demandez une nouvelle invitation/),
  ).toBeVisible();
});

test("un invité crée son compte par le lien, qui ne sert qu'une fois ; le propriétaire peut le supprimer (US-19, US-20)", async ({
  page,
  browser,
}) => {
  const pseudo = `inv-${Date.now().toString(36)}`;
  await seConnecter(page);
  await page.goto("/admin/collectionneurs");
  await page.getByLabel(/Nom de l'invité/).fill(pseudo);
  await page.getByRole("button", { name: "Créer une invitation" }).click();
  const lien = await page
    .getByLabel(`Lien d'invitation pour ${pseudo}`)
    .inputValue();

  // L'invité, sans session : un autre navigateur.
  const invite = await (await browser.newContext()).newPage();
  await invite.goto(lien);
  await expect(
    invite.getByRole("heading", { name: "Bienvenue" }),
  ).toBeVisible();
  await invite.getByLabel(/E-mail/).fill(`${pseudo}@exemple.fr`);
  await invite.getByLabel(/Mot de passe/).fill("court");
  await invite.getByLabel(/Pseudo/).fill(pseudo);
  await invite.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    invite.getByRole("alert").filter({ hasText: "8 caractères au moins" }),
  ).toBeVisible();
  await invite.getByLabel(/Mot de passe/).fill("Mot-de-passe-invite");
  await invite.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(invite).toHaveURL("/profil");
  await expect(invite.getByRole("heading", { name: pseudo })).toBeVisible();

  // Connecté en collectionneur : l'administration lui reste fermée.
  await invite.goto("/admin");
  await expect(invite).toHaveURL("/profil");

  // Le lien ne sert qu'une fois.
  await invite.goto(lien);
  await expect(
    invite.getByText("Ce lien d'invitation n'est plus valable."),
  ).toBeVisible();

  // Le propriétaire le voit inscrit, puis supprime son compte.
  await page.reload();
  const inscrit = page
    .getByRole("region", { name: "Collectionneurs inscrits" })
    .getByRole("article")
    .filter({ hasText: pseudo });
  await expect(inscrit).toContainText(`${pseudo}@exemple.fr`);
  await expect(
    page
      .getByRole("region", { name: "Invitations en attente" })
      .getByText(pseudo),
  ).toHaveCount(0);
  page.once("dialog", (d) => d.accept());
  await inscrit
    .getByRole("button", { name: `Supprimer le compte de ${pseudo}` })
    .click();
  await expect(inscrit).toHaveCount(0);
});
