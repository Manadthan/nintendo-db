import { describe, expect, it } from "vitest";
import { toutesLesPages } from "./pages";

// Supabase ne renvoie pas plus de 1 000 lignes par requête : 1 090 jeux en base le 19/11/2026 (NES), dont 90
// absents du catalogue (Super Mario Bros. 2 et 3).
const base = Array.from({ length: 1090 }, (_, i) => i);
/** Imite PostgREST : la plage demandée, coupée à 1 000 lignes. */
const lire = (de: number, a: number) =>
  Promise.resolve({
    data: base.slice(de, Math.min(a + 1, de + 1000)),
    error: null,
  });

describe("toutesLesPages", () => {
  it("lit les 1 090 lignes, pas seulement les 1 000 premières", async () => {
    expect(await toutesLesPages(lire, "Catalogue")).toEqual(base);
  });

  it("s'arrête sur une page incomplète, sans requête vide en plus", async () => {
    const plages: number[] = [];
    await toutesLesPages((de, a) => {
      plages.push(de);
      return lire(de, a);
    }, "Catalogue");
    expect(plages).toEqual([0, 1000]);
  });

  it("une erreur nomme ce qui est illisible", async () => {
    await expect(
      toutesLesPages(
        () => Promise.resolve({ data: null, error: { message: "boom" } }),
        "Catalogue",
      ),
    ).rejects.toThrow("Catalogue illisible : boom");
  });

  it("lit 2 pages en même temps quand on le demande, sans rien perdre ni doubler", async () => {
    let enCours = 0;
    let auPlus = 0;
    const plages: number[] = [];
    const lignes = await toutesLesPages(
      async (de, a) => {
        plages.push(de);
        auPlus = Math.max(auPlus, ++enCours);
        await Promise.resolve();
        enCours--;
        return lire(de, a);
      },
      "Catalogue",
      2,
    );
    expect(lignes).toEqual(base);
    expect(plages).toEqual([0, 1000]);
    expect(auPlus).toBe(2);
  });

  it("continue au-delà quand les pages lues en même temps sont pleines", async () => {
    const grande = Array.from({ length: 2500 }, (_, i) => i);
    const lignes = await toutesLesPages(
      (de, a) =>
        Promise.resolve({
          data: grande.slice(de, Math.min(a + 1, de + 1000)),
          error: null,
        }),
      "Catalogue",
      2,
    );
    expect(lignes).toEqual(grande);
  });
});
