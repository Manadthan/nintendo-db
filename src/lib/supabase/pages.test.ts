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
});
