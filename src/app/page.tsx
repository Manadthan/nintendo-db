import { Catalogue } from "@/components/Catalogue";
import { EnTete } from "@/components/EnTete";
import type { Metadata } from "next";
import { chargerCatalogue, chargerConsoles } from "@/lib/catalogue/charger";

// Page préparée à l'avance et régénérée au plus toutes les 5 minutes (ADR-02) :
// rapide pour les visiteurs, à jour peu après une migration ou une correction.
export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

// L'accueil EST le catalogue de toutes les consoles (US-01, SPEC v1.9 ; ADR-06).
export default async function Accueil() {
  const [jeux, consoles] = await Promise.all([
    chargerCatalogue(),
    chargerConsoles(),
  ]);

  return (
    <>
      <EnTete page="catalogue" />

      <main>
        <section className="border-b border-bordure bg-carte px-4 pt-[22px] pb-5">
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">
              Pour les collectionneurs
            </p>
            <h1 className="font-titre text-[26px] leading-tight font-bold tracking-tight">
              Les jeux Nintendo en boîte, version par version
            </h1>
            <p className="text-sm leading-relaxed text-texte-doux">
              Tous les jeux édités par Nintendo, avec leurs jaquettes, titres et
              dates au Japon, en Amérique du Nord et en Europe.
            </p>
          </div>
        </section>

        <Catalogue jeux={jeux} consoles={consoles} />
      </main>
    </>
  );
}
