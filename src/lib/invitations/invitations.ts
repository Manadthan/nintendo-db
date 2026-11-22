import { createHash, randomBytes } from "node:crypto";

/**
 * Invitations de collectionneurs (US-19, ADR-16 point 2), sans accès à la base : jeton, empreinte, lien, état.
 * Le jeton n'est montré qu'une fois ; la base n'en garde que l'empreinte SHA-256.
 */

export const DUREE_INVITATION_JOURS = 7;
export const LONGUEUR_NOM_MAX = 40;

/** 32 octets aléatoires en base64url : 43 caractères, sans « / » ni « + » (sûr dans une adresse). */
export function genererJeton(): string {
  return randomBytes(32).toString("base64url");
}

/** Forme d'un jeton : écarte toute adresse fantaisiste avant d'interroger la base. */
export function jetonValide(jeton: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(jeton);
}

/** Empreinte SHA-256 en hexadécimal : seule valeur gardée en base. */
export function hacherJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

/** Lien à partager : sur le site qui l'a créé (production ou prévisualisation). */
export function lienInvitation(origine: string, jeton: string): string {
  return `${origine.replace(/\/+$/, "")}/bienvenue/${jeton}`;
}

export type EtatInvitation = "en-attente" | "expiree" | "utilisee";

export function etatInvitation(
  invitation: { expire_le: string; utilisee_le: string | null },
  maintenant: Date,
): EtatInvitation {
  if (invitation.utilisee_le) return "utilisee";
  return new Date(invitation.expire_le) <= maintenant
    ? "expiree"
    : "en-attente";
}

/** Nom choisi par le propriétaire pour se souvenir de l'invité (« Léa ») : 1 à 40 caractères. */
export function lireNom(
  brut: unknown,
): { ok: true; nom: string } | { ok: false; erreur: string } {
  const nom = String(brut ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!nom) return { ok: false, erreur: "Donnez un nom à l'invitation." };
  if (nom.length > LONGUEUR_NOM_MAX)
    return { ok: false, erreur: `${LONGUEUR_NOM_MAX} caractères au plus.` };
  return { ok: true, nom };
}
