import { expect, test } from "@playwright/test";

test.describe("accueil", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("s'affiche en français avec le nom du site", async ({ page }) => {
    await expect(page).toHaveTitle("Nintendo DB");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("banner")).toContainText("Nintendo DB");
    // Sur-titre, titre et sous-titre comme sur gamecartdb (demande du propriétaire, 25/11/2026).
    await expect(
      page.getByText("Pour les collectionneurs Nintendo", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Les jeux Nintendo en boîte, version par version",
    );
    await expect(
      page.getByText(
        "Tous les jeux édités par Nintendo, avec leurs jaquettes, titres et dates au Japon, en Amérique du Nord et en Europe.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("bandeau toujours visible et bouton « Remonter en haut » au défilement (SPEC v1.34)", async ({
    page,
  }) => {
    const remonter = page.getByRole("button", {
      name: "Remonter en haut",
      exact: true,
    });
    await expect(remonter).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    // Le bandeau reste collé en haut de l'écran, avec ses icônes.
    const bandeau = page.getByRole("banner");
    await expect(bandeau).toBeInViewport();
    expect((await bandeau.boundingBox())?.y).toBeLessThanOrEqual(1);
    await expect(
      bandeau.getByRole("link", { name: "À propos", exact: true }),
    ).toBeInViewport();
    await expect(remonter).toBeVisible();
    await remonter.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(remonter).toBeHidden();
  });

  test("tient dans la largeur de l'iPhone (pas de défilement horizontal)", async ({
    page,
  }) => {
    const largeur = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(largeur).toBeLessThanOrEqual(375);
  });
});

test("l'icône de compte de l'en-tête mène à la connexion (US-09, SPEC v1.15)", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Se connecter", exact: true })
    .click();
  await expect(page).toHaveURL("/admin/connexion");
});

test.describe("thème sombre (US-08)", () => {
  test.use({ colorScheme: "dark" });

  test("suit le réglage de l'iPhone, et le bouton force le thème, retenu à la visite suivante", async ({
    page,
  }) => {
    const fond = () =>
      page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.goto("/");
    expect(await fond()).toBe("rgb(28, 31, 38)");

    // Automatique → clair : le choix l'emporte sur le réglage sombre de l'iPhone.
    await page.getByRole("button", { name: /Thème : automatique/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "clair");
    expect(await fond()).toBe("rgb(244, 245, 247)");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "clair");
    await expect(
      page.getByRole("button", { name: /Thème : clair/ }),
    ).toBeVisible();
  });
});

test("le logo cartouche et les icônes du site sont servis (US-15)", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator("header svg").first()).toBeVisible();
  for (const chemin of [
    "/icon.svg",
    "/apple-icon.png",
    "/manifest.webmanifest",
  ])
    expect((await request.get(chemin)).status(), chemin).toBe(200);
});
