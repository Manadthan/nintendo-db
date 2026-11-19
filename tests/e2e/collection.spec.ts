import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-16 — Ma collection (étape 12). Base Supabase locale (CI) : jeux de départ (migration 0004). Ces tests écrivent
// dans la base : ils tournent dans les projets `*-admin` (playwright.config.ts) et décochent ce qu'ils ont coché.
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

const caseEurope = (page: import("@playwright/test").Page) =>
  page.getByRole("checkbox", { name: "Je l'ai : version Europe", exact: true });

test("connecté, je coche une version sur la fiche ; elle reste cochée après rechargement", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/splatoon");
  await expect(caseEurope(page)).not.toBeChecked();
  await caseEurope(page).check();
  await page.reload();
  await expect(caseEurope(page)).toBeChecked();

  // Nettoyage : décocher, et vérifier que c'est aussi enregistré.
  await caseEurope(page).uncheck();
  await page.reload();
  await expect(caseEurope(page)).not.toBeChecked();
});

test("une région non sortie n'a pas de case (Wii Karaoke U : pas sorti aux États-Unis)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/wii-karaoke-u");
  await expect(
    page.getByRole("checkbox", {
      name: "Je l'ai : version Japon",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", {
      name: "Je l'ai : version Amérique du Nord",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("connecté, le catalogue montre la coche, le filtre Collection et le compteur par console", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope(page).check();

  await page.goto("/");
  const splatoon = page.getByRole("link", { name: /Splatoon/ }).first();
  await expect(splatoon.getByRole("img", { name: "Possédé" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Possédé" })).toHaveCount(1);

  await page.getByRole("button", { name: /^Filtres/ }).click();
  await expect(
    page.getByRole("list", { name: "Ma collection par console" }),
  ).toContainText("Wii U : 1 / 4");
  const filtre = page.getByRole("combobox", {
    name: "Collection",
    exact: true,
  });
  await filtre.selectOption({ label: "Possédés" });
  await expect(page).toHaveURL("/?collection=possedes");
  await expect(page.getByText("1 jeu affiché sur 4")).toBeVisible();
  await filtre.selectOption({ label: "Manquants" });
  await expect(page.getByText("3 jeux affichés sur 4")).toBeVisible();

  // Nettoyage.
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope(page).uncheck();
  await page.reload();
  await expect(caseEurope(page)).not.toBeChecked();
});
