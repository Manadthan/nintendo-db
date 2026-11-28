import Link from "next/link";
import type { AnneeFrise } from "@/lib/catalogue/frise";
import { titreAffiche } from "@/lib/catalogue/titre";
import type { VersionAffichee } from "@/lib/catalogue/types";
import {
  EtiquettesAmiibo,
  ImageCarteAmiibo,
  MarquePossede,
  MarqueSouhait,
} from "./CarteAmiibo";
import { CouvertureCarte, EtiquettesGuide } from "./CarteGuide";
import { EtiquetteAVenir } from "./EtiquetteAVenir";
import { Jaquette } from "./Jaquette";
import { NoteMetacritic } from "./NoteMetacritic";

/**
 * Vue « Frise » du catalogue (US-02, SPEC v1.38, maquette `docs/maquettes/frise.png`) : une ligne verticale, l'année
 * seule au centre (collée sous l'en-tête pendant le défilement), les jeux en alternance à gauche et à droite, chacun
 * avec sa grande jaquette, puis son titre et sa console.
 */
export function Frise({
  annees,
  lien,
  surClic,
  aVenir,
  amiiboPossede = () => false,
  amiiboSouhaite = () => false,
  guidePossede = () => false,
  guideSouhaite = () => false,
}: {
  annees: AnneeFrise[];
  lien: (v: VersionAffichee) => string;
  /** Jeu annoncé (US-32) : étiquette « À venir » à côté de la console. */
  aVenir: (v: VersionAffichee) => boolean;
  /** Mémorise la position du catalogue avant d'ouvrir une fiche. */
  surClic: () => void;
  /** Amiibo possédé (US-30) : marque verte sur la photo. */
  amiiboPossede?: (v: VersionAffichee) => boolean;
  /** Amiibo en liste de souhaits : marque rose sur la photo. */
  amiiboSouhaite?: (v: VersionAffichee) => boolean;
  /** Guide possédé : marque verte sur la couverture. */
  guidePossede?: (v: VersionAffichee) => boolean;
  /** Guide en liste de souhaits : marque rose sur la couverture. */
  guideSouhaite?: (v: VersionAffichee) => boolean;
}) {
  return (
    <ol className="relative mx-auto w-full max-w-2xl before:absolute before:inset-y-0 before:left-1/2 before:-ml-px before:w-0.5 before:bg-filet">
      {annees.map(({ annee, jeux }) => (
        <li key={annee}>
          <h3 className="sticky top-14 z-10 py-3 text-center">
            <span className="inline-block rounded-full bg-accent px-4 py-1 text-base font-extrabold text-inverse shadow-[0_0_0_4px_var(--color-fond)]">
              {annee}
            </span>
            <span className="sr-only">
              {" "}
              · {jeux.length} jeu{jeux.length > 1 ? "x" : ""}
            </span>
          </h3>
          <ol>
            {jeux.map(({ version: v, cote }) => (
              <li
                key={v.guide?.isbn ?? v.jeu.id}
                data-cote={cote}
                className={`relative flex pb-3 [&:not(:last-child)]:-mb-20 ${
                  cote === "droite" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Trait et point sur la ligne, à hauteur de la jaquette. */}
                <span
                  aria-hidden="true"
                  className={`absolute top-[38%] h-0.5 w-3.5 bg-filet ${
                    cote === "droite"
                      ? "right-[calc(50%-20px)]"
                      : "left-[calc(50%-20px)]"
                  }`}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-[38%] left-1/2 -mt-[5px] -ml-[5px] size-2.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--color-fond)]"
                />
                <Link
                  href={lien(v)}
                  onClick={surClic}
                  className="group flex w-[calc(50%-20px)] flex-col gap-1"
                >
                  {v.guide ? (
                    <div className="relative">
                      <CouvertureCarte v={v} />
                      {guidePossede(v) ? (
                        <MarquePossede surPhoto />
                      ) : (
                        guideSouhaite(v) && <MarqueSouhait surPhoto />
                      )}
                    </div>
                  ) : v.amiibo ? (
                    <div className="relative">
                      <ImageCarteAmiibo
                        v={v}
                        sizes="(max-width: 672px) 45vw, 300px"
                        forme="carree"
                      />
                      {amiiboPossede(v) ? (
                        <MarquePossede surPhoto />
                      ) : (
                        amiiboSouhaite(v) && <MarqueSouhait surPhoto />
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <Jaquette
                        sortie={v.sortie}
                        titre={titreAffiche(v)}
                        console={v.jeu.console.nom}
                        consoleSlug={v.jeu.console.slug}
                        sizes="(max-width: 672px) 45vw, 300px"
                        // Grande jaquette à sa forme réelle (boîtes N64 européennes à l'horizontale, cartes carrées…).
                        formeReelle
                      />
                      <NoteMetacritic note={v.jeu.metacritic} />
                    </div>
                  )}
                  <span className="mt-1 text-sm leading-tight font-semibold group-hover:underline">
                    {titreAffiche(v)}
                  </span>
                  {v.guide ? (
                    <span className="flex flex-wrap gap-1">
                      <EtiquettesGuide v={v} />
                    </span>
                  ) : v.amiibo ? (
                    <span className="flex flex-wrap items-center gap-1">
                      {aVenir(v) && <EtiquetteAVenir />}
                      <EtiquettesAmiibo v={v} />
                    </span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-1 text-xs text-texte-discret">
                      {aVenir(v) && <EtiquetteAVenir />}
                      {v.jeu.console.nom}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
