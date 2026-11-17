import { expect, test } from "@playwright/test";

// Référencement (SPEC §5, étape 7), sur les jeux de départ (migration 0004).

test("robots.txt : tout le site sauf l'administration, avec le plan du site", async ({
  request,
}) => {
  const texte = await (await request.get("/robots.txt")).text();
  expect(texte).toContain("Disallow: /admin");
  expect(texte).toContain(
    "Sitemap: https://nintendo-db.vercel.app/sitemap.xml",
  );
});

test("sitemap.xml : accueil, À propos et chaque fiche", async ({ request }) => {
  const reponse = await request.get("/sitemap.xml");
  expect(reponse.ok()).toBe(true);
  const xml = await reponse.text();
  expect(xml).toContain("<loc>https://nintendo-db.vercel.app/</loc>");
  expect(xml).toContain("<loc>https://nintendo-db.vercel.app/a-propos</loc>");
  expect(xml).toContain(
    "<loc>https://nintendo-db.vercel.app/jeux/wii-u/mario-kart-8</loc>",
  );
});

test("une fiche a son adresse canonique, son aperçu de partage et ses données structurées", async ({
  page,
}) => {
  await page.goto("/jeux/wii-u/mario-kart-8");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://nintendo-db.vercel.app/jeux/wii-u/mario-kart-8",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Mario Kart 8 · Wii U",
  );
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    "Nintendo DB",
  );

  const json = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(json ?? "{}")).toMatchObject({
    "@type": "VideoGame",
    name: "Mario Kart 8",
    gamePlatform: "Wii U",
    datePublished: "2014-05-29",
  });
});
