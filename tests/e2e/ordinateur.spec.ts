import { expect, test, type Page } from "@playwright/test";

// SPEC v1.36 — Ordinateur : les pages publiques sur un écran de bureau (1440 × 900), jeux de départ (migration 0004).
test.use({
  viewport: { width: 1440, height: 900 },
  isMobile: false,
  hasTouch: false,
});

/** Aucun défilement horizontal : la page tient dans la largeur de la fenêtre. */
async function sansDefilementHorizontal(page: Page) {
  const largeurs = await page.evaluate(() => ({
    contenu: document.documentElement.scrollWidth,
    fenetre: window.innerWidth,
  }));
  expect(largeurs.contenu).toBeLessThanOrEqual(largeurs.fenetre);
}

test("le catalogue est centré, limité à 1280 px, en 6 colonnes", async ({
  page,
}) => {
  await page.goto("/");
  const catalogue = page.getByRole("region", { name: "Tous les jeux" });
  const boite = (await catalogue.boundingBox())!;
  expect(boite.width).toBeLessThanOrEqual(1280);
  // Centré : autant de marge à gauche qu'à droite (à 1 px près).
  expect(
    Math.abs(boite.x - (1440 - boite.x - boite.width)),
  ).toBeLessThanOrEqual(1);

  const colonnes = () =>
    catalogue
      .locator("ul[data-zoom]")
      .first()
      .evaluate(
        (ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length,
      );
  expect(await colonnes()).toBe(6);
  await sansDefilementHorizontal(page);

  await page
    .getByRole("button", { name: "Dézoomer la grille", exact: true })
    .click();
  expect(await colonnes()).toBe(8);
  await sansDefilementHorizontal(page);

  await page
    .getByRole("button", { name: "Zoomer la grille", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zoomer la grille", exact: true })
    .click();
  expect(await colonnes()).toBe(4);
  await sansDefilementHorizontal(page);
});

test("la fiche place la jaquette à gauche et les informations à droite", async ({
  page,
}) => {
  await page.goto("/jeux/wii-u/mario-kart-8");
  const jaquette = (await page
    .getByRole("img", { name: /Mario Kart 8/ })
    .first()
    .boundingBox())!;
  const titre = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
  expect(titre.x).toBeGreaterThan(jaquette.x + jaquette.width);
  // Titre en haut de la colonne de droite, à hauteur de la jaquette (pas dessous).
  expect(titre.y).toBeLessThan(jaquette.y + jaquette.height);
  await sansDefilementHorizontal(page);
});

test("la page À propos reste une colonne de lecture centrée", async ({
  page,
}) => {
  await page.goto("/a-propos");
  const contenu = (await page.getByRole("main").boundingBox())!;
  expect(contenu.width).toBeLessThanOrEqual(768);
  await sansDefilementHorizontal(page);
});
