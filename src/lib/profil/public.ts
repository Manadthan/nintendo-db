import "server-only";
import { ensemble } from "@/lib/collection/collection";
import type { Region } from "@/lib/catalogue/types";
import { PSEUDO } from "@/lib/invitations/inscription";
import { avatarOuDefaut } from "@/lib/profil/avatars";
import {
  jeuxParConsole,
  syntheseProfil,
  type LigneAjout,
} from "@/lib/profil/collection";
import { chargerCatalogue } from "@/lib/statistiques/charger";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type ProfilPublicBrut = {
  pseudo: string;
  avatar: string;
  cree_le: string;
  versions: { game_id: string; region: Region }[];
  ajouts: LigneAjout[];
};

/**
 * Profil public d'un collectionneur (US-23, ADR-16 point 4), lu en visiteur : la fonction `profil_public()` de la
 * base ne renvoie rien pour un profil privé ou un pseudo inconnu → null (page « introuvable »).
 */
export async function chargerProfilPublic(pseudo: string) {
  if (!PSEUDO.test(pseudo)) return null;
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("profil_public", {
    p_pseudo: pseudo,
  });
  if (error) throw new Error(`Profil illisible : ${error.message}`);
  if (!data) return null;
  const brut = data as unknown as ProfilPublicBrut;
  const { jeux, consoles } = await chargerCatalogue(supabase);
  const possessions = ensemble(brut.versions);
  return {
    pseudo: brut.pseudo,
    avatar: avatarOuDefaut(brut.avatar),
    creeLe: brut.cree_le,
    ...syntheseProfil(jeux, consoles, possessions, brut.ajouts),
    parConsole: jeuxParConsole(jeux, consoles, possessions),
  };
}
