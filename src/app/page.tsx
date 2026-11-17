import { Catalogue } from "@/components/Catalogue";
import { EnTete } from "@/components/EnTete";
import { PiedDePage } from "@/components/PiedDePage";
import type { Metadata } from "next";
import { chargerCatalogue } from "@/lib/catalogue/charger";

// Page préparée à l'avance et régénérée au plus toutes les 5 minutes (ADR-02) :
// rapide pour les visiteurs, à jour peu après une migration ou une correction.
export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

// v1 : une seule console, l'accueil EST son catalogue (US-01 en S, ADR-06).
const CONSOLE = { slug: "wii-u", nom: "Wii U" };

export default async function Accueil() {
  const jeux = await chargerCatalogue(CONSOLE.slug);

  return (
    <>
      <EnTete page="catalogue" />

      <main>
        <section className="flex flex-col gap-1.5 border-b border-bordure bg-carte px-4 pt-[22px] pb-5">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">
            Pour les collectionneurs
          </p>
          <h1 className="font-titre text-[26px] leading-tight font-bold tracking-tight">
            Les jeux Nintendo en boîte, version par version
          </h1>
          <p className="text-sm leading-relaxed text-texte-doux">
            {CONSOLE.nom} : chaque jeu édité par Nintendo, avec ses jaquettes,
            titres et dates au Japon, en Amérique du Nord et en Europe.
          </p>
        </section>

        <Catalogue
          jeux={jeux}
          consoleSlug={CONSOLE.slug}
          consoleNom={CONSOLE.nom}
        />
      </main>
      <PiedDePage />
    </>
  );
}
