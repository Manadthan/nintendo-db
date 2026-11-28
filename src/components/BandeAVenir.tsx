import Link from "next/link";
import { CARTES_BANDE } from "@/lib/catalogue/a-venir";
import { formaterDateCourte } from "@/lib/catalogue/catalogue";
import { titreAffiche } from "@/lib/catalogue/titre";
import type { VersionAffichee } from "@/lib/catalogue/types";
import { Jaquette } from "./Jaquette";

/**
 * Bande « À venir » de l'accueil (US-32, maquette `docs/maquettes/a-venir.png`) : les prochaines sorties, la plus
 * proche d'abord, à faire défiler de côté (CSS seul, ADR-20 point 4). Rien s'il n'y a rien à venir.
 */
export function BandeAVenir({ versions }: { versions: VersionAffichee[] }) {
  if (versions.length === 0) return null;
  return (
    // Dans la section du catalogue, au-dessus de « Tous les jeux » ; la bande va jusqu'aux bords de l'écran.
    <section
      aria-labelledby="a-venir"
      className="-mx-4 flex flex-col gap-2.5 pb-3"
    >
      <div className="flex items-baseline gap-2 px-4">
        <h2 id="a-venir" className="font-titre text-[21px] font-bold">
          À venir
        </h2>
        <span className="text-[15px] font-semibold text-texte-discret">
          {versions.length}
        </span>
      </div>
      <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
        {versions.slice(0, CARTES_BANDE).map((v) => (
          <li key={v.jeu.id} className="w-[132px] shrink-0 snap-start">
            <Link
              href={`/jeux/${v.jeu.console.slug}/${v.jeu.slug}`}
              className="group flex flex-col gap-1.5"
            >
              <div className="relative">
                <Jaquette
                  sortie={v.sortie}
                  titre={titreAffiche(v)}
                  console={v.jeu.console.nom}
                  consoleSlug={v.jeu.console.slug}
                  sizes="132px"
                />
                <span className="absolute bottom-1.5 left-1.5 rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-inverse">
                  {formaterDateCourte(v.sortie.date, v.sortie.precision)}
                </span>
              </div>
              <span className="line-clamp-2 text-[13px] leading-tight font-semibold group-hover:underline">
                {titreAffiche(v)}
              </span>
              <span className="text-xs text-texte-discret">
                {v.jeu.console.nom}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
