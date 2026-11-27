import { expect, test } from "@playwright/test";

// US-29 — Voir les amiibo (docs/SPEC.md) : fiche de l'amiibo et bloc « Amiibo » de la fiche du jeu. Amiibo de test
// chargé en CI (tests/e2e/amiibo.sql), relié à Splatoon ; jamais AmiiboAPI ni Nintendo en direct.

const AMIIBO = "/amiibo/inkling-e2e";

test("la fiche de l'amiibo montre ses informations, ses jeux et sa disponibilité", async ({
  page,
}) => {
  await page.goto(AMIIBO);
  await expect(page).toHaveTitle("Inkling e2e · Amiibo · Nintendo DB");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Inkling e2e",
  );
  await expect(
    page.getByText("Figurine", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("08000000 03380002")).toBeVisible();

  const dispo = page.getByRole("region", { name: "Disponibilité" });
  await expect(dispo.getByRole("listitem")).toHaveCount(3);
  await expect(dispo).toContainText("Japon · 28 mai 2015");
  await expect(dispo).toContainText("Amérique du Nord · non sorti");

  // Visiteur : pas de case « Je l'ai » (US-30, collection privée).
  await expect(page.getByRole("checkbox", { name: "Je l'ai" })).toHaveCount(0);

  const jeux = page.getByRole("region", { name: "Jeux compatibles (2)" });
  await expect(jeux).toContainText("Jeu hors catalogue e2e");
  await expect(jeux).toContainText("hors catalogue");
  await expect(
    jeux.getByRole("link", { name: "Jeu hors catalogue e2e" }),
  ).toHaveCount(0);
  await jeux.getByRole("link", { name: /Splatoon/ }).click();
  await expect(page).toHaveURL("/jeux/wii-u/splatoon");
});

test("la bascule change la date de sortie, ou dit que l'amiibo n'est pas sorti", async ({
  page,
}) => {
  await page.goto(AMIIBO);
  const bascule = page.getByRole("group", { name: "Version" });
  await bascule.getByRole("button", { name: "Version Japon" }).click();
  await expect(page.getByText("Sorti le 28 mai 2015 · Japon")).toBeVisible();
  // Nom japonais sous le nom, version japonaise seulement.
  await expect(page.locator("main p[lang=ja]")).toHaveText("ガール e2e");

  await bascule
    .getByRole("button", { name: "Amérique du Nord : non sorti" })
    .click();
  await expect(
    page.getByText("Non sorti dans cette région · Amérique du Nord"),
  ).toBeVisible();
});

test("la fiche du jeu liste ses amiibo, chacun menant à sa fiche", async ({
  page,
}) => {
  await page.goto("/jeux/wii-u/splatoon");
  const bloc = page.getByRole("region", { name: "Amiibo (1)" });
  await bloc.getByRole("link", { name: /Inkling e2e/ }).click();
  await expect(page).toHaveURL(AMIIBO);
});

test("un jeu sans amiibo n'a pas de bloc Amiibo", async ({ page }) => {
  await page.goto("/jeux/wii-u/mario-kart-8");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Amiibo/ })).toHaveCount(0);
});

test("un amiibo inconnu ou une adresse mal formée mène à la page introuvable", async ({
  page,
}) => {
  for (const adresse of ["/amiibo/inconnu-e2e", "/amiibo/Pas_Un_Slug"]) {
    const reponse = await page.goto(adresse);
    expect(reponse?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page introuvable" }),
    ).toBeVisible();
  }
});

// Catalogue (US-29, ADR-21 point 5) : coche « Amiibo », cartes mêlées aux jeux, marché, recherche, filtres.

test("cocher « Amiibo » mêle les amiibo aux jeux ; la carte mène à la fiche", async ({
  page,
}) => {
  await page.goto("/");
  const coche = page.getByRole("checkbox", { name: "Amiibo" });
  await expect(coche).not.toBeChecked();
  await coche.check();
  await expect(page).toHaveURL(/voir=jeux%2Camiibo/);
  await expect(page.getByText(/jeux? et 1 amiibo affichés?/)).toBeVisible();

  // « Jeux » décochée : l'amiibo seul.
  await page.getByRole("checkbox", { name: "Jeux" }).uncheck();
  await expect(
    page.getByText("1 amiibo affiché", { exact: true }),
  ).toBeVisible();
  const carte = page.getByRole("link", { name: /Inkling e2e/ });
  await expect(carte).toContainText("Figurine");
  await carte.click();
  await expect(page).toHaveURL(AMIIBO);
});

test("un amiibo non sorti sur le marché choisi est caché", async ({ page }) => {
  await page.goto("/?voir=amiibo");
  await expect(
    page.getByText("1 amiibo affiché", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Amérique du Nord", exact: true })
    .click();
  await expect(
    page.getByText("0 amiibo affiché", { exact: true }),
  ).toBeVisible();
});

test("la recherche trouve un amiibo par sa série ; les filtres s'appliquent", async ({
  page,
}) => {
  await page.goto("/?voir=amiibo&q=splatoon");
  await expect(page.getByRole("link", { name: /Inkling e2e/ })).toBeVisible();

  // Console : amiibo lu par un jeu Wii U (Splatoon) ; Genre : les amiibo n'en ont pas.
  await page.goto("/?voir=amiibo&console=wii-u");
  await expect(
    page.getByText("1 amiibo affiché", { exact: true }),
  ).toBeVisible();
  await page.goto("/?voir=jeux,amiibo&genre=Action");
  await expect(page.getByText(/et 0 amiibo affichés?/)).toBeVisible();
});

test("filtre Type d'amiibo : visible seulement avec Amiibo coché, cache les jeux et s'efface au décochage (SPEC v1.54)", async ({
  page,
}) => {
  // Sans « Amiibo » coché : pas de liste « Type d'amiibo », et ?type= dans l'adresse est ignoré.
  await page.goto("/?type=figurine");
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
  await page.getByRole("button", { name: /^Filtres/ }).click();
  await expect(
    page.getByRole("combobox", { name: "Type d'amiibo", exact: true }),
  ).toHaveCount(0);

  // Avec « Jeux » et « Amiibo » cochés : la liste apparaît avec le nombre par type ; choisir Figurine cache les jeux.
  await page.goto("/?voir=jeux,amiibo");
  await expect(page.getByText("4 jeux et 1 amiibo affichés")).toBeVisible();
  await page.getByRole("button", { name: /^Filtres/ }).click();
  const types = page.getByRole("combobox", {
    name: "Type d'amiibo",
    exact: true,
  });
  await expect(types.getByRole("option")).toHaveText(["Tous", "Figurine (1)"]);
  await types.selectOption("figurine");
  await expect(page).toHaveURL(/type=figurine/);
  await expect(
    page.getByText("0 jeu et 1 amiibo affiché", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("list", { name: "Filtres actifs" })
      .getByRole("button", { name: "Retirer le filtre Figurine", exact: true }),
  ).toBeVisible();

  // Décocher « Amiibo » retire le filtre ?type= et réaffiche les jeux.
  await page.getByRole("checkbox", { name: "Amiibo" }).uncheck();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();

  // Lien partagé sur un type sans amiibo dans les données : 0 résultat et pastille effaçable.
  await page.goto("/?voir=amiibo&type=carte");
  await expect(
    page.getByText("0 amiibo affiché", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("list", { name: "Filtres actifs" })
    .getByRole("button", { name: "Retirer le filtre Carte", exact: true })
    .click();
  await expect(
    page.getByText("1 amiibo affiché", { exact: true }),
  ).toBeVisible();
});
