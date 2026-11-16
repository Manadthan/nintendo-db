import { expect, test } from "@playwright/test";

// US-05 — Rechercher un jeu dans le catalogue (docs/SPEC.md), sur les jeux de départ (migration 0004).

const champ = (page: import("@playwright/test").Page) =>
  page.getByRole("searchbox", { name: "Rechercher un jeu" });

test("la liste se filtre au fil de la frappe, sans recharger la page", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    () => ((window as unknown as { pasRecharge: boolean }).pasRecharge = true),
  );

  await champ(page).pressSequentially("spla");
  await expect(page.getByText("1 jeu affiché sur 4")).toBeVisible();
  await expect(page.getByRole("link", { name: /Splatoon/ })).toBeVisible();
  await expect(page).toHaveURL("/?q=spla");

  expect(
    await page.evaluate(
      () => (window as unknown as { pasRecharge?: boolean }).pasRecharge,
    ),
  ).toBe(true);
});

test("la recherche porte sur les titres des 3 régions et sur le développeur", async ({
  page,
}) => {
  await page.goto("/");
  await champ(page).fill("curse"); // titre US de Kirby, alors que le catalogue affiche le titre PAL
  await expect(
    page.getByRole("link", { name: /Kirby and the Rainbow Paintbrush/ }),
  ).toBeVisible();

  await champ(page).fill("スプラトゥーン"); // titre japonais
  await expect(page.getByRole("link", { name: /Splatoon/ })).toBeVisible();

  await champ(page).fill("xing"); // développeur de Wii Karaoke U
  await expect(page.getByText("1 jeu affiché sur 4")).toBeVisible();
});

test("la recherche ignore majuscules, accents et ponctuation", async ({
  page,
}) => {
  await page.goto("/");
  await champ(page).fill("MÂRIO-kart");
  await expect(page.getByRole("link", { name: /Mario Kart 8/ })).toBeVisible();
  await expect(page.getByText("1 jeu affiché sur 4")).toBeVisible();
});

test("aucun résultat : message clair et bouton pour effacer la recherche", async ({
  page,
}) => {
  await page.goto("/");
  await champ(page).fill("zelda");
  await expect(page.getByText("Aucun jeu ne correspond")).toBeVisible();
  await page.getByRole("button", { name: "Effacer la recherche" }).click();
  await expect(champ(page)).toHaveValue("");
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("la recherche se combine au marché et se partage par l'adresse", async ({
  page,
}) => {
  await page.goto("/?marche=us&q=wii");
  await expect(champ(page)).toHaveValue("wii");
  // Wii Karaoke U n'est jamais sorti en Amérique du Nord.
  await expect(page.getByText("Aucun jeu ne correspond")).toBeVisible();
});

test("le champ de recherche est en 16 px (pas de zoom automatique de Safari iOS)", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    await champ(page).evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("16px");
});
