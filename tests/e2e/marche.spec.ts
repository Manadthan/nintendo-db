import { expect, test } from "@playwright/test";

// US-03 — Filtrer le catalogue par marché (docs/SPEC.md), sur les jeux de départ (migration 0004).

const marche = (page: import("@playwright/test").Page) =>
  page.getByRole("group", { name: "Marché" });

test("« Tous » est choisi par défaut, parmi Tous, Europe, Amérique du Nord, Japon", async ({
  page,
}) => {
  await page.goto("/");
  await expect(marche(page).getByRole("button")).toHaveText([
    "Tous",
    "Europe",
    "Amérique du Nord",
    "Japon",
  ]);
  await expect(
    marche(page).getByRole("button", { name: "Tous" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("un marché ne garde que ses jeux, dans sa version, sans recharger la page", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    () => ((window as unknown as { pasRecharge: boolean }).pasRecharge = true),
  );

  await marche(page).getByRole("button", { name: "Amérique du Nord" }).click();
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();
  await expect(
    page.getByText("Kirby and the Rainbow Curse").first(),
  ).toBeVisible();
  await expect(page.getByText("Wii Karaoke U")).toHaveCount(0); // jamais sorti en Amérique du Nord
  await expect(page).toHaveURL("/?marche=us");

  await marche(page).getByRole("button", { name: "Japon" }).click();
  // SPEC v1.56 : le catalogue affiche le titre romanisé à la place du japonais (le japonais reste sur la fiche).
  await expect(
    page.getByText("Touch! Kirby Super Rainbow", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("マリオカート8")).toHaveCount(0);
  await expect(page.getByText("29 mai 2014")).toBeVisible(); // date japonaise de Mario Kart 8

  // Toujours la même page : rien n'a été rechargé.
  expect(
    await page.evaluate(
      () => (window as unknown as { pasRecharge?: boolean }).pasRecharge,
    ),
  ).toBe(true);
});

test("le marché choisi est conservé à la visite suivante, et la fiche s'ouvre dessus", async ({
  page,
}) => {
  await page.goto("/");
  await marche(page).getByRole("button", { name: "Amérique du Nord" }).click();

  await page.goto("/");
  await expect(
    marche(page).getByRole("button", { name: "Amérique du Nord" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: /Kirby and the Rainbow Curse/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Kirby and the Rainbow Curse",
  );
});

test("un lien partagé avec ?marche=jap ouvre le catalogue sur le Japon avec les titres romanisés", async ({
  page,
}) => {
  await page.goto("/?marche=jap");
  await expect(
    marche(page).getByRole("button", { name: "Japon" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("Touch! Kirby Super Rainbow", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("スプラトゥーン")).toHaveCount(0);

  // Tri A → Z sur le titre romanisé (SPEC v1.56).
  await page.getByLabel("Tri", { exact: true }).selectOption("az");
  const titres = page.locator('a[href^="/jeux/wii-u/"] .font-semibold');
  await expect(titres).toHaveText([
    "Mario Kart 8",
    "Splatoon",
    "Touch! Kirby Super Rainbow",
    "Wii Karaoke U",
  ]);

  // Liste et Frise affichent aussi le titre romanisé.
  await page.getByRole("button", { name: "Liste", exact: true }).click();
  await expect(
    page.getByText("Touch! Kirby Super Rainbow", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  await expect(
    page.getByText("Touch! Kirby Super Rainbow", { exact: true }).first(),
  ).toBeVisible();
});

test("revenir à « Tous » réaffiche les versions PAL et retire le marché de l'adresse", async ({
  page,
}) => {
  await page.goto("/?marche=us");
  await marche(page).getByRole("button", { name: "Tous" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("4 jeux affichés sur 4")).toBeVisible();
  await expect(
    page.getByText("Kirby and the Rainbow Paintbrush").first(),
  ).toBeVisible();
});
