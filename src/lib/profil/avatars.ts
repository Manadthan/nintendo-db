/**
 * Avatars des comptes (US-22, ADR-16 point 6) : douze icônes dessinées pour le site (aucune image de Nintendo,
 * aucun envoi de photo). Les identifiants sont ceux que la base accepte (contrainte de `profils.avatar`, 0024).
 */
export const AVATARS = [
  { id: "manette", nom: "Manette" },
  { id: "cartouche", nom: "Cartouche" },
  { id: "champignon", nom: "Champignon" },
  { id: "etoile", nom: "Étoile" },
  { id: "envahisseur", nom: "Envahisseur" },
  { id: "trophee", nom: "Trophée" },
  { id: "fusee", nom: "Fusée" },
  { id: "tortue", nom: "Tortue" },
  { id: "eclair", nom: "Éclair" },
  { id: "diamant", nom: "Diamant" },
  { id: "flamme", nom: "Flamme" },
  { id: "de", nom: "Dé" },
] as const;

export type IdAvatar = (typeof AVATARS)[number]["id"];
export const AVATAR_PAR_DEFAUT: IdAvatar = "manette";

export function estAvatar(valeur: unknown): valeur is IdAvatar {
  return AVATARS.some((a) => a.id === valeur);
}

/** Avatar lu en base ou dans un formulaire ; inconnu → avatar par défaut. */
export function avatarOuDefaut(valeur: unknown): IdAvatar {
  return estAvatar(valeur) ? valeur : AVATAR_PAR_DEFAUT;
}
