/** Adresse du profil public d'un pseudo (US-23) ; refaite aussitôt après un changement (pas d'attente du cache). */
export const cheminPublic = (pseudo: string) => `/collectionneurs/${pseudo}`;
