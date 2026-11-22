/**
 * Adresse du profil public d'un pseudo (US-23), toujours en minuscules : une seule adresse par profil, celle que
 * rafraîchit un changement (revalidatePath). Une redirection de « LEA-64 » vers « lea-64 » n'est pas possible depuis
 * une page gardée en cache : WebKit y recevait un en-tête Location en double (e2e du 22/11/2026).
 */
export const cheminPublic = (pseudo: string) =>
  `/collectionneurs/${pseudo.toLowerCase()}`;
