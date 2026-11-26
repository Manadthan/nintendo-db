import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnTete } from "@/components/EnTete";
import { FicheAmiibo } from "@/components/FicheAmiibo";
import { chargerAmiibo, listerAmiibo } from "@/lib/amiibo/charger";
import {
  donneesAmiibo,
  estSlugAmiibo,
  metadonneesAmiibo,
} from "@/lib/amiibo/fiche";
import { aujourdhuiParis } from "@/lib/catalogue/a-venir";
import { jsonPourScript } from "@/lib/referencement/referencement";

// Fiches préparées à l'avance comme celles des jeux (ADR-21 point 6), régénérées au plus toutes les 5 minutes ;
// un amiibo ajouté après le build est préparé à sa première visite.
export const revalidate = 300;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return listerAmiibo();
}

async function lire(slug: string) {
  return estSlugAmiibo(slug) ? chargerAmiibo(slug) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const amiibo = await lire((await params).slug);
  if (!amiibo) return { title: "Amiibo introuvable · Nintendo DB" };
  return metadonneesAmiibo(amiibo);
}

// Fiche d'un amiibo (US-29), adresse stable /amiibo/{slug}.
export default async function PageAmiibo({
  params,
}: {
  params: Promise<Params>;
}) {
  const amiibo = await lire((await params).slug);
  if (!amiibo) notFound();

  return (
    <>
      <EnTete />
      <script
        type="application/ld+json"
        // Données structurées schema.org Product ; JSON échappé, sans balise fermante possible.
        dangerouslySetInnerHTML={{
          __html: jsonPourScript(donneesAmiibo(amiibo)),
        }}
      />
      <FicheAmiibo amiibo={amiibo} aujourdhui={aujourdhuiParis()} />
    </>
  );
}
