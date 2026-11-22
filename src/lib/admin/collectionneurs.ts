/** Liste des collectionneurs de la page « Collectionneurs » (US-19), assemblée sans accès à la base. */

export type Collectionneur = {
  userId: string;
  pseudo: string;
  email: string;
  inscritLe: string;
  jeux: number;
};

/**
 * Profils de rôle « collectionneur » + adresse e-mail du compte + nombre de jeux distincts possédés (une version
 * JAP et une PAL du même jeu comptent pour un jeu). Triés par pseudo.
 */
export function listerCollectionneurs(
  profils: { user_id: string; pseudo: string; role: string; cree_le: string }[],
  comptes: { id: string; email?: string | null }[],
  possessions: { user_id: string; game_id: string }[],
): Collectionneur[] {
  const emails = new Map(comptes.map((c) => [c.id, c.email ?? ""]));
  const jeux = new Map<string, Set<string>>();
  for (const p of possessions) {
    if (!jeux.has(p.user_id)) jeux.set(p.user_id, new Set());
    jeux.get(p.user_id)!.add(p.game_id);
  }
  return profils
    .filter((p) => p.role === "collectionneur")
    .map((p) => ({
      userId: p.user_id,
      pseudo: p.pseudo,
      email: emails.get(p.user_id) ?? "",
      inscritLe: p.cree_le,
      jeux: jeux.get(p.user_id)?.size ?? 0,
    }))
    .sort((a, b) =>
      a.pseudo.localeCompare(b.pseudo, "fr", { sensitivity: "base" }),
    );
}
