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
 * Jaquette d'une sortie (proportions d'une boîte Wii U, jamais recadrée), chargée au fil du défilement.
 * Sans jaquette (avant l'import, étape 4) : vignette neutre avec le titre et la console (US-12).
 */
export function Jaquette({
  sortie,
  titre,
  console,
  sizes,
  petite = false,
}: Props) {
  if (sortie.jaquetteSrcset) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-04), pas de relais
      <img
        srcSet={sortie.jaquetteSrcset}
        sizes={sizes}
        alt={`Jaquette de ${titre}`}
        loading="lazy"
        decoding="async"
        className="aspect-[27/38] w-full rounded-md border border-vignette-bordure bg-vignette object-contain"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${titre} — jaquette à venir`}
      className="flex aspect-[27/38] w-full flex-col overflow-hidden rounded-md border border-vignette-bordure bg-vignette"
    >
      <div
        className={`flex items-center bg-vignette-bandeau px-2 font-bold tracking-wider text-white ${petite ? "h-2" : "h-[18px] text-[9px]"}`}
      >
        {!petite && console.toUpperCase()}
      </div>
      {!petite && (
        <div className="flex flex-1 items-center justify-center p-2.5 text-center text-[11px] leading-snug text-texte-doux">
          {titre}
        </div>
      )}
    </div>
  );
}
