import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnTete } from "@/components/EnTete";
import { FicheJeu } from "@/components/FicheJeu";
import { versionAffichee } from "@/lib/catalogue/catalogue";
import { chargerJeu, listerFiches } from "@/lib/fiche/charger";

// Fiches préparées à l'avance (ADR-02), régénérées au plus toutes les 5 minutes ;
// un jeu ajouté après le build est préparé à sa première visite.
export const revalidate = 300;

type Params = { console: string; jeu: string };

export async function generateStaticParams(): Promise<Params[]> {
  return listerFiches();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { console: consoleSlug, jeu: slug } = await params;
  const jeu = await chargerJeu(consoleSlug, slug);
  if (!jeu) return { title: "Jeu introuvable · Nintendo DB" };
  const titre = versionAffichee(jeu, "TOUS")?.sortie.titre ?? slug;
  return {
    title: `${titre} · ${jeu.console.nom} · Nintendo DB`,
    description: `${titre} sur ${jeu.console.nom} : jaquettes, titres et dates de sortie au Japon, en Amérique du Nord et en Europe.`,
  };
}

// Fiche d'un jeu (US-04), adresse stable /jeux/{console}/{jeu} (ADR-06).
export default async function PageJeu({ params }: { params: Promise<Params> }) {
  const { console: consoleSlug, jeu: slug } = await params;
  const jeu = await chargerJeu(consoleSlug, slug);
  if (!jeu) notFound();

  return (
    <>
      <EnTete />
      <FicheJeu jeu={jeu} />
    </>
  );
}
