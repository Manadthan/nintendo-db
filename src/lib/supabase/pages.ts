/** Lignes lues par page : Supabase n'en renvoie pas plus de 1 000 à la fois (1 090 jeux depuis la NES, étape 21). */
export const PAGE = 1000;

/**
 * Toutes les lignes d'une requête, page par page. `lire(de, a)` applique `.range(de, a)` à une requête triée
 * (`.order("id")`) : sans tri, deux pages peuvent se chevaucher.
 */
export async function toutesLesPages<T>(
  lire: (
    de: number,
    a: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  quoi: string,
): Promise<T[]> {
  const lignes: T[] = [];
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await lire(de, de + PAGE - 1);
    if (error) throw new Error(`${quoi} illisible : ${error.message}`);
    lignes.push(...(data ?? []));
    if (!data || data.length < PAGE) return lignes;
  }
}
