import { expect, test } from "@playwright/test";

// US-07 — Mentions et sources (docs/SPEC.md).

const navigation = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Navigation principale" });

test("le lien « À propos » de l'en-tête ouvre la page, marquée page courante", async ({
  page,
}) => {
  await page.goto("/");
  await navigation(page)
    .getByRole("link", { name: "À propos", exact: true })
    .click();
  await expect(page).toHaveURL("/a-propos");
  await expect(
    navigation(page).getByRole("link", { name: "À propos", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page).toHaveTitle("À propos · Nintendo DB");
});

test("la page dit que le site n'est pas affilié à Nintendo et que les visuels appartiennent à leurs éditeurs", async ({
  page,
}) => {
  await page.goto("/a-propos");
  await expect(
    page.getByRole("heading", {
      name: "Site de fan, non affilié à Nintendo",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("ni approuvé ou soutenu par Nintendo", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("appartiennent à leurs éditeurs", { exact: false }),
  ).toBeVisible();
});

test("les sources sont listées avec leur licence", async ({ page }) => {
  await page.goto("/a-propos");
  const sources = page.getByRole("list").filter({ hasText: "Wikipédia" });
  await expect(sources.getByRole("heading", { level: 3 })).toHaveText([
    "Wikipédia",
    "libretro-thumbnails",
    "gamecartdb",
    "Nintendo",
    "ScreenScraper",
    "RAWG",
    "GameTDB",
  ]);
  await expect(sources).toContainText("CC BY-SA 4.0");
  await expect(sources).toContainText("FAQ de GameTDB");
});
