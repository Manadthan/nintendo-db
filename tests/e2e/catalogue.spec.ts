import { expect, test } from "@playwright/test";

// US-02 — Parcourir le catalogue (docs/SPEC.md), sur les 4 jeux de départ (migration 0004).

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("l'accueil présente le site puis « Tous les jeux » avec le nombre total", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Navigation principale",
  });
  // Icônes nommées (SPEC v1.15) : Catalogue (page courante), À propos, compte.
  await expect(
    navigation.getByRole("link", { name: "Catalogue", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    navigation.getByRole("link", { name: "À propos", exact: true }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Se connecter", exact: true }),
  ).toHaveAttribute("href", "/admin/connexion");
  await expect(
    page.getByRole("heading", { name: "Tous les jeux" }),
  ).toBeVisible();
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
});

test("les jeux sont groupés par année, du plus ancien au plus récent", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { level: 3 })).toHaveText([
    "2013",
    "2014",
    "2015",
  ]);
});

test("chaque jeu montre son titre, sa date et sa disponibilité par région", async ({
  page,
}) => {
  const karaoke = page.getByRole("link", { name: /Wii Karaoke U/ }).first();
  await expect(karaoke).toContainText("4 octobre 2013");
  await expect(karaoke.getByLabel("Japon : sorti")).toBeVisible();
  await expect(
    karaoke.getByLabel("Amérique du Nord : non sorti"),
  ).toBeVisible();
  await expect(karaoke.getByLabel("Europe : sorti")).toBeVisible();
  // Avant l'import, vignette neutre (US-12).
  await expect(
    karaoke.getByRole("img", { name: "Wii Karaoke U — jaquette à venir" }),
  ).toBeVisible();
});

test("avec « Tous », le titre affiché est celui de la version PAL", async ({
  page,
}) => {
  await expect(
    page.getByText("Kirby and the Rainbow Paintbrush", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Kirby and the Rainbow Curse")).toHaveCount(0);
});

test("le tri A → Z range les titres par ordre alphabétique, sans groupes", async ({
  page,
}) => {
  await page.getByLabel("Tri").selectOption("az");
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
  const titres = page.locator('a[href^="/jeux/wii-u/"] .font-semibold');
  await expect(titres).toHaveText([
    "Kirby and the Rainbow Paintbrush",
    "Mario Kart 8",
    "Splatoon",
    "Wii Karaoke U",
  ]);
});

test("le choix grille / liste est retenu à la visite suivante", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Liste" }).click();
  await expect(page.getByRole("button", { name: "Liste" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("button", { name: "Liste" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("chaque jeu mène à sa fiche, à une adresse stable", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: /Mario Kart 8/ }).first(),
  ).toHaveAttribute("href", "/jeux/wii-u/mario-kart-8");
});

test("le catalogue tient dans la largeur de l'iPhone", async ({ page }) => {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
});
