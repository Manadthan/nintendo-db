import { expect, test, type Page } from "@playwright/test";

// US-06 — Filtrer le catalogue (docs/SPEC.md), sur les jeux de départ (migration 0004) : Mario Kart 8, Splatoon et
// Kirby sortis dans les 3 régions, Wii Karaoke U au Japon et en Europe. Le genre, vide dans ces données, est
// couvert par les tests unitaires (filtres.test.ts).

const boutonFiltres = (page: Page) =>
  page.getByRole("button", { name: /^Filtres/ });
const liste = (page: Page, nom: string) =>
  page.getByRole("combobox", { name: nom, exact: true });
const actifs = (page: Page) =>
  page.getByRole("list", { name: "Filtres actifs" });

test("le panneau s'ouvre depuis le bouton « Filtres »", async ({ page }) => {
  await page.goto("/");
  await expect(boutonFiltres(page)).toHaveAttribute("aria-expanded", "false");
  await boutonFiltres(page).click();
  await expect(boutonFiltres(page)).toHaveAttribute("aria-expanded", "true");
  await expect(liste(page, "Console")).toBeVisible();
  await expect(liste(page, "Disponibilité")).toBeVisible();
  await expect(liste(page, "Année")).toBeVisible();
  await expect(liste(page, "Genre")).toBeVisible();
  await expect(liste(page, "Développeur")).toBeVisible();
  await expect(liste(page, "Série")).toBeVisible();
});

test("les filtres se combinent, se voient en pastilles et restent dans l'adresse", async ({
  page,
}) => {
  await page.goto("/");
  await boutonFiltres(page).click();

  await liste(page, "Disponibilité").selectOption({
    label: "Sorti dans les 3 régions",
  });
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();
  await expect(page.getByText("Wii Karaoke U")).toHaveCount(0);

  await liste(page, "Année").selectOption("2015");
  await expect(page.getByText("2 jeux affichés sur 4")).toBeVisible();
  await expect(page).toHaveURL("/?dispo=toutes&annee=2015");
  await expect(boutonFiltres(page)).toHaveText("Filtres · 2");
  await expect(actifs(page).getByRole("button")).toHaveText([
    "Sorti dans les 3 régions",
    "2015",
    "Tout effacer",
  ]);

  // Lien partagé : la vue filtrée s'ouvre telle quelle.
  await page.goto("/?dispo=toutes&annee=2015");
  await expect(page.getByText("2 jeux affichés sur 4")).toBeVisible();
});

test("un filtre s'efface en un tap, tous d'un coup avec « Tout effacer »", async ({
  page,
}) => {
  await page.goto("/?dispo=toutes&annee=2015");
  await actifs(page)
    .getByRole("button", { name: "Retirer le filtre 2015", exact: true })
    .click();
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();
  await expect(page).toHaveURL("/?dispo=toutes");

  await page.goto("/?dispo=toutes&annee=2015");
  await actifs(page)
    .getByRole("button", { name: "Tout effacer", exact: true })
    .click();
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
  await expect(actifs(page)).toHaveCount(0);
  await expect(page).toHaveURL("/");
});

test("aucun résultat : message et bouton pour effacer les filtres", async ({
  page,
}) => {
  await page.goto("/?dispo=jap");
  await expect(page.getByText("Aucun jeu ne correspond")).toBeVisible();
  await page
    .getByRole("button", { name: "Effacer les filtres", exact: true })
    .click();
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
});

test("filtre Console : consoles qui ont des jeux, avec leur nombre ; console sur chaque vignette (étape 8)", async ({
  page,
}) => {
  await page.goto("/");
  // Données de départ : 4 jeux Wii U ; la Wii n'a pas encore de jeux, elle n'est pas proposée.
  await expect(
    page.getByRole("link", { name: /Mario Kart 8/ }).first(),
  ).toContainText("Wii U");
  await boutonFiltres(page).click();
  const consoles = liste(page, "Console");
  await expect(consoles.getByRole("option")).toHaveText([
    "Toutes",
    "Wii U (4)",
  ]);
  await consoles.selectOption({ label: "Wii U (4)" });
  await expect(page).toHaveURL("/?console=wii-u");
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
  await expect(
    actifs(page).getByRole("button", {
      name: "Retirer le filtre Wii U",
      exact: true,
    }),
  ).toBeVisible();
});

test("filtre Développeur : studios avec leur nombre de jeux, et Nintendo first party (#89)", async ({
  page,
}) => {
  await page.goto("/");
  await boutonFiltres(page).click();
  const developpeurs = liste(page, "Développeur");
  // Données de départ : Nintendo EAD (Mario Kart 8, Splatoon), Nintendo SPD (Kirby), HAL, Bandai Namco, Xing.
  await expect(developpeurs.getByRole("option").nth(1)).toHaveText(
    "Nintendo (first party) (3)",
  );
  await expect(
    developpeurs.getByRole("option", { name: "Nintendo EAD (2)", exact: true }),
  ).toBeAttached();
  await developpeurs.selectOption({ label: "HAL Laboratory (1)" });
  await expect(page).toHaveURL("/?dev=HAL+Laboratory");
  await expect(page.getByText("1 jeu affiché sur 4")).toBeVisible();
  await developpeurs.selectOption({ label: "Nintendo (first party) (3)" });
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();
  await actifs(page)
    .getByRole("button", {
      name: "Retirer le filtre Nintendo (first party)",
      exact: true,
    })
    .click();
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
});

test("un visiteur n'a ni filtre Collection ni coche ; un lien ?collection= est ignoré (US-16)", async ({
  page,
}) => {
  await page.goto("/?collection=possedes");
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
  await boutonFiltres(page).click();
  await expect(liste(page, "Console")).toBeVisible();
  await expect(liste(page, "Collection")).toHaveCount(0);
  await expect(page.getByRole("listitem", { name: /possédé/ })).toHaveCount(0);
});

test("filtre Série : séries par ordre alphabétique, puis « Sans série » (SPEC v1.37)", async ({
  page,
}) => {
  await page.goto("/");
  await boutonFiltres(page).click();
  const series = liste(page, "Série");
  // Données de départ (migration 0023 : franchise reprise) : Kirby, Mario Kart, Splatoon ; Wii Karaoke U sans série.
  await expect(series.getByRole("option")).toHaveText([
    "Toutes",
    "Kirby (1)",
    "Mario Kart (1)",
    "Splatoon (1)",
    "Sans série (1)",
  ]);
  await series.selectOption({ label: "Splatoon (1)" });
  await expect(page).toHaveURL("/?serie=Splatoon");
  await expect(page.getByText("1 jeu affiché sur 4")).toBeVisible();
  await actifs(page)
    .getByRole("button", { name: "Retirer le filtre Splatoon", exact: true })
    .click();
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
});

