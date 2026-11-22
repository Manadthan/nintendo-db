import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Badges } from "@/components/Badges";
import { DerniersAjouts, MaCollection } from "@/components/CollectionProfil";
import { EnTete } from "@/components/EnTete";
import { chargerProfilPublic } from "@/lib/profil/public";

// Profil public (US-23, ADR-16 point 4) : préparé à la première visite, gardé 5 minutes au plus, et refait aussitôt
// quand son propriétaire le rend privé ou change de pseudo (revalidatePath, actions/profil.ts).
export const revalidate = 300;

type Params = { pseudo: string };

/** Aucun profil préparé au build : ils ne sont listés nulle part (ni plan du site, ni lien public). */
export async function generateStaticParams(): Promise<Params[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pseudo } = await params;
  return {
    title: `${decodeURIComponent(pseudo)} · Collectionneurs · Nintendo DB`,
    robots: { index: false, follow: false },
  };
}

const moisAnnee = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export default async function PageProfilPublic({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pseudo } = await params;
  const demande = decodeURIComponent(pseudo);
  // Adresse en minuscules seulement (cheminPublic) ; privé ou inconnu : la même page « introuvable » (on ne peut
  // pas savoir si le compte existe).
  if (demande !== demande.toLowerCase()) notFound();
  const profil = await chargerProfilPublic(demande);
  if (!profil) notFound();

  return (
    <>
      <EnTete />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-6 pb-8">
        <section
          aria-label="Profil"
          className="flex items-center gap-4 rounded-xl border border-bordure bg-carte p-4"
        >
          <Avatar id={profil.avatar} taille={72} nomme />
          <div className="min-w-0">
            <h1 className="truncate font-titre text-[26px] leading-tight font-bold tracking-tight">
              {profil.pseudo}
            </h1>
            <p className="text-sm text-texte-doux">
              Collectionneur depuis {moisAnnee(profil.creeLe)}
            </p>
          </div>
        </section>
        <Badges gagnes={profil.badges.gagnes} prochains={[]} publique />
        <MaCollection
          resume={profil.resume}
          badges={profil.badges.gagnes.length}
          publique
        />
        <DerniersAjouts ajouts={profil.ajouts} />
        {profil.parConsole.map(({ console, jeux }) => (
          <section
            key={console.slug}
            aria-label={`Jeux ${console.nom}`}
            className="flex flex-col gap-2 rounded-xl border border-bordure bg-carte p-4"
          >
            <h2 className="font-titre text-lg font-bold">
              {console.nom}{" "}
              <span className="text-sm font-normal text-texte-doux">
                · {jeux.length} jeu{jeux.length > 1 ? "x" : ""}
              </span>
            </h2>
            <ul className="flex flex-col text-sm">
              {jeux.map((j) => (
                <li
                  key={j.id}
                  className="border-t border-separateur py-2 first:border-t-0"
                >
                  {j.href ? (
                    <Link href={j.href} className="hover:text-accent">
                      {j.titre}
                    </Link>
                  ) : (
                    j.titre
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
