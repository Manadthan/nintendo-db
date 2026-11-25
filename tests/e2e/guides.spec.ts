import { expect, test, type Page } from "@playwright/test";

// US-27 — Voir les guides japonais (docs/SPEC.md) : page du guide et bloc « Guides » de la fiche. Guide de test chargé en CI
// (tests/e2e/guides.sql) pour Mario Kart 8 ; la couverture de books.google.com est interceptée : jamais Google en direct.

const GUIDE = "/guides/9784000000017";
// PNG 1 × 1 gris.
const IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==",
  "base64",
);

async function couvertures(page: Page, cassee = false) {
  await page.route("https://books.google.com/books/content**", (route) =>
    cassee
      ? route.fulfill({ status: 404 })
      : route.fulfill({ contentType: "image/png", body: IMAGE }),
  );
}

test("la page du guide montre le livre, le jeu couvert et les liens d'achat", async ({
  page,
}) => {
  await couvertures(page);
  await page.goto(GUIDE);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "マリオカート8 パーフェクトガイド",
  );
  await expect(
    page.getByText("Paru en juin 2014 · エンターブレイン"),
  ).toBeVisible();
  await expect(page.getByText("9784000000017")).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Couverture de マリオカート8 パーフェクトガイド",
    }),
  ).toBeVisible();
  await expect(page.getByText("powered by Google")).toBeVisible();

  const amazon = page.getByRole("link", {
    name: "Amazon Japon ›",
    exact: true,
  });
  await expect(amazon).toHaveAttribute(
    "href",
    "https://www.amazon.co.jp/s?k=9784000000017",
  );
  await expect(amazon).toHaveAttribute("target", "_blank");
  await expect(
    page.getByRole("link", { name: "Suruga-ya ›", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://www.suruga-ya.jp/search?search_word=9784000000017",
  );

  const jeux = page.getByRole("region", { name: "Jeu couvert" });
  await jeux.getByRole("link", { name: /Mario Kart 8/ }).click();
  await expect(page).toHaveURL("/jeux/wii-u/mario-kart-8");
});

test("une couverture qui ne charge pas laisse place à la vignette neutre", async ({
  page,
}) => {
  await couvertures(page, true);
  await page.goto(GUIDE);
  await expect(
    page.getByRole("img", {
      name: "マリオカート8 パーフェクトガイド — couverture indisponible",
    }),
  ).toBeVisible();
});

test("un ISBN inconnu ou mal formé mène à la page introuvable", async ({
  page,
}) => {
  for (const adresse of ["/guides/9784000000024", "/guides/pas-un-isbn"]) {
    const reponse = await page.goto(adresse);
    expect(reponse?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page introuvable" }),
    ).toBeVisible();
  }
});

test("la fiche du jeu liste ses guides, chacun menant à sa page", async ({
  page,
}) => {
  await couvertures(page);
  await page.goto("/jeux/wii-u/mario-kart-8");
  const bloc = page.getByRole("region", { name: "Guides (1)" });
  await expect(bloc.getByText("エンターブレイン · 2014")).toBeVisible();
  await expect(bloc.getByText("powered by Google")).toBeVisible();
  await bloc
    .getByRole("link", { name: /マリオカート8 パーフェクトガイド/ })
    .click();
  await expect(page).toHaveURL(GUIDE);
});

test("une fiche sans guide n'a pas de bloc « Guides »", async ({ page }) => {
  await page.goto("/jeux/wii-u/kirby-and-the-rainbow-paintbrush");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Guides/ })).toHaveCount(0);
});
