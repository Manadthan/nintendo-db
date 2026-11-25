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
      "Listes des jeux NES, Game Boy, Super Nintendo, Virtual Boy, Nintendo 64, Game Boy Color, Game Boy Advance, Wii U et Switch 2, titres, dates de sortie, éditeurs et développeurs (articles « List of … games », en anglais). Les jaquettes japonaises de la Switch 2 sont des photos ajoutées à la main.",
    licence:
      "Texte sous licence Creative Commons Attribution – Partage dans les mêmes conditions (CC BY-SA 4.0).",
    licenceLien: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
  },
  {
    nom: "libretro-thumbnails",
    lien: "https://github.com/libretro-thumbnails",
    apport:
      "Scans des boîtes par région pour la NES, le Game Boy, la Super Nintendo, le Virtual Boy, la Nintendo 64, la Game Boy Color et la Game Boy Advance, que GameTDB ne couvre pas ; leurs codes produit viennent des numéros de série No-Intro de libretro-database, qui relient aussi les versions japonaises, américaines et européennes d'un même jeu.",
    licence:
      "Collection libre, sans licence formelle. Les images des boîtes restent la propriété de leurs éditeurs ; retrait sur demande.",
    licenceLien: "https://github.com/libretro-thumbnails",
  },
  {
    nom: "gamecartdb",
    lien: "https://gamecartdb.com/",
    apport:
      "Boîtes américaines et européennes des jeux Switch 2, que ni GameTDB ni libretro-thumbnails ne couvrent.",
    licence:
      "Reprises avec mention de la source. Les images des boîtes restent la propriété de leurs éditeurs ; retrait sur demande.",
    licenceLien: "https://gamecartdb.com/terms",
  },
  {
    nom: "Nintendo",
    lien: "https://www.nintendo.com/fr-fr/",
    apport:
      "Boîtes européennes officielles (PEGI) de jeux Wii U et Switch dont GameTDB n'a pas de boîte française.",
    licence:
      "Images reprises avec mention de la source ; elles restent la propriété de Nintendo ; retrait sur demande.",
    licenceLien: "https://www.nintendo.com/fr-fr/",
  },
  {
    nom: "ScreenScraper",
    lien: "https://www.screenscraper.fr/",
    apport:
      "Boîtes par région de jeux dont aucune autre source n'avait la jaquette, surtout des versions japonaises Game Boy, NES, Game Boy Advance et Super Nintendo.",
    licence:
      "Reprises avec l'accord du site et mention de la source. Les images des boîtes restent la propriété de leurs éditeurs ; retrait sur demande.",
    licenceLien: "https://www.screenscraper.fr/",
  },
  {
    nom: "RAWG",
    lien: "https://rawg.io/",
    apport:
      "Captures des jeux affichées sur les fiches (6 au plus par jeu), retrouvées par le titre et la console ; les images sont chargées depuis RAWG.",
    licence:
      "API RAWG, gratuite à condition de citer RAWG avec un lien sur chaque page qui montre ses données. Les captures restent la propriété de leurs éditeurs.",
    licenceLien: "https://rawg.io/apidocs",
  },
  {
    nom: "NDL Search",
    lien: "https://ndlsearch.ndl.go.jp/",
    apport:
      "Liste des guides de jeu japonais (攻略本) : titre, éditeur, date de parution, pages et ISBN, d'après le catalogue de la Bibliothèque nationale de la Diète (Japon).",
    licence:
      "API publique de NDL Search ; chaque page de guide renvoie à sa notice.",
    licenceLien: "https://ndlsearch.ndl.go.jp/help/api",
  },
  {
    nom: "Google Books",
    lien: "https://books.google.com/",
    apport:
      "Couvertures des guides japonais, chargées depuis Google Books (jamais copiées ici), avec un lien vers la page de chaque livre.",
    licence:
      "API Google Books, avec la mention « powered by Google » à côté des couvertures. Les couvertures restent la propriété de leurs éditeurs.",
    licenceLien: "https://developers.google.com/books/terms",
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
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-4">
        <section className="flex flex-col gap-2">
          <h1 className="font-titre text-[26px] leading-tight font-bold tracking-tight">
            À propos
          </h1>
          <p className="text-sm leading-relaxed text-texte-doux">
            Nintendo DB recense les jeux édités par Nintendo et sortis en boîte,
            version par version : jaquette, titre, date et code produit au
            Japon, en Amérique du Nord et en Europe. Consoles couvertes : NES,
            Game Boy, Super Nintendo, Virtual Boy, Nintendo 64, Game Boy Color,
            Game Boy Advance, GameCube, Wii U, Wii, DS, 3DS, Switch et Switch 2
            ; les autres suivront.
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
