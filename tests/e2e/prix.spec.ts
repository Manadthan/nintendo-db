import { expect, test, type Page } from "@playwright/test";

// US-25 — Voir le prix demandé sur eBay (docs/SPEC.md). La route est interceptée : jamais eBay en direct (ADR-17).

const KIRBY = "/jeux/wii-u/kirby-and-the-rainbow-paintbrush";
const LIEN = "https://www.ebay.com/sch/i.html?_nkw=Kirby&LH_Sold=1";

const reponse = {
  regions: {
    JAP: { etat: "peu", annonces: 3, marches: ["EBAY_US"], lien: LIEN },
    US: {
      etat: "prix",
      euros: 17,
      annonces: 41,
      marches: ["EBAY_US"],
      lien: LIEN,
    },
    PAL: {
      etat: "prix",
      euros: 12,
      annonces: 50,
      marches: ["EBAY_FR", "EBAY_GB"],
      lien: LIEN,
    },
  },
  calculeLe: new Date(Date.now() - 2 * 60 * 60 * 1000 - 60_000).toISOString(),
};

async function intercepter(page: Page, status = 200, corps: unknown = reponse) {
  await page.route("**/api/prix/**", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(corps),
    }),
  );
}

test("le bloc Prix eBay donne le prix de chaque version, la version choisie surlignée", async ({
  page,
}) => {
  await intercepter(page);
  await page.goto(KIRBY);
  const bloc = page.getByRole("region", { name: "Prix eBay" });
  await expect(bloc.getByRole("listitem")).toHaveCount(3);
  await expect(bloc).toContainText("Europe12 €50 annonces · eBay FR + UK");
  await expect(bloc).toContainText("Amérique du Nord17 €41 annonces · eBay US");
  await expect(bloc).toContainText("Pas assez d'annonces (3)");
  await expect(bloc).toContainText("Prix demandé");
  await expect(bloc).toContainText("Mis à jour il y a 2 h");

  // Version ouverte par défaut : PAL ; le sélecteur déplace le surlignage.
  await expect(bloc.locator("[aria-current]")).toContainText("Europe");
  await page.getByRole("button", { name: "Version Japon" }).click();
  await expect(bloc.locator("[aria-current]")).toContainText("Japon");
});

test("chaque version a un lien vers les ventes eBay, ouvert dans un nouvel onglet", async ({
  page,
}) => {
  await intercepter(page);
  await page.goto(KIRBY);
  const lien = page.getByRole("link", {
    name: "Ventes eBay : version Europe",
    exact: true,
  });
  await expect(lien).toHaveAttribute("href", LIEN);
  await expect(lien).toHaveAttribute("target", "_blank");
});

test("une version non sortie s'affiche « Non sorti », sans lien", async ({
  page,
}) => {
  await intercepter(page, 200, {
    ...reponse,
    regions: { JAP: reponse.regions.JAP, PAL: reponse.regions.PAL },
  });
  await page.goto("/jeux/wii-u/wii-karaoke-u");
  const bloc = page.getByRole("region", { name: "Prix eBay" });
  await expect(bloc).toContainText("Amérique du NordNon sorti");
  await expect(
    page.getByRole("link", {
      name: "Ventes eBay : version Amérique du Nord",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("eBay indisponible : le bloc est masqué, la fiche reste identique", async ({
  page,
}) => {
  await intercepter(page, 503, { erreur: "eBay indisponible" });
  await page.goto(KIRBY);
  await expect(
    page.getByRole("region", { name: "Disponibilité" }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Prix eBay" })).toHaveCount(0);
});
