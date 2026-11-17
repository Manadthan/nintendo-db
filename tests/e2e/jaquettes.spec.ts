import { expect, test } from "@playwright/test";
import { BASE_LOCALE_DISPONIBLE, seConnecter } from "./utilisateur";

// US-12 — Page « Jaquettes » et remplacement par adresse (#42). Base Supabase locale (CI) : jeux de départ (0004).
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

test("la page « Jaquettes » est réservée au propriétaire", async ({ page }) => {
  await page.goto("/admin/jaquettes");
  await expect(page).toHaveURL("/admin/connexion");
});

test("le propriétaire repère les jaquettes à remplacer, et une adresse interne est refusée", async ({
  page,
}) => {
  await seConnecter(page);
  await page.getByRole("link", { name: /Jaquettes/ }).click();
  await expect(page).toHaveURL(/\/admin\/jaquettes/);
  await expect(page.getByRole("heading", { name: "Jaquettes" })).toBeVisible();

  // Les jeux de départ n'ont pas de jaquette : toutes sont « à remplacer ».
  const remplacer = page.getByRole("link", { name: "Remplacer", exact: true });
  await expect(remplacer.first()).toBeVisible();
  await remplacer.first().click();
  await expect(page).toHaveURL(/\/admin\/jaquettes\/[a-z0-9-]+\/(jap|us|pal)$/);

  // Protection SSRF : le serveur ne va jamais chercher une image sur le réseau interne.
  await page
    .getByLabel("Adresse de l'image")
    .fill("http://127.0.0.1/jaquette.jpg");
  await page.getByRole("button", { name: "Remplacer la jaquette" }).click();
  // Filtre sur le texte : Next.js a aussi un annonceur de navigation de rôle « alert ».
  await expect(
    page.getByRole("alert").filter({ hasText: "réseau interne" }),
  ).toBeVisible();
});

test("le propriétaire remplace une jaquette par une photo (US-12)", async ({
  page,
}) => {
  await seConnecter(page);
  // Une sortie que les tests publics ne lisent pas (ils tournent en parallèle sur la même base).
  await page.goto("/admin/jaquettes/wii-u/mario-kart-8/jap");

  // Une « photo » de 600 × 800 fabriquée pour le test.
  const sharp = (await import("sharp")).default;
  const photo = await sharp({
    create: { width: 600, height: 800, channels: 3, background: "#2541b2" },
  })
    .jpeg()
    .toBuffer();
  await page.getByLabel("Photo de la boîte").setInputFiles({
    name: "boite.jpg",
    mimeType: "image/jpeg",
    buffer: photo,
  });
  await page.getByRole("button", { name: "Utiliser cette photo" }).click();

  await expect(page).toHaveURL(/\/admin\/jaquettes\?remplacee=/);
  await expect(page.getByRole("status")).toContainText("Jaquette remplacée");
  // Dans « Toutes », la sortie a maintenant une jaquette de source « Photo ».
  await page.getByRole("link", { name: "Toutes" }).click();
  await expect(page.getByText(/· Photo$/).first()).toBeVisible();
});
