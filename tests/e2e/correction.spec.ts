import { expect, test, type Page } from "@playwright/test";
import {
  attendreHydratation,
  BASE_LOCALE_DISPONIBLE,
  seConnecter,
} from "./utilisateur";

// US-11 — Corriger une fiche (#44). Base Supabase locale (CI) : jeux de départ (migration 0004).
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

const enregistrer = (page: Page) =>
  page.getByRole("button", { name: "Enregistrer la fiche" });

test("le propriétaire corrige un code produit ; le champ est alors verrouillé contre l'import", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Jeux/ }).click();
  // Mario Kart 8 : les tests publics (parallèles, même base) ne lisent pas son code produit.
  await page.getByRole("link", { name: /Mario Kart 8/ }).click();
  await expect(
    page.getByRole("heading", { name: "Mario Kart 8" }),
  ).toBeVisible();

  await attendreHydratation(enregistrer(page));
  const code = page.locator('input[name="PAL.code_produit"]');
  await code.fill("WUP-P-AMKP-TEST");
  await enregistrer(page).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Fiche enregistrée" }),
  ).toBeVisible();

  await page.reload();
  await expect(code).toHaveValue("WUP-P-AMKP-TEST");
  await expect(
    page
      .locator("fieldset", { hasText: "Europe" })
      .getByTitle(/Corrigé à la main/),
  ).toBeVisible();
});

test("une version sortie sans titre est refusée", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/admin/jeux/wii-u/splatoon");
  await attendreHydratation(enregistrer(page));
  await page.locator('input[name="US.titre"]').fill("");
  await enregistrer(page).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "le titre est obligatoire" }),
  ).toBeVisible();
});

test("le propriétaire ajoute un jeu manquant, puis le supprime après confirmation", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/admin/jeux");
  await page.getByText("+ Ajouter un jeu").click();
  await attendreHydratation(
    page.getByRole("button", { name: "Ajouter le jeu" }),
  );
  await page.getByLabel("Titre").fill("Jeu de test e2e");
  await page.getByLabel("PAL").check();
  await page.getByRole("button", { name: "Ajouter le jeu" }).click();

  await expect(page).toHaveURL("/admin/jeux/wii-u/jeu-de-test-e2e?nouveau=1");
  await expect(
    page.getByRole("status").filter({ hasText: "Jeu ajouté" }),
  ).toBeVisible();
  await expect(page.locator('input[name="PAL.titre"]')).toHaveValue(
    "Jeu de test e2e",
  );

  await attendreHydratation(
    page.getByRole("button", { name: "Supprimer ce jeu" }),
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Supprimer ce jeu" }).click();
  await expect(page).toHaveURL(/\/admin\/jeux\?supprime=.*console=wii-u/);
  await expect(
    page.getByRole("status").filter({ hasText: "a été supprimé" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Jeu de test e2e/ })).toHaveCount(
    0,
  );
});

test("la liste des jeux se choisit par console (étape 8)", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/admin/jeux");
  const consoles = page.getByRole("navigation", { name: "Console" });
  await expect(
    consoles.getByRole("link", { name: "Wii U", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await consoles.getByRole("link", { name: "Wii", exact: true }).click();
  await expect(page).toHaveURL("/admin/jeux?console=wii");
  // Base de test : la Wii existe (migration 0007) mais n'a pas encore de jeux.
  await expect(page.getByText("0 jeux Wii.")).toBeVisible();
  await page.getByText("+ Ajouter un jeu").click();
  await expect(page.getByText("Console : Wii", { exact: true })).toBeVisible();
});

test("note Metacritic saisie à la main : sur la fiche (avec lien) et sur la jaquette dans le catalogue (US-17)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/admin/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await attendreHydratation(enregistrer(page));
  await page.locator('input[name="metacritic_note"]').fill("73");
  await page
    .locator('input[name="metacritic_url"]')
    .fill("https://www.metacritic.com/game/kirby-and-the-rainbow-curse/");
  await enregistrer(page).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Fiche enregistrée" }),
  ).toBeVisible();

  await page.goto("/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await expect(
    page.getByRole("link", {
      name: "Metacritic : 73 sur 100 (page Metacritic)",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    "https://www.metacritic.com/game/kirby-and-the-rainbow-curse/",
  );
  await page.goto("/");
  const note = page.getByRole("img", {
    name: "Metacritic : 73 sur 100",
    exact: true,
  });
  await expect(note).toBeVisible();
  // En surimpression, dans le coin en haut à gauche de la jaquette (l'angle haut droit porte le fanion « possédé »).
  const jaquette = page
    .getByRole("link")
    .filter({ has: note })
    .getByRole("img", { name: /^Jaquette de |jaquette à venir$/ });
  const [boiteNote, boiteJaquette] = await Promise.all([
    note.boundingBox(),
    jaquette.boundingBox(),
  ]);
  expect(boiteNote && boiteJaquette).toBeTruthy();
  const n = boiteNote!;
  const j = boiteJaquette!;
  expect(n.y).toBeGreaterThanOrEqual(j.y);
  expect(n.y + n.height).toBeLessThanOrEqual(j.y + j.height / 2);
  expect(n.x).toBeGreaterThanOrEqual(j.x - 0.5);
  expect(n.x + n.width).toBeLessThanOrEqual(j.x + j.width / 2);

  // Nettoyage : note effacée (le champ reste verrouillé, sans effet sur les autres tests).
  await page.goto("/admin/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await attendreHydratation(enregistrer(page));
  await page.locator('input[name="metacritic_note"]').fill("");
  await page.locator('input[name="metacritic_url"]').fill("");
  await enregistrer(page).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Fiche enregistrée" }),
  ).toBeVisible();
});
