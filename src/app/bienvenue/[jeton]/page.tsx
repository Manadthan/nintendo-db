import type { Metadata } from "next";
import { FormulaireBienvenue } from "@/components/FormulaireBienvenue";
import { LienPerime } from "@/components/LienPerime";
import {
  etatInvitation,
  hacherJeton,
  jetonValide,
} from "@/lib/invitations/invitations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Bienvenue · Nintendo DB",
  robots: { index: false, follow: false },
};

// Lu à chaque ouverture : l'état de l'invitation change (utilisée, annulée, expirée).
export const dynamic = "force-dynamic";

/** Le lien d'une invitation (US-20) : création du compte d'un collectionneur invité. */
export default async function PageBienvenue({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  let valable = false;
  if (jetonValide(jeton)) {
    // Clé secrète : un visiteur ne lit jamais la table des invitations.
    const { data } = await createSupabaseAdminClient()
      .from("invitations")
      .select("expire_le, utilisee_le")
      .eq("jeton_hache", hacherJeton(jeton))
      .maybeSingle();
    valable = !!data && etatInvitation(data, new Date()) === "en-attente";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-8">
      <div className="mb-7 flex flex-col gap-1.5">
        <span className="font-titre text-[19px] font-bold tracking-tight">
          Nintendo DB
        </span>
        <h1 className="font-titre text-[26px] font-bold tracking-tight">
          Bienvenue
        </h1>
        {valable && (
          <p className="text-[15px] text-texte-doux">
            Vous êtes invité à tenir votre collection de jeux Nintendo sur le
            site. Créez votre compte.
          </p>
        )}
      </div>
      {valable ? <FormulaireBienvenue jeton={jeton} /> : <LienPerime />}
    </main>
  );
}
