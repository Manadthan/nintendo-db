import { expect, test } from "@playwright/test";
import {
  attendreHydratation,
  BASE_LOCALE_DISPONIBLE,
  seConnecter,
} from "./utilisateur";

// US-32 — Voir ce qui arrive (docs/SPEC.md). Un jeu annoncé est ajouté puis supprimé depuis l'administration
// (projets « -admin », après les tests publics : aucun compteur du catalogue ne le voit) ; date en 2099, toujours
// à venir. L'accueil et la fiche sont refaits aussitôt par l'enregistrement (revalidatePath).
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

const TITRE = "Jeu annoncé e2e";

test("un jeu annoncé apparaît dans la bande « À venir », avec l'étiquette, sans case « je l'ai »", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/admin/jeux");
  await page.getByText("+ Ajouter un jeu").click();
  await attendreHydratation(
    page.getByRole("button", { name: "Ajouter le jeu" }),
  );
  await page.getByLabel("Titre").fill(TITRE);
  await page.getByLabel("PAL").check();
  await page.getByRole("button", { name: "Ajouter le jeu" }).click();
  await expect(page).toHaveURL("/admin/jeux/wii-u/jeu-annonce-e2e?nouveau=1");

  const enregistrer = page.getByRole("button", {
    name: "Enregistrer la fiche",
  });
  await attendreHydratation(enregistrer);
  await page.locator('input[name="PAL.date_sortie"]').fill("2099-03-14");
  await page.locator('select[name="PAL.precision_date"]').selectOption("jour");
  await enregistrer.click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");

  try {
    // Accueil : la bande montre le jeu (annoncé en Europe seulement) et sa date courte.
    await page.goto("/");
    const bande = page.getByRole("region", { name: /À venir/ });
    const carte = bande.getByRole("link", { name: new RegExp(TITRE) });
    await expect(carte).toBeVisible();
    await expect(carte).toContainText("14 mars 2099");

    // Fiche : date annoncée, étiquette, ni case « je l'ai » ni prix eBay pour cette version.
    await carte.click();
    await expect(page).toHaveURL("/jeux/wii-u/jeu-annonce-e2e");
    await expect(page.getByText(/Sortie prévue : 14 mars 2099/)).toBeVisible();
    await expect(
      page.getByText("À venir", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Je l'ai : version Europe" }),
    ).toHaveCount(0);
  } finally {
    await page.goto("/admin/jeux/wii-u/jeu-annonce-e2e");
    const supprimer = page.getByRole("button", { name: "Supprimer ce jeu" });
    await attendreHydratation(supprimer);
    page.once("dialog", (d) => d.accept());
    await supprimer.click();
    await expect(page.getByRole("status")).toContainText("a été supprimé");
  }
});
