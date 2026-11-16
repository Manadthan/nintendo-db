import { expect, test } from "@playwright/test";

test.describe("accueil", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("s'affiche en français avec le nom du site", async ({ page }) => {
    await expect(page).toHaveTitle("Nintendo DB");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("banner")).toContainText("Nintendo DB");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Les jeux Nintendo en boîte, version par version",
    );
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
