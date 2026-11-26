import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CouvertureGuide,
  MentionCouverture,
} from "@/components/CouvertureGuide";
import { EnTete } from "@/components/EnTete";
import { Jaquette } from "@/components/Jaquette";
import { RetourCatalogue } from "@/components/RetourCatalogue";
import { formaterDate } from "@/lib/catalogue/catalogue";
import { chargerGuide, listerGuides } from "@/lib/guides/charger";
import { adresseGoogleBooks, liensAchat } from "@/lib/guides/guides";
import {
  consolesDuGuide,
  donneesGuide,
  estIsbn13,
  libelleParution,
  metadonneesGuide,
} from "@/lib/guides/page";
import { cheminFiche, jsonPourScript } from "@/lib/referencement/referencement";

// Pages préparées à l'avance comme les fiches (ADR-19 point 5), régénérées au plus toutes les 5 minutes ;
// un guide ajouté après le build est préparé à sa première visite.
export const revalidate = 300;

type Params = { isbn: string };

export async function generateStaticParams(): Promise<Params[]> {
  return listerGuides();
}

async function lire(isbn: string) {
  return estIsbn13(isbn) ? chargerGuide(isbn) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const guide = await lire((await params).isbn);
  if (!guide) return { title: "Guide introuvable · Nintendo DB" };
  return metadonneesGuide(guide);
}

function Info({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div>
      <dt className="text-xs text-texte-discret">{libelle}</dt>
      <dd className="mt-0.5 text-sm font-medium">{valeur ?? "—"}</dd>
    </div>
  );
}

const LIEN_EXTERNE = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

// Page d'un guide japonais (US-27), adresse stable /guides/{isbn}.
export default async function PageGuide({
  params,
}: {
  params: Promise<Params>;
}) {
  const guide = await lire((await params).isbn);
  if (!guide) notFound();
  const achat = liensAchat(guide.isbn);
  const annee = guide.date?.slice(0, 4) ?? null;

  return (
    <>
      <EnTete />
      <script
        type="application/ld+json"
        // Données structurées schema.org Book ; JSON échappé, sans balise fermante possible.
        dangerouslySetInnerHTML={{
          __html: jsonPourScript(donneesGuide(guide)),
        }}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pt-2 pb-7">
        <RetourCatalogue />

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-x-12">
          <div className="flex flex-col items-center gap-2 lg:sticky lg:top-[72px]">
            <div className="w-full max-w-[300px] drop-shadow-[0_10px_14px_rgba(22,24,29,0.16)]">
              <CouvertureGuide
                couverture={guide.couverture}
                titre={guide.titre}
                legende={[guide.editeur, annee].filter(Boolean).join(" · ")}
              />
            </div>
            <MentionCouverture
              sources={guide.couverture ? [guide.couverture.source] : []}
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="flex h-6 items-center rounded-md border border-accent-doux bg-accent-doux px-2 text-xs font-semibold text-accent-fonce">
                  Guide
                </span>
                {consolesDuGuide(guide).map((c) => (
                  <span
                    key={c.slug}
                    className="flex h-6 items-center rounded-md bg-texte px-2 text-xs font-semibold text-inverse"
                  >
                    {c.nom}
                  </span>
                ))}
              </div>
              <h1
                lang="ja"
                className="font-titre text-2xl leading-tight font-bold tracking-tight"
              >
                {guide.titre}
              </h1>
              <p className="text-[15px] font-semibold text-accent-fonce">
                {libelleParution(guide)}
                {guide.editeur && ` · ${guide.editeur}`}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5 rounded-xl border border-bordure bg-carte p-3.5">
              <Info libelle="Éditeur" valeur={guide.editeur} />
              <Info
                libelle="Parution"
                valeur={
                  guide.date ? formaterDate(guide.date, guide.precision) : null
                }
              />
              <Info libelle="ISBN" valeur={guide.isbn} />
              <Info
                libelle="Pages"
                valeur={guide.pages ? String(guide.pages) : null}
              />
            </dl>

            {guide.jeux.length > 0 && (
              <section
                aria-labelledby="jeux-couverts"
                className="flex flex-col gap-2.5"
              >
                <h2 id="jeux-couverts" className="text-[15px] font-bold">
                  {guide.jeux.length > 1 ? "Jeux couverts" : "Jeu couvert"}
                </h2>
                <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
                  {guide.jeux.map((j) => (
                    <li
                      key={`${j.console.slug}/${j.slug}`}
                      className="border-t border-separateur first:border-t-0"
                    >
                      <Link
                        href={cheminFiche(j.console.slug, j.slug)}
                        className="flex items-center gap-3 px-3.5 py-3"
                      >
                        <span className="w-14 shrink-0">
                          <Jaquette
                            sortie={j.sortie}
                            titre={j.titre}
                            console={j.console.nom}
                            consoleSlug={j.console.slug}
                            sizes="56px"
                            petite
                          />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-semibold">
                            {j.titre}
                          </span>
                          <span className="text-[13px] text-texte-doux">
                            {[j.console.nom, j.annee]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="font-bold text-accent"
                        >
                          ›
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section
              aria-labelledby="acheter"
              className="flex flex-col gap-2.5"
            >
              <h2 id="acheter" className="text-[15px] font-bold">
                Acheter
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={achat.amazon}
                  {...LIEN_EXTERNE}
                  className="flex h-11 items-center justify-center rounded-xl border border-accent text-sm font-semibold text-accent"
                >
                  Amazon Japon ›
                </a>
                <a
                  href={achat.surugaya}
                  {...LIEN_EXTERNE}
                  className="flex h-11 items-center justify-center rounded-xl border border-accent text-sm font-semibold text-accent"
                >
                  Suruga-ya ›
                </a>
              </div>
              <p className="text-xs text-texte-discret">
                Recherche de l&apos;ISBN dans un nouvel onglet ; Suruga-ya :
                occasion.
              </p>
            </section>

            {guide.googleBooksId && (
              <a
                href={adresseGoogleBooks(guide.googleBooksId)}
                {...LIEN_EXTERNE}
                className="flex h-12 items-center justify-between rounded-xl border border-bordure bg-carte px-3.5 text-sm"
              >
                Fiche du livre
                <span className="font-semibold text-accent">
                  Google Books ›
                </span>
              </a>
            )}

            <p className="text-xs leading-relaxed text-texte-discret">
              Sources : liste des guides :{" "}
              {guide.ndlUrl ? (
                <a
                  href={guide.ndlUrl}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  Bibliothèque nationale de la Diète (NDL Search)
                </a>
              ) : (
                "Bibliothèque nationale de la Diète (NDL Search)"
              )}
              {guide.couverture &&
                ` · couverture : ${guide.couverture.source === "amazon" ? "Amazon.co.jp" : "Google Books"}`}
              . Site de fan non affilié à Nintendo.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
