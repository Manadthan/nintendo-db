import type { Metadata } from "next";
import { FormulaireConnexion } from "@/components/FormulaireConnexion";

export const metadata: Metadata = {
  title: "Connexion · Nintendo DB",
  // Page réservée au propriétaire : pas d'indexation par les moteurs de recherche.
  robots: { index: false, follow: false },
};

// Connexion du propriétaire (US-09) : aucun lien n'y mène depuis le site public.
export default function PageConnexion() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <div className="mb-7 flex flex-col gap-1.5">
        <span className="font-titre text-[19px] font-bold tracking-tight">Nintendo DB</span>
        <h1 className="font-titre text-[26px] font-bold tracking-tight">Administration</h1>
        <p className="text-[15px] text-texte-doux">Connexion réservée au propriétaire du site.</p>
      </div>
      <FormulaireConnexion />
    </main>
  );
}
