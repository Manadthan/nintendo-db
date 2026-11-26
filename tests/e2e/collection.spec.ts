import { expect, test } from "@playwright/test";
import {
  attendreHydratation,
  BASE_LOCALE_DISPONIBLE,
  seConnecter,
} from "./utilisateur";

// US-16 — Ma collection (étape 12). Base Supabase locale (CI) : jeux de départ (migration 0004). Ces tests écrivent
// dans la base : ils tournent dans les projets `*-admin` (playwright.config.ts) et décochent ce qu'ils ont coché.
test.skip(!BASE_LOCALE_DISPONIBLE, "Base Supabase locale nécessaire (CI)");

const caseEurope = (page: import("@playwright/test").Page) =>
  page.getByRole("checkbox", { name: "Je l'ai : version Europe", exact: true });

/**
 * Coche ou décoche, puis attend que la base ait répondu : la case change tout de suite à l'écran, l'écriture part
 * ensuite. Recharger sans attendre perdait parfois l'écriture (CI de #213, 22/11/2026).
 */
async function basculer(page: import("@playwright/test").Page, avoir: boolean) {
  const enregistre = page.waitForResponse(
    (r) =>
      r.url().includes("/rest/v1/possessions") &&
      r.request().method() === (avoir ? "POST" : "DELETE"),
  );
  await (avoir ? caseEurope(page).check() : caseEurope(page).uncheck());
  expect((await enregistre).ok()).toBe(true);
}

test("connecté, je coche une version sur la fiche ; elle reste cochée après rechargement", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/splatoon");
  await expect(caseEurope(page)).not.toBeChecked();
  await basculer(page, true);
  await page.reload();
  await expect(caseEurope(page)).toBeChecked();

  // Nettoyage : décocher, et vérifier que c'est aussi enregistré.
  await basculer(page, false);
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
  await basculer(page, true);

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
  await basculer(page, false);
  await page.reload();
  await expect(caseEurope(page)).not.toBeChecked();
});

test("Statistiques : ma collection par console, par région et notes (US-18)", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto("/jeux/wii-u/splatoon");
  await basculer(page, true);

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

  // Bascule « First party » (SPEC v1.32) : Wii Karaoke U (Xing) n'est plus compté, Splatoon l'est.
  const bascule = page.getByRole("navigation", { name: "Jeux comptés" });
  await expect(
    bascule.getByRole("link", { name: "Tous", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await bascule.getByRole("link", { name: "First party", exact: true }).click();
  await expect(page).toHaveURL("/admin/statistiques?jeux=first-party");
  await expect(
    collection.getByRole("listitem", { name: "Wii U : 1 / 3", exact: true }),
  ).toBeVisible();

  // Remise en état : Splatoon décoché.
  await page.goto("/jeux/wii-u/splatoon");
  await basculer(page, false);
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

// US-30 — Mes amiibo : une case par amiibo (amiibo de test, tests/e2e/amiibo.sql), marque verte et filtre Collection.
test("connecté, je coche un amiibo ; marque verte et filtre Collection dans le catalogue", async ({
  page,
}) => {
  const caseAmiibo = page.getByRole("checkbox", {
    name: "Je l'ai",
    exact: true,
  });
  const basculerAmiibo = async (avoir: boolean) => {
    const enregistre = page.waitForResponse(
      (r) =>
        r.url().includes("/rest/v1/possessions_amiibo") &&
        r.request().method() === (avoir ? "POST" : "DELETE"),
    );
    await (avoir ? caseAmiibo.check() : caseAmiibo.uncheck());
    expect((await enregistre).ok()).toBe(true);
  };

  await seConnecter(page);
  await page.goto("/amiibo/inkling-e2e");
  await expect(caseAmiibo).not.toBeChecked();
  await basculerAmiibo(true);
  await page.reload();
  await expect(caseAmiibo).toBeChecked();

  await page.goto("/?voir=amiibo&collection=possedes");
  await expect(
    page.getByText("1 amiibo affiché", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Inkling e2e/ })).toContainText(
    "✓ Je l'ai",
  );
  await page.goto("/?voir=amiibo&collection=manquants");
  await expect(
    page.getByText("0 amiibo affiché", { exact: true }),
  ).toBeVisible();

  // Nettoyage : décocher, et vérifier que c'est aussi enregistré.
  await page.goto("/amiibo/inkling-e2e");
  await basculerAmiibo(false);
  await page.reload();
  await expect(caseAmiibo).not.toBeChecked();
});

// Guides possédés : une case par guide (guide de test, tests/e2e/guides.sql), marque verte et filtre Collection.
test("connecté, je coche un guide ; marque verte et filtre Collection dans le catalogue", async ({
  page,
}) => {
  const caseGuide = page.getByRole("checkbox", {
    name: "Je l'ai",
    exact: true,
  });
  const basculerGuide = async (avoir: boolean) => {
    const enregistre = page.waitForResponse(
      (r) =>
        r.url().includes("/rest/v1/possessions_guides") &&
        r.request().method() === (avoir ? "POST" : "DELETE"),
    );
    await (avoir ? caseGuide.check() : caseGuide.uncheck());
    expect((await enregistre).ok()).toBe(true);
  };

  await seConnecter(page);
  await page.goto("/guides/9784000000017");
  await expect(caseGuide).not.toBeChecked();
  await basculerGuide(true);
  await page.reload();
  await expect(caseGuide).toBeChecked();

  await page.goto("/?voir=guides&collection=possedes");
  await expect(
    page.getByText("1 guide affiché", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /マリオカート8 パーフェクトガイド/ }),
  ).toContainText("✓ Je l'ai");
  await page.goto("/?voir=guides&collection=manquants");
  await expect(
    page.getByText("0 guide affiché", { exact: true }),
  ).toBeVisible();

  // Nettoyage : décocher, et vérifier que c'est aussi enregistré.
  await page.goto("/guides/9784000000017");
  await basculerGuide(false);
  await page.reload();
  await expect(caseGuide).not.toBeChecked();
});

// US-32 — Voir ce qui arrive. Ici, et non dans un fichier à part : les tests d'un même fichier passent l'un après
// l'autre, et ceux de ce fichier comptent les jeux (« 1 jeu affiché sur 4 ») ; un 5ᵉ jeu ajouté en même temps par un
// autre fichier les ferait échouer (CI de #290, 26/11/2026). Date en 2099 : toujours à venir.
test("un jeu annoncé apparaît dans la bande « À venir », avec l'étiquette, sans case « je l'ai » (US-32)", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const titre = "Jeu annoncé e2e";
  await seConnecter(page);
  await page.goto("/admin/jeux");
  await page.getByText("+ Ajouter un jeu").click();
  await attendreHydratation(
    page.getByRole("button", { name: "Ajouter le jeu" }),
  );
  await page.getByLabel("Titre").fill(titre);
  await page.getByLabel("PAL").check();
  await page.getByRole("button", { name: "Ajouter le jeu" }).click();
  await expect(page).toHaveURL(
    /\/admin\/jeux\/wii-u\/jeu-annonce-e2e.*\?nouveau=1/,
  );
  const fiche = new URL(page.url()).pathname;

  try {
    const enregistrer = page.getByRole("button", {
      name: "Enregistrer la fiche",
    });
    await attendreHydratation(enregistrer);
    await page.locator('input[name="PAL.date_sortie"]').fill("2099-03-14");
    await page
      .locator('select[name="PAL.precision_date"]')
      .selectOption("jour");
    await enregistrer.click();
    await expect(
      page.getByRole("status").filter({ hasText: "Fiche enregistrée" }),
    ).toBeVisible();

    // Accueil : la bande montre le jeu (annoncé en Europe seulement) et sa date courte.
    await page.goto("/");
    const carte = page
      .getByRole("region", { name: /À venir/ })
      .getByRole("link", { name: new RegExp(titre) });
    await expect(carte).toBeVisible();
    await expect(carte).toContainText("14 mars 2099");

    // Fiche : date annoncée, étiquette, ni case « je l'ai » pour cette version.
    await carte.click();
    await expect(page.getByText(/Sortie prévue : 14 mars 2099/)).toBeVisible();
    await expect(
      page.getByText("À venir", { exact: true }).first(),
    ).toBeVisible();
    await expect(caseEurope(page)).toHaveCount(0);
  } catch (erreur) {
    // L'erreur du nettoyage remplacerait celle-ci dans le rapport : on la garde dans le journal.
    console.error("Jeu annoncé e2e :", erreur);
    throw erreur;
  } finally {
    // Nettoyage réessayé : un jeu resté en base fausse les comptages des autres navigateurs (CI de #290, 26/11/2026 :
    // bouton « Supprimer ce jeu » pas encore pris en main par React après 5 s).
    await expect(async () => {
      const reponse = await page.goto(fiche);
      if (reponse?.status() === 404) return; // Déjà supprimé par un essai précédent.
      const supprimer = page.getByRole("button", { name: "Supprimer ce jeu" });
      await attendreHydratation(supprimer);
      page.once("dialog", (d) => d.accept());
      await supprimer.click();
      await expect(
        page.getByRole("status").filter({ hasText: "a été supprimé" }),
      ).toBeVisible();
    }).toPass({ timeout: 30_000 });
  }
});
