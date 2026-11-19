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

test("connecté, le catalogue montre la coche et le filtre Collection ; le compteur est dans Statistiques (US-18)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope(page).check();

  await page.goto("/");
  const splatoon = page.getByRole("link", { name: /Splatoon/ }).first();
  // Étiquette PAL en vert (SPEC v1.16) ; JAP et US restent bleues.
  await expect(
    splatoon.getByRole("listitem", {
      name: "Europe : sorti, possédé",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    splatoon.getByRole("listitem", { name: "Japon : sorti", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("listitem", { name: /possédé/ })).toHaveCount(1);

  await page.getByRole("button", { name: /^Filtres/ }).click();
  // Plus de compteur dans le panneau Filtres (SPEC v1.20) : il est dans la page Statistiques.
  await expect(page.getByRole("list", { name: "Par console" })).toHaveCount(0);
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

test("Statistiques : ma collection par console, par région et notes (US-18)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope(page).check();

  await page.goto("/admin");
  await page.getByRole("link", { name: "Statistiques", exact: true }).click();
  await expect(page).toHaveURL("/admin/statistiques");
  const collection = page.getByRole("region", { name: "Ma collection" });
  await expect(
    collection.getByRole("listitem", { name: "Wii U : 1 / 4", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Par région" })
      .getByRole("listitem", { name: "PAL : 1 version", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Notes Metacritic" }),
  ).toBeVisible();

  // Remise en état : Splatoon décoché.
  await page.goto("/jeux/wii-u/splatoon");
  await caseEurope(page).uncheck();
});

test("Statistiques : réservée au propriétaire (US-18)", async ({ page }) => {
  await page.goto("/admin/statistiques");
  await expect(page).toHaveURL(/\/admin\/connexion/);
});

test("Statistiques : état du catalogue et filtre « sans code produit » de la liste Jeux (US-18)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/admin/statistiques");
  const etat = page.getByRole("region", { name: "État du catalogue" });
  await expect(etat.getByText("Jeux", { exact: true })).toBeVisible();
  await expect(
    etat.getByRole("list", { name: "À compléter" }).getByRole("listitem"),
  ).toHaveCount(3);

  await page.goto("/admin/jeux?console=wii-u&filtre=sans-code");
  await expect(
    page
      .getByRole("navigation", { name: "Filtre" })
      .getByRole("link", { name: "Sans code produit", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/jeux Wii U sans code produit/)).toBeVisible();
});
