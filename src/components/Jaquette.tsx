import type { SortieCatalogue } from "@/lib/catalogue/types";

type Props = {
  sortie: SortieCatalogue;
  titre: string;
  console: string;
  /** Largeur affichée, pour que le navigateur choisisse la bonne taille d'image (ADR-04). */
  sizes: string;
  petite?: boolean;
};

/**
 * Jaquette d'une sortie dans un cadre de boîte Wii U (MAQUETTES v0.3) : bandeau bleu « Wii U » en haut, puis
 * l'illustration, jamais recadrée, chargée au fil du défilement. Les jaquettes IGDB n'ont pas ce bandeau et sont
 * un peu moins hautes qu'une boîte : bandeau + illustration retrouvent les proportions 27 × 38.
 * Sans jaquette : vignette neutre avec le titre (US-12).
 */
export function Jaquette({
  sortie,
  titre,
  console,
  sizes,
  petite = false,
}: Props) {
  return (
    <div
      role={sortie.jaquetteSrcset ? undefined : "img"}
      aria-label={
        sortie.jaquetteSrcset ? undefined : `${titre} — jaquette à venir`
      }
      className="@container flex aspect-[27/38] w-full flex-col overflow-hidden rounded-md border border-[#cdd1d9] bg-[#d9dde4]"
    >
      {/* Décor : le texte « Wii U » ne remplace pas le titre, d'où aria-hidden. Taille relative à la vignette. */}
      <div
        aria-hidden="true"
        data-bandeau=""
        className="flex h-[7.5%] shrink-0 items-center bg-[#0096d6] px-[6cqw] font-titre text-[6.5cqw] leading-none font-bold text-white"
      >
        {!petite && console}
      </div>
      {sortie.jaquetteSrcset ? (
        <div className="min-h-0 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-04), pas de relais */}
          <img
            srcSet={sortie.jaquetteSrcset}
            sizes={sizes}
            alt={`Jaquette de ${titre}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        !petite && (
          <div className="flex flex-1 items-center justify-center p-[8cqw] text-center text-[8cqw] leading-snug text-texte-doux">
            {titre}
          </div>
        )
      )}
    </div>
  );
}
