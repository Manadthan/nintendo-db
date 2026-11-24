import { expect, test } from "@playwright/test";

// US-04 — Voir la fiche d'un jeu (docs/SPEC.md), sur les jeux de départ (migration 0004).

const KIRBY = "/jeux/wii-u/kirby-and-the-rainbow-paintbrush";

test("une vignette du catalogue ouvre la fiche, qui ramène au catalogue", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /Mario Kart 8/ })
    .first()
    .click();
  await expect(page).toHaveURL("/jeux/wii-u/mario-kart-8");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Mario Kart 8",
  );
  await page.getByRole("link", { name: /Retour au catalogue/ }).click();
  await expect(page).toHaveURL("/");
});

test("la fiche s'ouvre sur la version PAL et le sélecteur change de version", async ({
  page,
}) => {
  await page.goto(KIRBY);
  const titre = page.getByRole("heading", { level: 1 });
  await expect(titre).toHaveText("Kirby and the Rainbow Paintbrush");
  await expect(page.getByText("Sorti le 8 mai 2015 · Europe")).toBeVisible();

  await page.getByRole("button", { name: "Version Amérique du Nord" }).click();
  await expect(titre).toHaveText("Kirby and the Rainbow Curse");
  await expect(
    page.getByText("Sorti le 20 février 2015 · Amérique du Nord"),
  ).toBeVisible();

  // Version japonaise : titre japonais, forme romanisée dessous (SPEC décision 1).
  await page.getByRole("button", { name: "Version Japon" }).click();
  await expect(titre).toHaveText("タッチ! カービィ スーパーレインボー");
  await expect(page.getByText("Touch! Kirby Super Rainbow")).toBeVisible();
});

test("une région où le jeu n'est pas sorti est désactivée", async ({
  page,
}) => {
  await page.goto("/jeux/wii-u/wii-karaoke-u");
  await expect(
    page.getByRole("button", { name: "Amérique du Nord : non sorti" }),
  ).toBeDisabled();
});

test("le bloc Disponibilité liste les 3 régions, avec le titre quand il diffère", async ({
  page,
}) => {
  await page.goto(KIRBY);
  const dispo = page.getByRole("region", { name: "Disponibilité" });
  await expect(dispo.getByRole("listitem")).toHaveCount(3);
  await expect(dispo).toContainText("Japon · 22 janvier 2015");
  await expect(dispo).toContainText("Kirby and the Rainbow Curse");
});

test("une donnée inconnue s'affiche « — » et la source est citée", async ({
  page,
}) => {
  await page.goto("/jeux/wii-u/splatoon");
  await expect(page.getByText("Code produit").locator("..")).toContainText("—");
  await expect(page.getByRole("link", { name: "Wikipédia" })).toHaveAttribute(
    "href",
    /wikipedia\.org/,
  );
});

test("la fiche s'ouvre sur le marché choisi dans le catalogue", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("nintendo-db:marche", "US"));
  await page.goto(KIRBY);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Kirby and the Rainbow Curse",
  );
});

test("une adresse inconnue affiche une page introuvable en français", async ({
  page,
}) => {
  const reponse = await page.goto("/jeux/wii-u/jeu-qui-n-existe-pas");
  expect(reponse?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});

test("la fiche tient dans la largeur de l'iPhone", async ({ page }) => {
  await page.goto(KIRBY);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
});

test("la grande jaquette de la fiche prend presque toute la largeur de l'iPhone (#48)", async ({
  page,
}) => {
  await page.goto(KIRBY);
  const jaquette = page.getByRole("main").getByRole("img").first();
  const largeur = (await jaquette.boundingBox())!.width;
  // 375 px d'écran − 2 × 16 px de marge.
  expect(largeur).toBeGreaterThanOrEqual(340);
  expect(largeur).toBeLessThanOrEqual(345);
});

test("un visiteur ne voit aucune case de collection (US-16 : collection privée)", async ({
  page,
}) => {
  await page.goto("/jeux/wii-u/splatoon");
  await expect(page.getByRole("heading", { name: "Splatoon" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("« Précédent » depuis une fiche ramène le catalogue à la même hauteur, le lien Retour en haut", async ({
  page,
}) => {
  await page.goto("/");
  const jeux = page.locator('main a[href^="/jeux/"]');
  await expect(jeux).toHaveCount(4);
  // Le dernier jeu, en bas du catalogue : la page défile.
  await jeux.last().scrollIntoViewIfNeeded();
  const hauteur = await page.evaluate(() => window.scrollY);
  expect(hauteur).toBeGreaterThan(100);

  await jeux.last().click();
  await expect(page).toHaveURL(/\/jeux\/wii-u\//);
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)))
    .toBeGreaterThanOrEqual(hauteur - 2);

  // Revenir par le lien de la fiche n'est pas un retour arrière : le catalogue repart du haut.
  await jeux.last().click();
  await page.getByRole("link", { name: /Retour au catalogue/ }).click();
  await expect(page).toHaveURL("/");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("revenir d'une fiche garde les filtres et le tri, par « Précédent » comme par le lien (SPEC v1.45)", async ({
  page,
}) => {
  await page.goto("/");
  const tri = page.getByLabel("Tri", { exact: true });
  await tri.selectOption("az");
  await page.getByRole("button", { name: /^Filtres/ }).click();
  await page
    .getByRole("combobox", { name: "Disponibilité", exact: true })
    .selectOption({ label: "Sorti dans les 3 régions" });
  await expect(page).toHaveURL("/?tri=az&dispo=toutes");
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();

  const jeux = page.locator('main a[href^="/jeux/"]');
  await jeux.first().click();
  await expect(page).toHaveURL(/\/jeux\/wii-u\//);
  await page.goBack();
  await expect(page).toHaveURL("/?tri=az&dispo=toutes");
  await expect(tri).toHaveValue("az");
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();

  await jeux.first().click();
  await page.getByRole("link", { name: /Retour au catalogue/ }).click();
  await expect(page).toHaveURL("/?tri=az&dispo=toutes");
  await expect(tri).toHaveValue("az");
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();
});
