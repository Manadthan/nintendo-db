import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnTete } from "@/components/EnTete";
import { FicheJeu } from "@/components/FicheJeu";
import { aujourdhuiParis } from "@/lib/catalogue/a-venir";
import { chargerJeu, listerFiches } from "@/lib/fiche/charger";
import {
  donneesStructurees,
  jsonPourScript,
  metadonneesFiche,
} from "@/lib/referencement/referencement";

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
  return metadonneesFiche(jeu);
}

// Fiche d'un jeu (US-04), adresse stable /jeux/{console}/{jeu} (ADR-06).
export default async function PageJeu({ params }: { params: Promise<Params> }) {
  const { console: consoleSlug, jeu: slug } = await params;
  const jeu = await chargerJeu(consoleSlug, slug);
  if (!jeu) notFound();

  return (
    <>
      <EnTete />
      <script
        type="application/ld+json"
        // Données structurées schema.org (référencement) ; JSON échappé, sans balise fermante possible.
        dangerouslySetInnerHTML={{
          __html: jsonPourScript(donneesStructurees(jeu)),
        }}
      />
      <FicheJeu jeu={jeu} aujourdhui={aujourdhuiParis()} />
    </>
  );
}
