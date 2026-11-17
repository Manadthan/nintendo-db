import { Catalogue } from "@/components/Catalogue";
import { EnTete } from "@/components/EnTete";
import { PiedDePage } from "@/components/PiedDePage";
import type { Metadata } from "next";
import { chargerCatalogue, chargerConsoles } from "@/lib/catalogue/charger";

// Page préparée à l'avance et régénérée au plus toutes les 5 minutes (ADR-02) :
// rapide pour les visiteurs, à jour peu après une migration ou une correction.
export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** « Wii », « Wii et Wii U », « GameCube, Wii et Wii U ». */
const enumerer = (noms: string[]) =>
  noms.length < 2
    ? (noms[0] ?? "")
    : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;

// L'accueil EST le catalogue de toutes les consoles (US-01, SPEC v1.9 ; ADR-06).
export default async function Accueil() {
  const [jeux, consoles] = await Promise.all([
    chargerCatalogue(),
    chargerConsoles(),
  ]);
  const couvertes = consoles.filter((c) =>
    jeux.some((j) => j.console.slug === c.slug),
  );

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
            {enumerer(couvertes.map((c) => c.nom))} : chaque jeu édité par
            Nintendo, avec ses jaquettes, titres et dates au Japon, en Amérique
            du Nord et en Europe.
          </p>
        </section>

        <Catalogue jeux={jeux} consoles={consoles} />
      </main>
      <PiedDePage />
    </>
  );
}
