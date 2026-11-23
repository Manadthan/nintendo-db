import { expect, test, type Page } from "@playwright/test";

// US-26 — Voir des captures du jeu (docs/SPEC.md). Captures de test chargées en CI (tests/e2e/captures.sql) pour
// Mario Kart 8 ; les images de media.rawg.io sont interceptées : jamais RAWG en direct.

const MARIO_KART = "/jeux/wii-u/mario-kart-8";
// PNG 1 × 1 gris.
const IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==",
  "base64",
);

async function imagesRawg(page: Page, cassee?: string) {
  await page.route("https://media.rawg.io/**", (route) =>
    cassee && route.request().url().includes(cassee)
      ? route.fulfill({ status: 404 })
      : route.fulfill({ contentType: "image/png", body: IMAGE }),
  );
}

test("la fiche montre un carrousel de captures avec le lien vers RAWG", async ({
  page,
}) => {
  await imagesRawg(page);
  await page.goto(MARIO_KART);
  const bloc = page.getByRole("region", { name: "Captures" });
  await expect(bloc.getByText("3 · toucher pour agrandir")).toBeVisible();
  await expect(
    bloc.getByRole("img", { name: "Mario Kart 8, capture 1 sur 3" }),
  ).toHaveAttribute(
    "src",
    "https://media.rawg.io/media/resize/640/-/screenshots/e2e/capture-1.jpg",
  );
  await expect(
    bloc.getByRole("link", { name: "RAWG", exact: true }),
  ).toHaveAttribute("href", "https://rawg.io/games/mario-kart-8");
});

test("un toucher ouvre la capture en grand ; Fermer et Échap la referment", async ({
  page,
}) => {
  await imagesRawg(page);
  await page.goto(MARIO_KART);
  await page
    .getByRole("button", { name: "Agrandir la capture 2 sur 3" })
    .click();
  const fenetre = page.getByRole("dialog", {
    name: "Captures de Mario Kart 8",
  });
  await expect(fenetre).toBeVisible();
  await expect(fenetre.getByText("2 / 3")).toBeVisible();
  await expect(
    fenetre.getByRole("img", { name: "Mario Kart 8, capture 2 sur 3" }),
  ).toHaveAttribute(
    "src",
    "https://media.rawg.io/media/resize/1280/-/screenshots/e2e/capture-2.jpg",
  );
  await fenetre.getByRole("button", { name: "Fermer ✕" }).click();
  await expect(fenetre).toBeHidden();

  await page
    .getByRole("button", { name: "Agrandir la capture 1 sur 3" })
    .click();
  await expect(fenetre).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(fenetre).toBeHidden();
});

test("une image qui ne charge pas est retirée du carrousel", async ({
  page,
}) => {
  // La 1re image, visible dès l'ouverture : les suivantes ne se chargent (et n'échouent) qu'au défilement.
  await imagesRawg(page, "capture-1");
  await page.goto(MARIO_KART);
  const bloc = page.getByRole("region", { name: "Captures" });
  await expect(bloc.getByText("2 · toucher pour agrandir")).toBeVisible();
});

test("un jeu sans captures n'a pas de bloc Captures", async ({ page }) => {
  await page.goto("/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Captures" })).toHaveCount(0);
});
