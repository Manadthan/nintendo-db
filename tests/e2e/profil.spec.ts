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

test("un collectionneur change d'avatar, rend son profil public (US-23), puis se déconnecte", async ({
  page,
  browser,
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

  // Profil public (US-23) : privé, un visiteur ne le trouve pas ; public, il le voit à l'adresse affichée ;
  // remis en privé, il disparaît aussitôt.
  const visiteur = await (await browser.newContext()).newPage();
  const adresse = "/collectionneurs/e2e-collectionneur";
  await visiteur.goto(adresse);
  await expect(
    visiteur.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();

  const interrupteur = page.getByRole("switch", { name: "Profil public" });
  await expect(interrupteur).not.toBeChecked();
  await interrupteur.check();
  await expect(
    page.getByText("Visible par ceux qui ont le lien."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /\/collectionneurs\/e2e-collectionneur$/ }),
  ).toBeVisible();
  await page.reload();
  await expect(interrupteur).toBeChecked();

  await visiteur.goto(adresse);
  await expect(
    visiteur.getByRole("heading", { name: "e2e-collectionneur" }),
  ).toBeVisible();
  await expect(
    visiteur.getByRole("img", { name: "Avatar : Tortue" }),
  ).toBeVisible();
  await expect(visiteur.getByText("e2e-collectionneur@exemple.fr")).toHaveCount(
    0,
  );
  // Une seule adresse par profil, en minuscules.
  await visiteur.goto("/collectionneurs/E2E-Collectionneur");
  await expect(
    visiteur.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();

  await interrupteur.uncheck();
  await expect(page.getByText(/vous seul voyez/)).toBeVisible();
  await visiteur.goto(adresse);
  await expect(
    visiteur.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/");
});

test("Mon profil résume la collection du collectionneur et ses derniers ajouts (US-22)", async ({
  page,
}) => {
  await page.goto("/admin/connexion");
  await page.getByLabel("E-mail").fill(COLLECTIONNEUR_TEST.email);
  await page.getByLabel("Mot de passe").fill(COLLECTIONNEUR_TEST.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/profil");
  const collection = page.getByRole("region", { name: "Ma collection" });
  await expect(collection).toContainText("Votre collection est vide");
  await expect(
    page.getByRole("region", { name: "Derniers ajouts" }),
  ).toHaveCount(0);

  // Sa collection est la sienne : il coche Splatoon en Europe.
  const caseEurope = page.getByRole("checkbox", {
    name: "Je l'ai : version Europe",
    exact: true,
  });
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope.check();
  await expect(caseEurope).toBeChecked();

  await page.goto("/profil");
  await expect(
    collection.getByRole("listitem", { name: /^Wii U : 1 jeu sur \d+$/ }),
  ).toBeVisible();
  await expect(
    collection.getByRole("listitem", { name: "PAL : 1 version" }),
  ).toBeVisible();
  await expect(
    collection.getByRole("listitem", { name: "JAP : 0 version" }),
  ).toBeVisible();
  // Badges (US-24) : aucun gagné avec un seul jeu ; les prochains, avec leur progression.
  const badges = page.getByRole("region", { name: "Badges" });
  await expect(badges).toContainText("Aucun badge pour l'instant");
  await expect(
    badges.getByRole("listitem", { name: "Débutant : 1 / 10 jeux" }),
  ).toBeVisible();
  await expect(
    badges.getByRole("listitem", { name: /^Moitié Wii U : 1 \/ \d+ jeux$/ }),
  ).toBeVisible();
  const ajouts = page.getByRole("region", { name: "Derniers ajouts" });
  await expect(ajouts.getByRole("link", { name: /Splatoon/ })).toHaveAttribute(
    "href",
    "/jeux/wii-u/splatoon",
  );

  // Nettoyage.
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope.uncheck();
  await page.reload();
  await expect(caseEurope).not.toBeChecked();
});
