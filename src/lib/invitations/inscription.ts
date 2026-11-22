/** Formulaire de la page « Bienvenue » (US-20), vérifié sans accès à la base. */

export const MOT_DE_PASSE_MIN = 8;
/** Même règle que la base (0024) : 3 à 20 lettres non accentuées, chiffres ou tirets. */
export const PSEUDO = /^[A-Za-z0-9-]{3,20}$/;

export type Inscription = { email: string; motDePasse: string; pseudo: string };

export function lireInscription(
  formData: FormData,
): { ok: true; valeur: Inscription } | { ok: false; erreurs: string[] } {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const motDePasse = String(formData.get("password") ?? "");
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  const erreurs: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    erreurs.push("Saisissez une adresse e-mail valide.");
  if (motDePasse.length < MOT_DE_PASSE_MIN)
    erreurs.push(
      `Le mot de passe doit faire ${MOT_DE_PASSE_MIN} caractères au moins.`,
    );
  if (!PSEUDO.test(pseudo))
    erreurs.push(
      "Le pseudo : 3 à 20 lettres (sans accent), chiffres ou tirets.",
    );
  return erreurs.length
    ? { ok: false, erreurs }
    : { ok: true, valeur: { email, motDePasse, pseudo } };
}
