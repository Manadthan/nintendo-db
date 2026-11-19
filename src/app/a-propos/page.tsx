import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";

const DESCRIPTION =
  "Nintendo DB est un site de fan non affilié à Nintendo : son but, ses sources de données et leurs licences.";

export const metadata: Metadata = {
  title: "À propos · Nintendo DB",
  description: DESCRIPTION,
  alternates: { canonical: "/a-propos" },
  openGraph: {
    siteName: "Nintendo DB",
    locale: "fr_FR",
    type: "website",
    title: "À propos · Nintendo DB",
    description: DESCRIPTION,
    url: "/a-propos",
  },
};

/** Sources de données (US-07, SPEC §5 « Données ») : ce qu'elles apportent et leurs conditions. */
const SOURCES = [
  {
    nom: "Wikipédia",
    lien: "https://en.wikipedia.org/wiki/List_of_Wii_U_games",
    apport:
      "Listes des jeux Wii U et Switch 2, titres en Amérique du Nord et en Europe, dates de sortie, éditeurs et développeurs (articles « List of Wii U games » et « List of Nintendo Switch 2 games », en anglais). Les jaquettes Switch 2 sont des photos ajoutées à la main.",
    licence:
      "Texte sous licence Creative Commons Attribution – Partage dans les mêmes conditions (CC BY-SA 4.0).",
    licenceLien: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
  },
  {
    nom: "GameTDB",
    lien: "https://www.gametdb.com/",
    apport:
      "Scans des boîtes par région, codes produit, titres japonais, genres, et la liste des jeux réellement sortis en boîte. Pour la GameCube, la Wii, la DS, la 3DS et la Switch, toutes les données viennent de GameTDB.",
    licence:
      "Base mise à disposition pour tout projet lié aux jeux (FAQ de GameTDB). Les images des boîtes restent la propriété de leurs éditeurs.",
    licenceLien: "https://www.gametdb.com/Main/FAQ",
  },
] as const;

const LIEN = "text-accent underline-offset-2 hover:underline";

// Page « À propos » (US-07) : non-affiliation, droits, sources et licences. Statique, préparée au build.
export default function APropos() {
  return (
    <>
      <EnTete page="a-propos" />
      <main className="flex flex-col gap-6 px-4 pt-6 pb-4">
        <section className="flex flex-col gap-2">
          <h1 className="font-titre text-[26px] leading-tight font-bold tracking-tight">
            À propos
          </h1>
          <p className="text-sm leading-relaxed text-texte-doux">
            Nintendo DB recense les jeux édités par Nintendo et sortis en boîte,
            version par version : jaquette, titre, date et code produit au
            Japon, en Amérique du Nord et en Europe. Consoles couvertes :
            GameCube, Wii U, Wii, DS, 3DS, Switch et Switch 2 ; les autres
            suivront.
          </p>
        </section>

        <section
          aria-labelledby="mentions"
          className="flex flex-col gap-2 rounded-xl border border-bordure bg-carte p-4"
        >
          <h2 id="mentions" className="text-[15px] font-bold">
            Site de fan, non affilié à Nintendo
          </h2>
          <p className="text-sm leading-relaxed text-texte-doux">
            Nintendo DB est un projet personnel et non commercial. Il n&apos;est
            ni affilié à Nintendo, ni approuvé ou soutenu par Nintendo.
          </p>
          <p className="text-sm leading-relaxed text-texte-doux">
            Nintendo, Wii U et les noms des jeux sont des marques de leurs
            propriétaires respectifs. Les titres, jaquettes et visuels
            appartiennent à leurs éditeurs ; ils sont montrés ici à titre
            documentaire.
          </p>
        </section>

        <section aria-labelledby="sources" className="flex flex-col gap-3">
          <h2 id="sources" className="text-[15px] font-bold">
            Sources des données
          </h2>
          <ul className="flex flex-col gap-3">
            {SOURCES.map((s) => (
              <li
                key={s.nom}
                className="flex flex-col gap-1.5 rounded-xl border border-bordure bg-carte p-4"
              >
                <h3 className="text-sm font-semibold">
                  <a href={s.lien} className={LIEN}>
                    {s.nom}
                  </a>
                </h3>
                <p className="text-sm leading-relaxed text-texte-doux">
                  {s.apport}
                </p>
                <p className="text-xs leading-relaxed text-texte-discret">
                  {s.licence}{" "}
                  <a href={s.licenceLien} className={LIEN}>
                    Conditions
                  </a>
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-texte-discret">
            Chaque fiche cite ses sources et la provenance de ses jaquettes.
            Certaines informations sont corrigées ou complétées à la main ; une
            jaquette peut aussi être une photo personnelle d&apos;une boîte.
          </p>
        </section>
      </main>
    </>
  );
}
