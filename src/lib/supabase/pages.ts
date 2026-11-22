/** Lignes lues par page : Supabase n'en renvoie pas plus de 1 000 à la fois (1 090 jeux depuis la NES, étape 21). */
export const PAGE = 1000;

/**
 * Toutes les lignes d'une requête, page par page. `lire(de, a)` applique `.range(de, a)` à une requête triée
 * (`.order("id")`) : sans tri, deux pages peuvent se chevaucher. `enParallele` pages sont demandées en même temps
 * (audit de performance D : les 2 pages du catalogue en un seul aller-retour) ; on continue tant qu'elles sont pleines.
 */
export async function toutesLesPages<T>(
  lire: (
    de: number,
    a: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  quoi: string,
  enParallele = 1,
): Promise<T[]> {
  const lignes: T[] = [];
  for (let de = 0; ; de += PAGE * enParallele) {
    const pages = await Promise.all(
      Array.from({ length: enParallele }, (_, i) =>
        lire(de + i * PAGE, de + (i + 1) * PAGE - 1),
      ),
    );
    for (const { data, error } of pages) {
      if (error) throw new Error(`${quoi} illisible : ${error.message}`);
      lignes.push(...(data ?? []));
      if (!data || data.length < PAGE) return lignes;
    }
  }
}
