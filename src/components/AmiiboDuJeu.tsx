import Link from "next/link";
import {
  cheminAmiibo,
  SOURCE_AMIIBOAPI,
  type AmiiboDuJeu,
} from "@/lib/amiibo/fiche";
import { ImageAmiibo } from "./ImageAmiibo";

/**
 * Bloc « Amiibo (N) » de la fiche du jeu (US-29, maquette amiibo-jeu.png) : les amiibo que le jeu lit, en bande à
 * faire défiler de côté, chacun menant à sa fiche ; rien si le jeu n'en lit aucun.
 */
export function AmiiboDuJeuBloc({ amiibo }: { amiibo: AmiiboDuJeu[] }) {
  if (amiibo.length === 0) return null;
  return (
    <section aria-labelledby="amiibo" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="amiibo" className="text-[15px] font-bold">
          Amiibo ({amiibo.length})
        </h2>
        {amiibo.length > 3 && (
          <span className="text-xs text-texte-discret">faire défiler ›</span>
        )}
      </div>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {amiibo.map((a) => (
          <li
            key={a.slug}
            className="w-[30%] max-w-[140px] shrink-0 snap-start"
          >
            <Link href={cheminAmiibo(a.slug)} className="flex flex-col gap-1.5">
              <ImageAmiibo base={a.image} alt={a.nom} sizes="140px" />
              <span className="text-[13px] leading-tight font-semibold">
                {a.nom}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-texte-discret">
        Amiibo :{" "}
        <a
          href={SOURCE_AMIIBOAPI}
          className="text-accent underline-offset-2 hover:underline"
        >
          AmiiboAPI
        </a>
      </p>
    </section>
  );
}
